import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export const sendMessage = async (roomId, senderId, messageText, replyTo = null, mediaData = null) => {
  try {
    const messageData = {
      room_id: roomId,
      sender_id: senderId,
      message_text: messageText ? messageText.trim() : "",
      timestamp: serverTimestamp(),
      status: "sent", // sent, seen
      reactions: {},
    };

    if (replyTo) {
      messageData.reply_to = replyTo; // { id, text, senderName }
    }

    if (mediaData) {
      messageData.media_url = mediaData.url;
      messageData.media_type = mediaData.type; // 'image', 'video', 'audio'
      if (mediaData.duration) {
        messageData.duration = mediaData.duration;
      }
    }

    await addDoc(collection(db, "messages"), messageData);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const toggleReaction = async (messageId, userId, emoji) => {
  try {
    const msgRef = doc(db, "messages", messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const currentData = snap.data();
      const currentReactions = currentData.reactions || {};
      const newReactions = { ...currentReactions };
      if (newReactions[userId] === emoji) {
        delete newReactions[userId];
      } else {
        newReactions[userId] = emoji;
      }
      await updateDoc(msgRef, { reactions: newReactions });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
};

export const setTypingStatus = async (roomId, userId, isTyping) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    // Use an object update to be more efficient and avoid issues with missing top-level field
    await updateDoc(roomRef, {
      [`typing_status.${userId}`]: isTyping,
    });
  } catch (error) {
    // If updateDoc fails (e.g. typing_status doesn't exist on older rooms), fallback to setDoc
    try {
      const roomRef = doc(db, "rooms", roomId);
      await setDoc(roomRef, {
        typing_status: {
          [userId]: isTyping
        }
      }, { merge: true });
    } catch (innerError) {
       console.warn("Silent error updating typing status:", innerError);
    }
  }
};

export const subscribeToTypingStatus = (roomId, callback) => {
  const roomRef = doc(db, "rooms", roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().typing_status || {});
    }
  });
};

export const markMessagesAsSeen = async (roomId, currentUserId) => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("room_id", "==", roomId),
      where("sender_id", "!=", currentUserId),
      where("status", "==", "sent")
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((messageDoc) => {
      batch.update(messageDoc.ref, { status: "seen" });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as seen:", error);
  }
};

export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = collection(db, "messages");
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

