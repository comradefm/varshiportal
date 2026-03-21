import { db } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { joinUserToRoom } from "./firestoreService";

const generateRoomCode = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RM-${num}`;
};

export const createRoom = async (userId) => {
  try {
    const roomCode = generateRoomCode();
    const roomRef = await addDoc(collection(db, "rooms"), {
      room_code: roomCode,
      user_1: userId,
      user_2: null,
      created_at: serverTimestamp(),
    });
    // Store room_id back into the document
    await updateDoc(roomRef, { room_id: roomRef.id });
    await joinUserToRoom(userId, roomRef.id);
    return { room_id: roomRef.id, room_code: roomCode };
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const joinRoom = async (roomCode, userId) => {
  try {
    const roomsRef = collection(db, "rooms");
    const q = query(roomsRef, where("room_code", "==", roomCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Room not found. Check the code and try again.");
    }

    const roomDoc = snapshot.docs[0];
    const roomData = roomDoc.data();

    if (roomData.user_2 !== null) {
      throw new Error("This room is already full.");
    }

    if (roomData.user_1 === userId) {
      throw new Error("You cannot join your own room.");
    }

    await updateDoc(doc(db, "rooms", roomDoc.id), { user_2: userId });
    await joinUserToRoom(userId, roomDoc.id);

    return { room_id: roomDoc.id, room_code: roomCode };
  } catch (error) {
    console.error("Error joining room:", error);
    throw error;
  }
};

export const getRoomData = async (roomId) => {
  try {
    const roomDoc = await getDoc(doc(db, "rooms", roomId));
    if (roomDoc.exists()) {
      return roomDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting room data:", error);
    throw error;
  }
};

export const getUserRooms = async (userId) => {
  try {
    const { getUserData } = await import("./firestoreService");
    const userData = await getUserData(userId);
    if (!userData || !userData.rooms || userData.rooms.length === 0) return [];

    const roomPromises = userData.rooms.map(id => getRoomData(id));
    const rooms = await Promise.all(roomPromises);
    
    // Sort by created_at descending if possible
    return rooms.filter(r => r !== null).sort((a, b) => {
      const timeA = a.created_at?.toMillis() || 0;
      const timeB = b.created_at?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    return [];
  }
};

export const getPartnerData = async (roomId, currentUserId) => {
  try {
    const roomData = await getRoomData(roomId);
    if (!roomData) return null;

    const partnerId =
      roomData.user_1 === currentUserId ? roomData.user_2 : roomData.user_1;
    if (!partnerId) return null;

    const { getUserData } = await import("./firestoreService");
    return await getUserData(partnerId);
  } catch (error) {
    console.error("Error getting partner data:", error);
    throw error;
  }
};
