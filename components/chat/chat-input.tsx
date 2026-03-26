"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
  disabled?: boolean;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingDuration: number;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ChatInput({
  onSendMessage,
  onSendVoice,
  disabled = false,
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingDuration,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 p-2">
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-1 items-center gap-3 px-2"
          >
            {/* Pulsing red mic */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500"
            >
              <Mic className="h-4 w-4 text-white" />
            </motion.div>

            {/* Timer */}
            <span className="font-mono text-sm text-red-400">
              {formatDuration(recordingDuration)}
            </span>

            <div className="flex-1" />

            {/* Stop button */}
            <button
              onClick={onStopRecording}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
              aria-label="Ferma registrazione"
            >
              <MicOff className="h-5 w-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-1 items-center gap-2"
          >
            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi o invia un vocale..."
              disabled={disabled}
              className="flex-1 bg-transparent px-2 text-sm text-white placeholder-white/40 outline-none disabled:opacity-50"
            />

            {/* Send button - visible when text is non-empty */}
            <AnimatePresence>
              {text.trim().length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={handleSend}
                  disabled={disabled}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                  aria-label="Invia messaggio"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Microphone button - large and prominent */}
            <button
              onClick={onStartRecording}
              disabled={disabled}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 disabled:opacity-50"
              aria-label="Registra vocale"
            >
              <Mic className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
