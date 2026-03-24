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
  getDocs
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

  constructor(roomId: string) {
    this.pc = new RTCPeerConnection(servers);
    this.roomId = roomId;
    this.callId = "current_call"; // We'll use a fixed ID per room for simplicity
  }

  async createOffer(localStream: MediaStream) {
    localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, localStream);
    });

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
    };

    await setDoc(callDoc, { offer });

    // Listen for answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!this.pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answerDescription);
      }
    });

    // Listen for ICE candidates from the answerer
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          this.pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  async answerCall(localStream: MediaStream) {
    localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, localStream);
    });

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
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          this.pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.pc.ontrack = (event) => {
      callback(event.streams[0]);
    };
  }

  async endCall() {
    this.pc.close();
    const callDoc = doc(db, "rooms", this.roomId, "call", this.callId);
    
    // Cleanup Firestore
    try {
      const offerCandidates = await getDocs(collection(callDoc, "offerCandidates"));
      offerCandidates.forEach(async (d) => await deleteDoc(d.ref));
      
      const answerCandidates = await getDocs(collection(callDoc, "answerCandidates"));
      answerCandidates.forEach(async (d) => await deleteDoc(d.ref));
      
      await deleteDoc(callDoc);
    } catch (e) {
      console.error("Cleanup failed", e);
    }
  }
}
