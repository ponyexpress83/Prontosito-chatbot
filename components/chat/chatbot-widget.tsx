"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, Zap } from "lucide-react";
import ChatPanel from "./chat-panel";
import PreviewPanel from "./preview-panel";
import { useChat } from "@/hooks/use-chat";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

/* ─────────────────────────────────────────────
   Widget States:
   - idle:    "Inizia ora" card centrata
   - flipped: card girata, mostra chatbot
   - split:   due colonne (chat sx, preview dx)
   ───────────────────────────────────────────── */

type WidgetState = "idle" | "flipping" | "flipped" | "split";

/* ─── Front Face — "Inizia ora" Card ─── */

function StartCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative w-full max-w-md cursor-pointer select-none"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500/30 via-orange-400/20 to-orange-500/30 opacity-70 blur-lg transition-all duration-500 group-hover:opacity-100" />

      <div className="relative rounded-2xl border border-orange-500/30 bg-[#0c2340] px-8 py-10 shadow-2xl shadow-orange-500/10 transition-transform duration-300 group-hover:scale-[1.02]">
        {/* Decorative dots */}
        <div className="absolute right-6 top-5 h-2.5 w-2.5 rounded-full bg-orange-400/60" />
        <div className="absolute right-4 top-10 h-1.5 w-1.5 rounded-full bg-white/20" />
        <div className="absolute bottom-8 left-6 h-2 w-2 rounded-full bg-sky-400/40" />

        {/* Mic icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/30">
          <Mic className="h-9 w-9 text-white" />
        </div>

        {/* Title */}
        <h3 className="mb-1 text-center text-2xl font-bold text-white">
          Inizia ora
        </h3>
        <p className="mb-5 text-center text-sm text-white/60">
          Parlaci della tua attività
        </p>

        {/* Badges */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <Sparkles className="h-3 w-3" />
            Gratis
          </span>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            2 minuti
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
            <Zap className="h-3 w-3" />
            Preview
          </span>
        </div>

        {/* CTA text */}
        <p className="text-center text-sm text-white/40 transition-colors group-hover:text-white/70">
          Clicca per iniziare →
        </p>
      </div>
    </div>
  );
}

/* ─── Main Chatbot Widget ─── */

export default function ChatbotWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>("idle");

  // Chat hook
  const chat = useChat();

  // Voice recorder hook
  const {
    isRecording,
    duration: recordingDuration,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  const handleSendVoice = useCallback(
    async (blob: Blob) => {
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        const res = await fetch("/api/chat-voice", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Voice transcription failed");
        const data = await res.json();
        if (data.transcript) {
          chat.sendMessage(data.transcript, true);
        }
      } catch (err) {
        console.error("Voice error:", err);
      }
    },
    [chat.sendMessage],
  );

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (blob) handleSendVoice(blob);
  }, [stopRecording, handleSendVoice]);

  // When GDPR is accepted (phase goes to "collecting"), transition to split
  useEffect(() => {
    if (chat.phase !== "consent" && widgetState === "flipped") {
      const timer = setTimeout(() => setWidgetState("split"), 300);
      return () => clearTimeout(timer);
    }
  }, [chat.phase, widgetState]);

  // Handle card click → flip
  const handleStart = useCallback(() => {
    if (widgetState !== "idle") return;
    setWidgetState("flipping");
    setTimeout(() => setWidgetState("flipped"), 800);
  }, [widgetState]);

  /* ─── Render: Idle — Centered flip card ─── */
  if (widgetState === "idle" || widgetState === "flipping" || widgetState === "flipped") {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4">
        <div
          className="w-full max-w-md"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            animate={{
              rotateY: widgetState === "idle" ? 0 : 180,
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative"
          >
            {/* ── Front Face ── */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className={widgetState !== "idle" ? "pointer-events-none" : ""}
            >
              <StartCard onClick={handleStart} />
            </div>

            {/* ── Back Face ── */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 top-0"
            >
              <div className="h-[520px]">
                <ChatPanel
                  messages={chat.messages}
                  phase={chat.phase}
                  isLoading={chat.isLoading}
                  analyzingUrl={chat.analyzingUrl}
                  analysisStatus={chat.analysisStatus}
                  analysisResult={chat.analysisResult}
                  onSendMessage={(text) => chat.sendMessage(text)}
                  onAcceptGdpr={chat.acceptGdpr}
                  isRecording={isRecording}
                  recordingDuration={recordingDuration}
                  onStartRecording={startRecording}
                  onStopRecording={handleStopRecording}
                  onSendVoice={handleSendVoice}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Render: Split — Two columns ─── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl px-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Chat Panel (left) */}
        <motion.div
          layout
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full lg:w-[45%]"
        >
          <div className="h-[520px] lg:h-[580px]">
            <ChatPanel
              messages={chat.messages}
              phase={chat.phase}
              isLoading={chat.isLoading}
              analyzingUrl={chat.analyzingUrl}
              analysisStatus={chat.analysisStatus}
              analysisResult={chat.analysisResult}
              onSendMessage={(text) => chat.sendMessage(text)}
              onAcceptGdpr={chat.acceptGdpr}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              onStartRecording={startRecording}
              onStopRecording={handleStopRecording}
              onSendVoice={handleSendVoice}
            />
          </div>
        </motion.div>

        {/* Preview Panel (right) */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="w-full lg:w-[55%]"
        >
          <div className="h-[400px] lg:h-[580px]">
            <PreviewPanel
              phase={chat.phase}
              previewToken={chat.previewToken}
              businessName={chat.businessName || "Il tuo sito"}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
