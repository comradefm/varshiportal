import { db } from "./firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

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
  private unsubs: (() => void)[] = [];
  private onConnectionState?: (state: RTCIceConnectionState) => void;

  constructor(roomId: string) {
    this.pc = new RTCPeerConnection(servers);
    this.roomId = roomId;
    this.callId = "current_call";

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

    const callDoc = doc(db, "rooms", this.roomId, "call", this.callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
      senderId: userId,
      createdAt: serverTimestamp()
    };

    await setDoc(callDoc, { offer });

    // Listen for answer
    const unsubAnswer = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!this.pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answerDescription).then(() => {
          this.processQueuedCandidates();
        });
      }
    });
    this.unsubs.push(unsubAnswer);

    // Listen for ICE candidates from the answerer
    const unsubIce = onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          this.addCandidate(change.doc.data());
        }
      });
    });
    this.unsubs.push(unsubIce);
  }

  async answerCall(localStream: MediaStream | null, userId: string) {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, localStream);
      });
    }

    const callDoc = doc(db, "rooms", this.roomId, "call", this.callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = (await getDoc(callDoc)).data();
    const offerDescription = callData?.offer;
    if (!offerDescription) throw new Error("No offer found to answer");

    await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
    await this.processQueuedCandidates();

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
      senderId: userId,
      createdAt: serverTimestamp()
    };

    await updateDoc(callDoc, { answer });

    const unsubIce = onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          this.addCandidate(change.doc.data());
        }
      });
    });
    this.unsubs.push(unsubIce);
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.pc.ontrack = (event) => {
      console.log(`[CallSession] Remote track received: ${event.track.kind}`);
      if (event.streams && event.streams[0]) {
        console.log("[CallSession] Using event.streams[0]");
        callback(event.streams[0]);
      } else {
        console.log("[CallSession] Fallback: creating new MediaStream from track");
        const inboundStream = new MediaStream();
        inboundStream.addTrack(event.track);
        callback(inboundStream);
      }
    };
  }

  async cleanup() {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
    if (this.pc.signalingState !== "closed") {
      this.pc.close();
    }
  }

  async endCall() {
    await this.cleanup();
    const callDoc = doc(db, "rooms", this.roomId, "call", this.callId);
    
    try {
      const offerCandidates = await getDocs(collection(callDoc, "offerCandidates"));
      await Promise.all(offerCandidates.docs.map(d => deleteDoc(d.ref)));
      
      const answerCandidates = await getDocs(collection(callDoc, "answerCandidates"));
      await Promise.all(answerCandidates.docs.map(d => deleteDoc(d.ref)));
      
      await deleteDoc(callDoc);
    } catch (e) {
      console.error("Cleanup failed", e);
    }
  }
}
