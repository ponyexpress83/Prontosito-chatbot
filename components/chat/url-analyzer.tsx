"use client";

import { motion } from "framer-motion";
import { Globe, Check, AlertCircle, Loader2 } from "lucide-react";

interface UrlAnalyzerProps {
  url: string;
  status: "analyzing" | "complete" | "error";
  result?: {
    title?: string;
    description?: string;
    colors?: string[];
    imageCount?: number;
  };
}

export default function UrlAnalyzer({ url, status, result }: UrlAnalyzerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
    >
      {/* Analyzing state */}
      {status === "analyzing" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Globe className="h-5 w-5 text-sky-400" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm text-white/80">
                Sto analizzando{" "}
                <span className="font-medium text-sky-400">{url}</span>...
              </p>
            </div>
          </div>

          {/* Animated progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-sky-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "40%" }}
            />
          </div>
        </div>
      )}

      {/* Complete state */}
      {status === "complete" && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              {result.title && (
                <p className="truncate text-sm font-medium text-white">
                  {result.title}
                </p>
              )}
              {result.description && (
                <p className="line-clamp-2 text-xs text-white/50">
                  {result.description}
                </p>
              )}
            </div>
          </div>

          {/* Color swatches + image count */}
          <div className="flex items-center gap-3">
            {result.colors && result.colors.length > 0 && (
              <div className="flex items-center gap-1">
                {result.colors.map((color, i) => (
                  <span
                    key={i}
                    className="inline-block h-4 w-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}

            {result.imageCount !== undefined && (
              <span className="text-xs text-white/40">
                {result.imageCount} immagin
                {result.imageCount === 1 ? "e" : "i"} trovate
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-sm text-red-300/80">
            Non sono riuscito ad analizzare il sito
          </p>
        </div>
      )}
    </motion.div>
  );
}
