"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { KickbackPDFData } from "@/components/pdf/kickback-pdf";

interface KickbackPDFDownloadButtonProps {
  kickback: KickbackPDFData;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export default function KickbackPDFDownloadButton({
  kickback,
  onSuccess,
  onError,
}: KickbackPDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;

    setLoading(true);

    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: KickbackPDF } =
        await import("@/components/pdf/kickback-pdf");

      const blob = await pdf(
        <KickbackPDF kickback={kickback} />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const safeReference = String(
        kickback.reference || "Kickback"
      ).replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        "_"
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = `${safeReference}-Kickback.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      onSuccess?.();
    } catch (error) {
      console.error(
        "Kickback PDF generation failed:",
        error
      );

      onError?.(
        error instanceof Error
          ? error.message
          : "Could not generate the Kickback PDF."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      title="Download Kickback PDF"
      aria-label="Download Kickback PDF"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-200 bg-white text-charcoal-700 transition hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-charcoal-200 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}