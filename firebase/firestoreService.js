import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

export const createUserData = async (userId, data) => {
  try {
    await setDoc(doc(db, "users", userId), {
      user_id: userId,
      room_id: null,
      created_at: serverTimestamp(),
      ...data,
    });
  } catch (error) {
    console.error("Error creating user data:", error);
    throw error;
  }
};

export const updateUserRoom = async (userId, roomId) => {
  try {
    await updateDoc(doc(db, "users", userId), { room_id: roomId });
  } catch (error) {
    console.error("Error updating user room:", error);
    throw error;
  }
};

export const updateUserNickname = async (userId, nickname) => {
  try {
    await updateDoc(doc(db, "users", userId), { nickname });
  } catch (error) {
    console.error("Error updating user nickname:", error);
    throw error;
  }
};
