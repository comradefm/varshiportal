interface MessageBubbleProps {
  text: string;
  senderName: string;
  isOwnMessage: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  status?: "sent" | "seen";
  onReplyClick?: (id: string) => void;
}

export default function MessageBubble({ text, senderName, isOwnMessage, replyTo, status, onReplyClick }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col w-full mb-3 ${isOwnMessage ? "items-end" : "items-start"}`}>
      <span className={`text-[11px] text-zinc-600 mb-1 font-medium ${isOwnMessage ? "mr-2" : "ml-2"}`}>
        {senderName}
      </span>
      
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"}`}>
        <div
          className={`relative px-4 py-2.5 break-words text-sm leading-relaxed shadow-sm flex flex-col gap-1 ${
            isOwnMessage
              ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
              : "bg-[#1c1c2e] border border-[#27273a] text-zinc-200 rounded-2xl rounded-tl-sm"
          }`}
        >
          {replyTo && (
            <div 
              onClick={() => onReplyClick && onReplyClick(replyTo.id)}
              className={`mb-1.5 px-3 py-1.5 rounded-lg border-l-2 text-[11px] line-clamp-2 cursor-pointer transition-colors ${
                isOwnMessage 
                  ? "bg-black/20 border-white/30 text-zinc-200 hover:bg-black/30" 
                  : "bg-white/5 border-indigo-500/50 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <div className="font-bold opacity-80 mb-0.5 truncate">{replyTo.senderName}</div>
              <div className="opacity-90 italic truncate">{replyTo.text}</div>
            </div>
          )}
          
          <div>{text}</div>
        </div>

        {isOwnMessage && status && (
          <div className="mt-1 mr-1 flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 font-medium lowercase">
              {status === "seen" ? "Seen" : "Sent"}
            </span>
            {status === "seen" && (
              <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
