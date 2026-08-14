"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, ImageOff, Loader2 } from "lucide-react";

interface PublicPhoto {
  id: string;
  image_result: string;
}

type Status = "loading" | "ready" | "not-found" | "error";

export default function PublicFotoPage() {
  const params = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<PublicPhoto | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/photos/public/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("not-found");
          return;
        }
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        setPhoto(json.data as PublicPhoto);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleDownload = async () => {
    if (!photo) return;
    setDownloading(true);
    try {
      // Fetch as a blob supaya beneran ke-download, bukan cuma
      // navigasi ke gambarnya (in-app browser WA suka begitu).
      const res = await fetch(photo.image_result);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photobooth-${photo.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: buka gambarnya langsung biar bisa long-press save.
      window.open(photo.image_result, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#140806] px-4 py-10">
      {status === "loading" && (
        <Loader2 className="animate-spin text-white/40" size={30} strokeWidth={2} />
      )}

      {(status === "not-found" || status === "error") && (
        <div className="flex flex-col items-center gap-2.5 text-center">
          <ImageOff size={30} className="text-white/30" strokeWidth={1.8} />
          <p className="text-sm font-medium text-white/60">
            {status === "not-found" ? "Foto tidak ditemukan." : "Gagal memuat foto."}
          </p>
        </div>
      )}

      {status === "ready" && photo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="relative w-full max-w-sm"
        >
          <img
            src={photo.image_result}
            alt="Hasil photobooth"
            className="w-full rounded-2xl shadow-2xl"
          />

          <button
            onClick={handleDownload}
            disabled={downloading}
            aria-label="Download foto"
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#140806] shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 size={19} className="animate-spin" strokeWidth={2.4} />
            ) : (
              <Download size={19} strokeWidth={2.4} />
            )}
          </button>
        </motion.div>
      )}
    </main>
  );
}