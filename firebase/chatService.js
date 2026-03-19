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
  const q = query(
    messagesRef,
    where("room_id", "==", roomId),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      message_id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });

  return unsubscribe;
};
