interface MessageBubbleProps {
  text: string;
  senderName: string;
  isOwnMessage: boolean;
}

export default function MessageBubble({ text, senderName, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col w-full mb-3 ${isOwnMessage ? "items-end" : "items-start"}`}>
      <span className={`text-[11px] text-zinc-600 mb-1 font-medium ${isOwnMessage ? "mr-2" : "ml-2"}`}>
        {senderName}
      </span>
      <div
        className={`px-4 py-2.5 max-w-[78%] break-words text-sm leading-relaxed shadow-sm ${
          isOwnMessage
            ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
            : "bg-[#1c1c2e] border border-[#27273a] text-zinc-200 rounded-2xl rounded-tl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
