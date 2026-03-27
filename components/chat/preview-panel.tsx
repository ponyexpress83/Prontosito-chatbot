"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ChatPhase } from "@/hooks/use-chat";

interface PreviewPanelProps {
  phase: ChatPhase;
  previewToken: string | null;
  businessName: string;
}

type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

function ShimmerSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-10 w-10 text-sky-400" />
      </motion.div>
      <p className="text-sm font-medium text-white">
        Sto generando il tuo sito...
      </p>
      {/* Shimmer bars */}
      <div className="w-full max-w-xs space-y-3">
        {[80, 60, 90, 45, 70].map((w, i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-white/10"
            style={{ width: `${w}%` }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <Globe className="h-8 w-8 text-sky-400/50" />
        </div>
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-medium text-white/60">
          Il tuo sito apparirà qui
        </p>
        <p className="mt-1 text-xs text-white/30">
          Rispondi alle domande del chatbot per vedere l'anteprima
        </p>
      </div>
    </div>
  );
}

export default function PreviewPanel({
  phase,
  previewToken,
  businessName,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<Device>("desktop");

  const showPreview = phase === "preview_ready" && previewToken;
  const showGenerating = phase === "generating";
  const showPlaceholder = !showPreview && !showGenerating;

  const previewUrl = previewToken ? `/preview/${previewToken}` : "";
  const checkoutUrl = previewToken ? `/checkout/${previewToken}` : "";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1929]">
      {/* ─── Header with device toggle ─── */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-medium text-white/50">
          {showPreview ? businessName : "Anteprima"}
        </span>

        {showPreview && (
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            {([
              { key: "desktop", icon: Monitor },
              { key: "tablet", icon: Tablet },
              { key: "mobile", icon: Smartphone },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`rounded-md p-1.5 transition-colors ${
                  device === key
                    ? "bg-sky-500/20 text-sky-400"
                    : "text-white/30 hover:text-white/60"
                }`}
                aria-label={key}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {showPlaceholder && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Placeholder />
            </motion.div>
          )}

          {showGenerating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <ShimmerSkeleton />
            </motion.div>
          )}

          {showPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-[#06192b] p-2"
            >
              <div
                className="h-full overflow-hidden rounded-lg border border-white/10 transition-all duration-300"
                style={{
                  width: deviceWidths[device],
                  maxWidth: "100%",
                }}
              >
                <iframe
                  src={previewUrl}
                  title={`Anteprima di ${businessName}`}
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Footer CTA ─── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-white/10 px-4 py-3 space-y-2"
          >
            <Link
              href={checkoutUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Acquista ora — €99
            </Link>
            <Link
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <ExternalLink className="h-3 w-3" />
              Apri in finestra
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
