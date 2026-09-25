"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { ClayButton } from "./ClayButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Ikon bulat kecil yang "melayang" separuh nongol di atas garis
   *  modal — ini yang bikin modal kebaca sebagai notifikasi/peringatan
   *  tanpa perlu strip warna tebal di dalam kartu. Opsional; kalau
   *  tidak diisi, modal tampil polos seperti biasa (dipakai di
   *  ConfirmModal misalnya). */
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * A clay-styled modal used everywhere the app needs to confirm or
 * collect something from the person, instead of the browser's native
 * confirm()/alert()/prompt() (which look out of place and can't be
 * skinned, disabled, or made accessible to the flow's tone).
 *
 * Simple & clean by design on purpose: satu shadow lembut (bukan
 * banyak layer/bevel yang malah keliatan berantakan), tombol close
 * kecil & halus di pojok, dan (kalau dikasih `icon`) sebuah badge
 * bundar yang melayang separuh keluar dari tepi atas kartu — ini pola
 * umum untuk modal notifikasi/peringatan yang kebaca "penting" tanpa
 * perlu elemen dekoratif tambahan.
 */
export function Modal({ open, onClose, title, icon, children, maxWidth = "max-w-md" }: ModalProps) {
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
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-texture relative w-full ${maxWidth} rounded-[28px] bg-clay-gradient p-6 sm:p-7`}
            style={{
              // Satu shadow lembut & besar — kesan "mengambang" yang
              // bersih, tanpa garis-garis bevel tambahan yang bikin
              // ramai.
              boxShadow: "0 28px 60px -16px rgba(58,40,31,0.42), 0 8px 20px -6px rgba(58,40,31,0.18)",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink shadow-clay-sm transition-shadow hover:shadow-clay active:translate-y-[1px]"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            {icon && (
              <div className="bg-garnet-gradient text-paper-light shadow-clay -mt-14 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-paper-light">
                {icon}
              </div>
            )}

            {title && (
              <h2
                className={clsx(
                  "relative z-10 mb-4 font-display text-xl font-semibold text-ink",
                  icon ? "pr-6" : "pr-10"
                )}
              >
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
