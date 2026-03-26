"use client";

import { motion } from "framer-motion";
import { PartyPopper, ExternalLink, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface PreviewCardProps {
  previewToken: string;
  businessName: string;
}

export default function PreviewCard({
  previewToken,
  businessName,
}: PreviewCardProps) {
  const previewUrl = `/preview/${previewToken}`;
  const checkoutUrl = `/checkout/${previewToken}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm rounded-2xl border border-green-500/30 bg-white/5 p-5 shadow-lg shadow-green-500/10 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
          <PartyPopper className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            La tua anteprima è pronta!
          </h3>
          <p className="text-xs text-white/50">{businessName}</p>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
        <iframe
          src={previewUrl}
          title={`Anteprima di ${businessName}`}
          className="h-[200px] w-full pointer-events-none"
          tabIndex={-1}
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <Link
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <ExternalLink className="h-4 w-4" />
          Vedi Anteprima Completa
        </Link>

        <Link
          href={checkoutUrl}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700"
        >
          <ShoppingCart className="h-4 w-4" />
          Acquista ora — €99
        </Link>
      </div>
    </motion.div>
  );
}
