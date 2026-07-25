import { supabase } from "@/lib/supabaseClient";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export class CallSession {
  pc: RTCPeerConnection;
  roomId: string;
  callId: string;
  iceCandidateQueue: any[] = [];
  private channel: any;
  private onConnectionState?: (state: RTCIceConnectionState) => void;

  constructor(roomId: string) {
    this.pc = new RTCPeerConnection(servers);
    this.roomId = roomId;
    this.callId = "current_call";

    // Use Supabase Realtime Broadcast for signaling
    this.channel = supabase.channel(`call_${roomId}`, { config: { broadcast: { self: false } } });

    this.pc.oniceconnectionstatechange = () => {
      this.onConnectionState?.(this.pc.iceConnectionState);
    };
  }

  onConnectionStateChange(callback: (state: RTCIceConnectionState) => void) {
    this.onConnectionState = callback;
  }

  private async addCandidate(candidate: any) {
    try {
      if (!candidate || !candidate.candidate) return;
      if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        this.iceCandidateQueue.push(candidate);
      }
    } catch (e) {
      console.error("Error adding ice candidate", e);
    }
  }

  private async processQueuedCandidates() {
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Failed candidate queue:", err);
        }
      }
    }
  }

  async createOffer(localStream: MediaStream | null, userId: string) {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, localStream);
      });
    }

    // Collect ICE candidates and broadcast them
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.channel.send({
          type: "broadcast",
          event: "ice_candidate",
          payload: { candidate: event.candidate.toJSON(), role: "offer" },
        });
      }
    };

    // Listen for answer and ICE candidates from answerer
    this.channel.on("broadcast", { event: "answer" }, async ({ payload }: any) => {
      if (!this.pc.currentRemoteDescription && payload?.sdp) {
        const answerDescription = new RTCSessionDescription(payload);
        await this.pc.setRemoteDescription(answerDescription);
        await this.processQueuedCandidates();
      }
    });

    this.channel.on("broadcast", { event: "ice_candidate" }, async ({ payload }: any) => {
      if (payload?.role === "answer" && payload?.candidate) {
        await this.addCandidate(payload.candidate);
      }
    });

    await this.channel.subscribe();

    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    // Also store the offer in the database for late-joining answerers
    await supabase.from("calls").upsert([{
      room_id: this.roomId,
      offer_sdp: offerDescription.sdp,
      offer_type: offerDescription.type,
      sender_id: userId,
      created_at: new Date().toISOString(),
      answer_sdp: null,
      answer_type: null,
    }]);

    // Broadcast offer for immediate pickup
    await this.channel.send({
      type: "broadcast",
      event: "offer",
      payload: { sdp: offerDescription.sdp, type: offerDescription.type, senderId: userId, createdAt: Date.now() },
    });
  }

  async answerCall(localStream: MediaStream | null, userId: string) {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, localStream);
      });
    }

    // Collect ICE candidates and broadcast
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.channel.send({
          type: "broadcast",
          event: "ice_candidate",
          payload: { candidate: event.candidate.toJSON(), role: "answer" },
        });
      }
    };

    // Listen for offerer's ICE candidates
    this.channel.on("broadcast", { event: "ice_candidate" }, async ({ payload }: any) => {
      if (payload?.role === "offer" && payload?.candidate) {
        await this.addCandidate(payload.candidate);
      }
    });

    await this.channel.subscribe();

    // Retrieve the offer from the database
    const { data: callData } = await supabase.from("calls").select("*").eq("room_id", this.roomId).single();
    if (!callData?.offer_sdp) throw new Error("No offer found to answer");

    const offerDescription: RTCSessionDescriptionInit = { sdp: callData.offer_sdp, type: callData.offer_type as RTCSdpType };
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
    await this.processQueuedCandidates();

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

    // Store answer in DB and broadcast
    await supabase.from("calls").update({
      answer_sdp: answerDescription.sdp,
      answer_type: answerDescription.type,
      answerer_id: userId,
    }).eq("room_id", this.roomId);

    await this.channel.send({
      type: "broadcast",
      event: "answer",
      payload: { sdp: answerDescription.sdp, type: answerDescription.type, senderId: userId },
    });
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.pc.ontrack = (event) => {
      console.log(`[CallSession] Remote track received: ${event.track.kind}`);
      if (event.streams && event.streams[0]) {
        callback(event.streams[0]);
      } else {
        const inboundStream = new MediaStream();
        inboundStream.addTrack(event.track);
        callback(inboundStream);
      }
    };
  }

  async cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    if (this.pc.signalingState !== "closed") {
      this.pc.close();
    }
  }

  async endCall() {
    await this.cleanup();
    try {
      await supabase.from("calls").delete().eq("room_id", this.roomId);
    } catch (e) {
      console.error("Cleanup failed", e);
    }
  }
}
