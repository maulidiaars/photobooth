"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PartyPopper, Printer } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { Celebration } from "@/components/ui/Celebration";
import { ClayButton } from "@/components/ui/ClayButton";
import { useSessionStore } from "@/store/sessionStore";
import { ROUTES } from "@/lib/constants";

const AUTO_RESET_MS = 10000;

export default function FinishPage() {
  const router = useRouter();
  const resetSession = useSessionStore((s) => s.resetSession);
  const [celebrate, setCelebrate] = useState(false);

  const handleNewSession = () => {
    resetSession();
    router.push(ROUTES.home);
  };

  useEffect(() => {
    setCelebrate(true);
    const timer = setTimeout(handleNewSession, AUTO_RESET_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center px-6 text-center">
      <FloatingBackground />
      <Celebration trigger={celebrate} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-garnet-gradient shadow-clay-lg"
      >
        <PartyPopper size={52} className="text-paper-light" strokeWidth={2} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, rotate: -4 }}
        animate={{ opacity: 1, rotate: -4 }}
        transition={{ delay: 0.1 }}
        className="mb-1 font-hand text-2xl text-garnet"
      >
        strip fotomu udah jadi
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-4xl font-semibold italic text-ink"
      >
        Yeay, selesai!
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 flex max-w-md items-start gap-2.5 rounded-clay bg-white/55 px-5 py-4 text-left shadow-clay-inset"
      >
        <Printer size={22} className="mt-0.5 shrink-0 text-garnet" strokeWidth={2.2} />
        <p className="text-ink/75 font-body text-sm">
          Fotomu sudah tersimpan dan nomor WhatsApp kamu sudah tercatat.
          Silakan minta admin di dekat sini untuk mencetak hasil
          photobooth kamu — file mentahnya juga akan dikirim ke
          WhatsApp kamu ya.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10"
      >
        <ClayButton variant="garnet" size="lg" onClick={handleNewSession}>
          Mulai Sesi Baru
        </ClayButton>
      </motion.div>
    </main>
  );
}
