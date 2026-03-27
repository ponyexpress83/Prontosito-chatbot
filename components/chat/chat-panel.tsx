"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import GdprConsent from "./gdpr-consent";
import UrlAnalyzer from "./url-analyzer";
import type { ChatMessage as ChatMessageType, ChatPhase } from "@/hooks/use-chat";

/* ─── Generating Animation (compact) ─── */

function GeneratingAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const steps = [
    "Analizzo la tua attività",
    "Scelgo il design perfetto",
    "Genero il tuo sito",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto w-full rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-purple-500/10 p-5"
    >
      <div className="mb-4 flex justify-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-8 w-8 text-sky-400" />
        </motion.div>
      </div>
      <p className="mb-4 text-center text-sm font-medium text-white">
        Sto creando qualcosa di speciale...
      </p>
      <div className="space-y-2">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center gap-2">
              {done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-400" />
              ) : (
                <div className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
              )}
              <span
                className={
                  done
                    ? "text-xs text-white/50 line-through"
                    : active
                      ? "text-xs font-medium text-white"
                      : "text-xs text-white/30"
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Chat Panel Props ─── */

interface ChatPanelProps {
  messages: ChatMessageType[];
  phase: ChatPhase;
  isLoading: boolean;
  analyzingUrl: string | null;
  analysisStatus: "analyzing" | "complete" | "error";
  analysisResult: { title?: string; description?: string; colors?: string[]; imageCount?: number } | null;
  onSendMessage: (text: string) => void;
  onAcceptGdpr: (privacy: boolean, marketing: boolean) => void;
  // Voice
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSendVoice: (blob: Blob) => void;
}

export default function ChatPanel({
  messages,
  phase,
  isLoading,
  analyzingUrl,
  analysisStatus,
  analysisResult,
  onSendMessage,
  onAcceptGdpr,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onSendVoice,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, phase, analyzingUrl]);

  const showInput = phase === "collecting" || phase === "analyzing";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1929]">
      {/* ─── Messages Area ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {/* GDPR Consent */}
          <AnimatePresence>
            {phase === "consent" && (
              <motion.div
                key="consent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-4"
              >
                <GdprConsent onAccept={onAcceptGdpr} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {phase !== "consent" &&
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

          {/* URL Analyzer */}
          <AnimatePresence>
            {analyzingUrl && (
              <motion.div
                key="url-analyzer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <UrlAnalyzer
                  url={analyzingUrl}
                  status={analysisStatus}
                  result={analysisResult ?? undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generating */}
          <AnimatePresence>
            {phase === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4"
              >
                <GeneratingAnimation />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* ─── Input Bar ─── */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="border-t border-white/10 px-3 py-3"
          >
            <ChatInput
              onSendMessage={onSendMessage}
              onSendVoice={onSendVoice}
              disabled={isLoading}
              isRecording={isRecording}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              recordingDuration={recordingDuration}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
