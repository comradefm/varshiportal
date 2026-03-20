import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export const sendMessage = async (roomId, senderId, messageText) => {
  try {
    await addDoc(collection(db, "messages"), {
      room_id: roomId,
      sender_id: senderId,
      message_text: messageText.trim(),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = collection(db, "messages");
  // Removed orderBy to avoid requiring a composite index in Firestore.
  // We will sort them on the client side instead.
  const q = query(
    messagesRef,
    where("room_id", "==", roomId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    let messages = snapshot.docs.map((doc) => ({
      message_id: doc.id,
      ...doc.data(),
    }));

    // Client-side sort by timestamp
    messages.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || Date.now();
      const timeB = b.timestamp?.toMillis() || Date.now();
      return timeA - timeB; // Ascending
    });

    callback(messages);
  }, (error) => {
    console.error("Firestore subscription error:", error);
  });

  return unsubscribe;
};
