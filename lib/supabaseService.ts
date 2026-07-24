import { supabase } from "./supabaseClient";
import { compressImageDataUrl } from "./imageCompressor";

// Memory store for active channel subscriptions
const activeChannels: Record<string, any> = {};

// ─── Messaging & Chat ─────────────────────────────────────────────────────────

export const sendMessage = async (
  roomId: string,
  senderId: string,
  messageText: string,
  replyTo: any = null,
  mediaData: { url: string; type: string; duration?: number } | null = null
) => {
  try {
    let processedMedia = mediaData;

    // Apply smart image compression for image uploads
    if (mediaData && mediaData.type === "image" && mediaData.url) {
      const compressedUrl = await compressImageDataUrl(mediaData.url, 1200, 0.75);
      processedMedia = { ...mediaData, url: compressedUrl };
    }

    const payload: any = {
      room_id: roomId,
      sender_id: senderId,
      message_text: messageText ? messageText.trim() : "",
      status: "sent",
      reactions: {},
      created_at: new Date().toISOString(),
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    if (processedMedia) {
      payload.media_url = processedMedia.url;
      payload.media_type = processedMedia.type;
      if (processedMedia.duration) {
        payload.duration = processedMedia.duration;
      }
    }

    // Insert into Supabase 'messages' table or fallback to Realtime Broadcast
    const { data, error } = await supabase.from("messages").insert([payload]).select();

    if (error) {
      console.warn("[SupabaseService] Table insert fallback to Broadcast channel:", error.message);
      // Fallback: Broadcast to active room channel
      const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);
      await channel.send({
        type: "broadcast",
        event: "new_message",
        payload: { message_id: `msg_${Date.now()}`, ...payload },
      });
    }

    return data;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    const { data } = await supabase.from("messages").select("reactions").eq("id", messageId).single();
    const currentReactions = data?.reactions || {};
    const newReactions = { ...currentReactions };

    if (newReactions[userId] === emoji) {
      delete newReactions[userId];
    } else {
      newReactions[userId] = emoji;
    }

    await supabase.from("messages").update({ reactions: newReactions }).eq("id", messageId);
  } catch (err) {
    console.error("Error toggling reaction:", err);
  }
};

export const setTypingStatus = async (roomId: string, userId: string, isTyping: boolean) => {
  try {
    const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "typing_status",
      payload: { userId, isTyping },
    });
  } catch (err) {
    console.warn("Error setting typing status:", err);
  }
};

export const subscribeToMessages = (roomId: string, callback: (msgs: any[]) => void) => {
  let localMessages: any[] = [];

  // Fetch initial messages from Supabase
  supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .then(({ data, error }) => {
      if (data && !error) {
        localMessages = data.map((d) => ({ message_id: d.id || d.message_id, ...d }));
        callback([...localMessages]);
      }
    });

  // Setup Realtime subscription
  const channel = supabase.channel(`room_${roomId}`, {
    config: { broadcast: { self: true } },
  });

  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload) => {
      const newMsg = { message_id: payload.new.id, ...payload.new };
      if (!localMessages.some((m) => m.message_id === newMsg.message_id)) {
        localMessages.push(newMsg);
        callback([...localMessages]);
      }
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload) => {
      const updated = { message_id: payload.new.id, ...payload.new };
      localMessages = localMessages.map((m) => (m.message_id === updated.message_id ? updated : m));
      callback([...localMessages]);
    })
    .on("broadcast", { event: "new_message" }, ({ payload }) => {
      if (!localMessages.some((m) => m.message_id === payload.message_id)) {
        localMessages.push(payload);
        callback([...localMessages]);
      }
    })
    .subscribe();

  activeChannels[roomId] = channel;

  return () => {
    supabase.removeChannel(channel);
    delete activeChannels[roomId];
  };
};

export const subscribeToTypingStatus = (roomId: string, callback: (statuses: Record<string, boolean>) => void) => {
  const statuses: Record<string, boolean> = {};
  const channel = activeChannels[roomId] || supabase.channel(`room_${roomId}`);

  channel
    .on("broadcast", { event: "typing_status" }, ({ payload }: { payload: any }) => {
      if (payload?.userId) {
        statuses[payload.userId] = !!payload.isTyping;
        callback({ ...statuses });
      }
    })
    .subscribe();

  return () => {
    // Keep channel if active elsewhere
  };
};

export const markMessagesAsSeen = async (roomId: string, currentUserId: string) => {
  try {
    await supabase
      .from("messages")
      .update({ status: "seen" })
      .eq("room_id", roomId)
      .neq("sender_id", currentUserId)
      .eq("status", "sent");
  } catch (err) {
    console.error("Error marking seen:", err);
  }
};

// ─── User Profile & Presence ──────────────────────────────────────────────────

export const getUserData = async (userId: string) => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single();
    if (error && error.code !== "PGRST116") console.warn("[SupabaseService] getUserData warning:", error.message);
    return data || null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
};

export const createUserData = async (userId: string, data: any) => {
  try {
    await supabase.from("users").upsert([
      {
        user_id: userId,
        rooms: [],
        alwaysOnVideo: true,
        created_at: new Date().toISOString(),
        ...data,
      },
    ]);
  } catch (err) {
    console.error("Error creating user profile:", err);
  }
};

export const updateUserPresence = async (userId: string, isOnline: boolean) => {
  try {
    await supabase.from("users").upsert([
      {
        user_id: userId,
        isOnline,
        lastActive: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn("Error updating presence:", err);
  }
};
