"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

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
 */
export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-texture relative w-full ${maxWidth} rounded-clay-lg bg-clay-gradient p-6 shadow-clay-lg`}
          >
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink shadow-clay-sm hover:shadow-clay transition-shadow"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            {title && (
              <h2 className="relative z-10 mb-4 pr-8 font-display text-xl font-semibold text-ink">
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
 *  `confirm("Hapus foto ini?")` style calls across the admin screens. */
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
        <button
          onClick={onCancel}
          className="flex-1 rounded-clay-sm bg-white/70 py-3 font-body font-medium text-ink shadow-clay-sm hover:shadow-clay transition-shadow"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 rounded-clay-sm py-3 font-body font-semibold shadow-clay-sm hover:shadow-clay transition-shadow ${
            danger ? "bg-garnet-gradient text-paper-light" : "bg-forest-gradient text-paper-light"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
