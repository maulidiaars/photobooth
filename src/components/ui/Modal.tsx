"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ClayButton } from "./ClayButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * A clay-styled modal used everywhere the app needs to confirm or
 * collect something from the person, instead of the browser's native
 * confirm()/alert()/prompt() (which look out of place and can't be
 * skinned, disabled, or made accessible to the flow's tone).
 *
 * Redesigned to read as a real "3D" card floating above the page —
 * a layered ambient shadow (so it looks lifted off the backdrop) plus
 * a sharp bevel line on the panel edge itself (bright top / dark
 * bottom, no blur — same trick as the session timer chip), a slim
 * garnet accent strip along the top as a "notice" cue, and a proper
 * embossed close button instead of a flat circle.
 */
export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-texture relative w-full ${maxWidth} overflow-hidden rounded-clay-lg bg-clay-gradient p-6 sm:p-7`}
            style={{
              boxShadow:
                "0 30px 60px -14px rgba(58,40,31,0.48), 0 10px 24px -8px rgba(58,40,31,0.22), inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -3px 0 rgba(58,40,31,0.12)",
            }}
          >
            {/* Slim accent strip di tepi atas — kesan "notifikasi", murni
                dekoratif, ditaruh di belakang judul & tombol tutup. */}
            <div className="bg-garnet-gradient absolute inset-x-0 top-0 z-0 h-2" />

            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-clay-gradient text-ink shadow-clay-sm transition-[box-shadow,transform] duration-150 hover:shadow-clay active:translate-y-[1px] active:shadow-clay-pressed"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            {title && (
              <h2 className="relative z-10 mb-4 pr-10 font-display text-xl font-semibold text-ink">
                {title}
              </h2>
            )}
            <div className="relative z-10">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A pre-wired yes/no confirmation modal — the direct replacement for
 *  `confirm("Hapus foto ini?")` style calls across the admin screens.
 *  Tombolnya pakai ClayButton supaya kerasa "timbul" & bisa ditekan
 *  (shadow-clay saat idle → shadow-clay-pressed saat ditekan), senada
 *  dengan gaya 3D yang sama di seluruh aplikasi. */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && <p className="mb-6 font-body text-sm text-ink/70">{description}</p>}
      <div className="flex gap-3">
        <ClayButton type="button" variant="ghost" size="sm" fullWidth onClick={onCancel}>
          {cancelLabel}
        </ClayButton>
        <ClayButton
          type="button"
          variant={danger ? "garnet" : "forest"}
          size="sm"
          fullWidth
          onClick={onConfirm}
        >
          {confirmLabel}
        </ClayButton>
      </div>
    </Modal>
  );
}
