"use client";

import { motion } from "framer-motion";
import { Sparkles, Mic } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isVoice?: boolean;
    isLoading?: boolean;
  };
}

function renderContent(content: string) {
  // Support basic markdown bold (**text**)
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-sky-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] gap-2 ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
            <Sparkles className="h-4 w-4 text-sky-400" />
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "bg-sky-500/20 text-sky-100"
                : "bg-white/5 text-gray-200"
            }`}
          >
            {message.isLoading ? (
              <TypingDots />
            ) : (
              <p className="whitespace-pre-wrap">
                {renderContent(message.content)}
              </p>
            )}

            {/* Voice badge */}
            {message.isVoice && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/80">
                <Mic className="h-3 w-3 text-white" />
              </span>
            )}
          </div>

          {/* Timestamp */}
          <span
            className={`text-[10px] text-white/30 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
