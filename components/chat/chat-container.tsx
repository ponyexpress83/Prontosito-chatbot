"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import GdprConsent from "./gdpr-consent";
import PreviewCard from "./preview-card";
import UrlAnalyzer from "./url-analyzer";
import { useChat } from "@/hooks/use-chat";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

/* ─── Generating Animation ─── */

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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-md rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-purple-500/10 p-6 backdrop-blur-xl shadow-lg shadow-sky-500/5"
    >
      {/* Icon */}
      <div className="mb-5 flex justify-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-10 w-10 text-sky-400" />
        </motion.div>
      </div>

      <p className="mb-6 text-center text-base font-medium text-white">
        Sto creando qualcosa di speciale per te...
      </p>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {done ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
              ) : active ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-sky-400" />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border border-white/20" />
              )}
              <span
                className={
                  done
                    ? "text-sm text-white/60 line-through"
                    : active
                      ? "text-sm font-medium text-white"
                      : "text-sm text-white/40"
                }
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Chat Container ─── */

export function ChatContainer() {
  const {
    messages,
    phase,
    isLoading,
    analyzingUrl,
    analysisStatus,
    analysisResult,
    previewToken,
    businessName,
    sendMessage,
    acceptGdpr,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to bottom on new messages / phase changes */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, phase, analyzingUrl]);

  /* Voice recorder */
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
          sendMessage(data.transcript, true);
        }
      } catch (err) {
        console.error("Voice error:", err);
      }
    },
    [sendMessage],
  );

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (blob) {
      handleSendVoice(blob);
    }
  }, [stopRecording, handleSendVoice]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1929]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#06192b] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-prontosito.png"
            alt="ProntoSito"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-base font-semibold text-white sm:text-lg">
            Crea il tuo sito
          </span>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70 sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Torna al sito
        </Link>
      </header>

      {/* ─── Messages Area ─── */}
      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
          {/* GDPR Consent */}
          <AnimatePresence>
            {phase === "consent" && (
              <motion.div
                key="consent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 items-center justify-center"
              >
                <GdprConsent onAccept={acceptGdpr} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          {phase !== "consent" &&
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

          {/* URL Analyzer */}
          <AnimatePresence>
            {analyzingUrl && (
              <motion.div
                key="url-analyzer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex justify-center"
              >
                <UrlAnalyzer
                  url={analyzingUrl}
                  status={analysisStatus ?? "analyzing"}
                  result={analysisResult ?? undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generating Animation */}
          <AnimatePresence>
            {phase === "generating" && (
              <div className="flex flex-1 items-center justify-center py-8">
                <GeneratingAnimation />
              </div>
            )}
          </AnimatePresence>

          {/* Preview Card */}
          <AnimatePresence>
            {phase === "preview_ready" && previewToken && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-4"
              >
                <PreviewCard
                  previewToken={previewToken}
                  businessName={businessName ?? "Il tuo sito"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* ─── Input Bar ─── */}
      <AnimatePresence>
        {phase === "collecting" && (
          <motion.footer
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="sticky bottom-0 z-50 border-t border-white/10 bg-[#06192b] px-4 py-3 sm:px-6"
          >
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSendMessage={(text) => sendMessage(text)}
                onSendVoice={handleSendVoice}
                disabled={isLoading}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={handleStopRecording}
                recordingDuration={recordingDuration}
              />
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
