"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ClayButton } from "@/components/ui/ClayButton";

interface WhatsappModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (number: string) => void;
}

/** Strip everything except digits, keep it simple to validate. */
function sanitizeNumber(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

export function WhatsappModal({ open, submitting, onClose, onSubmit }: WhatsappModalProps) {
  const [value, setValue] = useState("");
  const digits = sanitizeNumber(value);
  const valid = digits.length >= 9 && digits.length <= 15;

  const handleSubmit = () => {
    if (!valid || submitting) return;
    onSubmit(digits);
  };

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title="Satu langkah lagi">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-clay bg-white/60 p-4 shadow-clay-inset">
          <MessageCircle className="mt-0.5 shrink-0 text-garnet" size={22} strokeWidth={2.2} />
          <p className="font-body text-sm text-ink/75">
            Masukkan nomor WhatsApp kamu ya, supaya admin bisa kirim file
            mentahan hasil photobooth-mu langsung ke HP kamu.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted">
            Nomor WhatsApp
          </label>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            placeholder="08xxxxxxxxxx"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-clay-sm bg-white/80 px-4 py-3.5 font-body text-lg text-ink shadow-clay-inset outline-none placeholder:text-muted/60 focus-visible:outline-garnet"
          />
          {value.length > 0 && !valid && (
            <p className="mt-1.5 font-body text-xs text-garnet">
              Nomor sepertinya belum lengkap, cek lagi ya.
            </p>
          )}
        </div>

        <ClayButton
          variant="garnet"
          size="md"
          fullWidth
          disabled={!valid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Menyimpan..." : "Kirim & Selesaikan"}
        </ClayButton>
      </div>
    </Modal>
  );
}
