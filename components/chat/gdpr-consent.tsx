"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check } from "lucide-react";
import Link from "next/link";

interface GdprConsentProps {
  onAccept: (privacy: boolean, marketing: boolean) => void;
}

export default function GdprConsent({ onAccept }: GdprConsentProps) {
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  function handleAccept() {
    if (!privacy) return;
    onAccept(privacy, marketing);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      {/* Shield icon */}
      <div className="mb-4 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/20">
          <Shield className="h-7 w-7 text-sky-400" />
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-2 text-center text-xl font-semibold text-white">
        Prima di iniziare
      </h2>

      {/* Description */}
      <p className="mb-6 text-center text-sm leading-relaxed text-white/60">
        Per offrirti la migliore esperienza, abbiamo bisogno del tuo consenso al
        trattamento dei dati personali.
      </p>

      {/* Checkboxes */}
      <div className="mb-6 space-y-4">
        {/* Privacy (required) */}
        <label className="flex cursor-pointer items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={privacy}
            onClick={() => setPrivacy(!privacy)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
              privacy
                ? "border-sky-500 bg-sky-500"
                : "border-white/30 bg-white/5"
            }`}
          >
            {privacy && <Check className="h-3.5 w-3.5 text-white" />}
          </button>
          <span className="text-sm leading-relaxed text-white/80">
            Accetto la{" "}
            <Link
              href="/privacy"
              className="text-sky-400 underline hover:text-sky-300"
            >
              Privacy Policy
            </Link>{" "}
            e il trattamento dei dati personali{" "}
            <span className="text-red-400">*</span>
          </span>
        </label>

        {/* Marketing (optional) */}
        <label className="flex cursor-pointer items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={marketing}
            onClick={() => setMarketing(!marketing)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
              marketing
                ? "border-sky-500 bg-sky-500"
                : "border-white/30 bg-white/5"
            }`}
          >
            {marketing && <Check className="h-3.5 w-3.5 text-white" />}
          </button>
          <span className="text-sm leading-relaxed text-white/80">
            Accetto di ricevere comunicazioni commerciali
          </span>
        </label>
      </div>

      {/* Accept button */}
      <button
        onClick={handleAccept}
        disabled={!privacy}
        className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Accetto e inizia
      </button>
    </motion.div>
  );
}
