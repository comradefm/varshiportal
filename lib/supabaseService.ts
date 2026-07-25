import { supabase } from "@/lib/supabaseClient";
import { compressImageDataUrl } from "@/lib/imageCompressor";

// ─── User Profile & Presence ──────────────────────────────────────────────────

export const getUserData = async (userId: any) => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single();
    if (error && error.code !== "PGRST116") console.warn("getUserData:", error.message);
    return data || null;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
};

export const subscribeToUserData = (userId: any, callback: any) => {
  // Initial fetch
  getUserData(userId).then(d => callback(d));
  // Realtime subscription
  const channel = supabase.channel(`user_${userId}`).on(
    "postgres_changes", { event: "*", schema: "public", table: "users", filter: `user_id=eq.${userId}` },
    (payload) => callback(payload.new)
  ).subscribe();
  return () => supabase.removeChannel(channel);
};

export const createUserData = async (userId: any, data: any) => {
  try {
    const { error } = await supabase.from("users").upsert([{ 
      user_id: userId, 
      rooms: [], 
      created_at: new Date().toISOString(), 
      ...data 
    }], { onConflict: "user_id" });
    if (error) {
      console.error("Supabase createUserData error:", error.message, error.details, error.hint);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
};

export const joinUserToRoom = async (userId: any, roomId: any) => {
  try {
    const user = await getUserData(userId);
    const rooms = user?.rooms || [];
    if (!rooms.includes(roomId)) rooms.push(roomId);
    await supabase.from("users").update({ rooms }).eq("user_id", userId);
  } catch (err) {
    console.error("Error joining user to room:", err);
    throw err;
  }
};

export const updateUserNickname = async (userId: any, nickname: any) => {
  await supabase.from("users").update({ nickname }).eq("user_id", userId);
};

export const updateUserExamTarget = async (userId: any, examTarget: any) => {
  await supabase.from("users").update({ examTarget }).eq("user_id", userId);
};

export const updateAlwaysOnVideo = async (userId: any, enabled: any) => {
  await supabase.from("users").update({ alwaysOnVideo: enabled }).eq("user_id", userId);
};

export const updateUserPresence = async (userId: any, isOnline: any) => {
  try {
    await supabase.from("users").upsert([{ user_id: userId, isOnline, lastActive: new Date().toISOString() }]);
  } catch (err) {
    console.warn("Error updating presence:", err);
  }
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

const generateRoomCode = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RM-${num}`;
};

export const createRoom = async (userId: any) => {
  try {
    const roomCode = generateRoomCode();
    const roomId = "room_" + Math.random().toString(36).substring(2, 12);
    const { error } = await supabase.from("rooms").insert([{
      room_id: roomId, room_code: roomCode, user_1: userId, user_2: null,
      created_at: new Date().toISOString(), typing_status: {},
    }]);
    if (error) {
      console.error("Supabase createRoom error:", error.message, error.details, error.hint);
      throw new Error(error.message);
    }
    await joinUserToRoom(userId, roomId);
    return { room_id: roomId, room_code: roomCode };
  } catch (err) {
    console.error("Error creating room:", err);
    throw err;
  }
};

export const joinRoom = async (roomCode: any, userId: any) => {
  try {
    const { data, error } = await supabase.from("rooms").select("*").eq("room_code", String(roomCode).toUpperCase()).single();
    if (error || !data) throw new Error("Room not found. Check the code and try again.");
    if (data.user_2 !== null) throw new Error("This room is already full.");
    if (data.user_1 === userId) throw new Error("You cannot join your own room.");
    await supabase.from("rooms").update({ user_2: userId }).eq("room_id", data.room_id);
    await joinUserToRoom(userId, data.room_id);
    return { room_id: data.room_id, room_code: roomCode };
  } catch (err) {
    console.error("Error joining room:", err);
    throw err;
  }
};

export const getRoomData = async (roomId: any) => {
  try {
    const { data } = await supabase.from("rooms").select("*").eq("room_id", roomId).single();
    return data || null;
  } catch (err) {
    console.error("Error getting room:", err);
    return null;
  }
};

export const getUserRooms = async (userId: any) => {
  try {
    const userData = await getUserData(userId);
    if (!userData) return [];
    const roomsArray = userData.rooms || [];
    if (roomsArray.length === 0) return [];
    const rooms = await Promise.all(roomsArray.map((id: any) => getRoomData(id)));
    return rooms.filter((r: any) => r !== null);
  } catch (err) {
    console.error("Error fetching user rooms:", err);
    return [];
  }
};

export const getPartnerData = async (roomId: any, currentUserId: any) => {
  try {
    const roomData = await getRoomData(roomId);
    if (!roomData) return null;
    const partnerId = roomData.user_1 === currentUserId ? roomData.user_2 : roomData.user_1;
    if (!partnerId) return null;
    return await getUserData(partnerId);
  } catch (err) {
    console.error("Error getting partner:", err);
    return null;
  }
};

export const leaveRoom = async (userId: any, roomId: any) => {
  try {
    const user = await getUserData(userId);
    const rooms = (user?.rooms || []).filter((r: any) => r !== roomId);
    await supabase.from("users").update({ rooms }).eq("user_id", userId);
  } catch (err) {
    console.error("Error leaving room:", err);
    throw err;
  }
};

// ─── Messaging & Chat ─────────────────────────────────────────────────────────

const activeChannels: Record<string, any> = {};

export const sendMessage = async (roomId: string, senderId: string, messageText: string, replyTo: any = null, mediaData: any = null) => {
  try {
    let processedMedia = mediaData;
    if (mediaData && mediaData.type === "image" && mediaData.url) {
      processedMedia = { ...mediaData, url: await compressImageDataUrl(mediaData.url, 1200, 0.75) };
    }

    const payload: any = {
      room_id: roomId, sender_id: senderId,
      message_text: messageText ? messageText.trim() : "",
      status: "sent", reactions: {},
      created_at: new Date().toISOString(),
    };
    if (replyTo) payload.reply_to = replyTo;
    if (processedMedia) {
      payload.media_url = processedMedia.url;
      payload.media_type = processedMedia.type;
      if (processedMedia.duration) payload.duration = processedMedia.duration;
    }

    const { data, error } = await supabase.from("messages").insert([payload]).select();
    if (error) {
      // Fallback: Broadcast to channel
      const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);
      await channel.send({ type: "broadcast", event: "new_message", payload: { message_id: `msg_${Date.now()}`, ...payload } });
    }
    return data;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
};

export const toggleReaction = async (messageId: any, userId: any, emoji: any) => {
  try {
    const { data } = await supabase.from("messages").select("reactions").eq("id", messageId).single();
    const reactions = { ...(data?.reactions || {}) };
    if (reactions[userId] === emoji) delete reactions[userId];
    else reactions[userId] = emoji;
    await supabase.from("messages").update({ reactions }).eq("id", messageId);
  } catch (err) {
    console.error("Error toggling reaction:", err);
  }
};

export const setTypingStatus = async (roomId: any, userId: any, isTyping: any) => {
  try {
    const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);
    activeChannels[roomId] = channel;
    await channel.send({ type: "broadcast", event: "typing_status", payload: { userId, isTyping } });
  } catch (err) {
    console.warn("Error setting typing:", err);
  }
};

export const subscribeToMessages = (roomId: any, callback: any) => {
  let localMessages: any[] = [];
  // Fetch initial messages
  supabase.from("messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true })
    .then(({ data }) => {
      if (data) {
        localMessages = data.map((d: any) => ({ message_id: d.id || d.message_id, ...d }));
        callback([...localMessages]);
      }
    });

  const channel = supabase.channel(`room_${roomId}`, { config: { broadcast: { self: true } } });
  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload: any) => {
      const newMsg = { message_id: payload.new.id, ...payload.new };
      if (!localMessages.some((m: any) => m.message_id === newMsg.message_id)) {
        localMessages.push(newMsg);
        callback([...localMessages]);
      }
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload: any) => {
      const updated = { message_id: payload.new.id, ...payload.new };
      localMessages = localMessages.map((m: any) => m.message_id === updated.message_id ? updated : m);
      callback([...localMessages]);
    })
    .on("broadcast", { event: "new_message" }, ({ payload }: any) => {
      if (!localMessages.some((m: any) => m.message_id === payload.message_id)) {
        localMessages.push(payload);
        callback([...localMessages]);
      }
    })
    .subscribe();
  activeChannels[roomId] = channel;
  return () => { supabase.removeChannel(channel); delete activeChannels[roomId]; };
};

export const subscribeToTypingStatus = (roomId: any, callback: any) => {
  const statuses: Record<string, any> = {};
  const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);
  activeChannels[roomId] = channel;
  channel.on("broadcast", { event: "typing_status" }, ({ payload }: any) => {
    if (payload?.userId) {
      statuses[payload.userId] = !!payload.isTyping;
      callback({ ...statuses });
    }
  }).subscribe();
  return () => {};
};

export const markMessagesAsSeen = async (roomId: any, currentUserId: any) => {
  try {
    await supabase.from("messages").update({ status: "seen" }).eq("room_id", roomId).neq("sender_id", currentUserId).eq("status", "sent");
  } catch (err) {
    console.error("Error marking seen:", err);
  }
};

// ─── Courses (Study Portal Decoy) ────────────────────────────────────────────

export const subscribeToCourses = (userId: any, callback: any) => {
  supabase.from("courses").select("*").eq("user_id", userId).order("created_at", { ascending: true })
    .then(({ data }) => callback(data || []));
  return () => {};
};

export const getCourses = async (userId: any) => {
  const { data } = await supabase.from("courses").select("*").eq("user_id", userId);
  return data || [];
};

export const seedDefaultCourses = async (...args: any[]) => {};
export const seedCurriculum = async (...args: any[]) => {};

// ─── Assignments & Notes (Study Portal Decoy) ────────────────────────────────

export const subscribeToAssignments = (userId: any, callback: any) => {
  if (typeof callback === "function") callback([]);
  return () => {};
};

export const getAssignments = async (...args: any[]): Promise<any[]> => [];
export const addAssignment = async (...args: any[]): Promise<any> => {};
export const toggleAssignment = async (...args: any[]): Promise<any> => {};
export const deleteAssignment = async (...args: any[]): Promise<any> => {};

export const subscribeToNotes = (userId: any, callback: any) => {
  if (typeof callback === "function") callback([]);
  return () => {};
};

export const getNotes = async (...args: any[]): Promise<any[]> => [];
export const addNote = async (...args: any[]): Promise<any> => {};
export const deleteNote = async (...args: any[]): Promise<any> => {};

export const updateCourseProgress = async (...args: any[]): Promise<any> => {};
