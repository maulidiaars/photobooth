"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, MessageCircle, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getWhatsappTemplate, saveWhatsappTemplate } from "@/services/settingsService";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_EMOJIS,
  WHATSAPP_REQUIRED_VARIABLE,
  WHATSAPP_TEMPLATE_MAX_LENGTH,
  WHATSAPP_TEMPLATE_VARIABLES,
  renderWhatsappTemplate,
  type WhatsappTemplateVars,
} from "@/lib/whatsappTemplate";
import { APP_NAME } from "@/lib/constants";

/** Format WhatsApp: *tebal* dan _miring_ — buat preview aja. */
function renderWaFormatting(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, i) => {
    if (/^\*[^*\n]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_\n]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

export default function AdminWhatsappPage() {
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  useEffect(() => {
    getWhatsappTemplate()
      .then((data) => {
        setValue(data.template);
        setSavedValue(data.template);
      })
      .catch(() => {
        toast.push("Gagal memuat template, ditampilkan isi bawaan", "error");
        setValue(DEFAULT_WHATSAPP_TEMPLATE);
        setSavedValue(DEFAULT_WHATSAPP_TEMPLATE);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = value !== savedValue;
  const missingLink = !value.includes(`{${WHATSAPP_REQUIRED_VARIABLE}}`);
  const tooLong = value.length > WHATSAPP_TEMPLATE_MAX_LENGTH;
  const empty = value.trim().length === 0;

  // Contoh isi variabel buat preview (bukan data pelanggan asli).
  const preview = useMemo(() => {
    const vars = Object.fromEntries(
      WHATSAPP_TEMPLATE_VARIABLES.map((v) => [
        v.key,
        v.key === "nama_brand" ? APP_NAME : v.sample,
      ])
    ) as WhatsappTemplateVars;
    return renderWhatsappTemplate(value, vars);
  }, [value]);

  // Sisipkan teks di posisi kursor textarea.
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((prev) => prev + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = async () => {
    if (empty || tooLong || saving) return;
    setSaving(true);
    try {
      const saved = await saveWhatsappTemplate(value);
      setSavedValue(saved.template);
      toast.push("Template pesan WhatsApp tersimpan", "success");
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Gagal menyimpan template", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValue(DEFAULT_WHATSAPP_TEMPLATE);
    toast.push("Dikembalikan ke isi bawaan — tekan Simpan untuk menerapkan", "info");
  };

  return (
    <div className="flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="font-serif text-2xl font-bold text-[#4A1A1A] tracking-wide">
          Pesan WhatsApp
        </h1>
        <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
          Atur sendiri isi pesan yang dikirim ke pelanggan lewat tombol &quot;Kirim WhatsApp&quot;
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 font-serif text-[#4A1A1A]/40">
          <Loader2 className="animate-spin" size={20} />
          Memuat template...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          {/* ================= EDITOR ================= */}
          <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-5 shadow-md sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-[#4A1A1A]">Isi pesan</h2>
              <span
                className={`font-serif text-xs ${
                  tooLong ? "text-[#A0524A] font-semibold" : "text-[#4A1A1A]/50"
                }`}
              >
                {value.length} / {WHATSAPP_TEMPLATE_MAX_LENGTH}
              </span>
            </div>

            {/* Variabel */}
            <p className="mb-2 font-serif text-xs font-semibold text-[#4A1A1A]/70">
              Tekan untuk menyisipkan data otomatis:
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {WHATSAPP_TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={v.desc}
                  onClick={() => insertAtCursor(`{${v.key}}`)}
                  className="rounded-full bg-[#F5EBE0] px-3 py-1.5 font-mono text-xs text-[#6B2D2C] transition-all hover:bg-[#6B2D2C] hover:text-[#F5EBE0]"
                >
                  {`{${v.key}}`}
                </button>
              ))}
            </div>

            {/* Emoji */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {WHATSAPP_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertAtCursor(emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg shadow-sm transition-all hover:scale-110 hover:shadow-md"
                  aria-label={`Sisipkan emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-[#E8DDD0]/60 bg-white px-4 py-3.5 font-serif text-sm leading-relaxed text-[#4A1A1A] shadow-inner outline-none transition-all focus:border-[#6B2D2C] focus:ring-2 focus:ring-[#6B2D2C]/20"
            />

            <p className="mt-2 font-serif text-xs text-[#4A1A1A]/50">
              Tips: tulis *teks* untuk <strong>tebal</strong> dan _teks_ untuk <em>miring</em>.
              Kamu juga bebas menulis nomor, link, atau kata-kata sendiri langsung di sini.
            </p>

            {missingLink && !empty && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#C9A87C]/40 bg-[#C9A87C]/15 px-4 py-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#8B5A4B]" />
                <p className="font-serif text-xs text-[#4A1A1A]/80">
                  Pesanmu belum memuat <span className="font-mono">{`{${WHATSAPP_REQUIRED_VARIABLE}}`}</span>.
                  Tanpa itu pelanggan tidak akan menerima link untuk melihat &amp; download fotonya.
                </p>
              </div>
            )}

            {tooLong && (
              <p className="mt-3 font-serif text-xs font-semibold text-[#A0524A]">
                Pesan terlalu panjang, kurangi sedikit ya.
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || empty || tooLong || saving}
                className="flex items-center gap-2 rounded-xl bg-[#6B2D2C] px-8 py-3 font-serif font-semibold text-[#F5EBE0] shadow-md transition-all hover:bg-[#4A1A1A] hover:shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={saving || value === DEFAULT_WHATSAPP_TEMPLATE}
                className="flex items-center gap-2 rounded-xl bg-[#F5EBE0] px-5 py-3 font-serif text-sm font-medium text-[#4A1A1A] shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Kembalikan ke bawaan
              </button>

              {dirty && (
                <span className="font-serif text-xs text-[#8B5A4B]">Ada perubahan belum disimpan</span>
              )}
            </div>
          </div>

          {/* ================= PREVIEW ================= */}
          <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-5 shadow-md sm:p-7 xl:sticky xl:top-0">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-[#6B2D2C]" strokeWidth={2.2} />
              <h2 className="font-serif text-lg font-semibold text-[#4A1A1A]">Pratinjau</h2>
            </div>
            <p className="mb-4 font-serif text-xs text-[#4A1A1A]/50">
              Contoh tampilan di WhatsApp pelanggan (data di bawah hanya contoh).
            </p>

            <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-[#E5DDD5] p-4">
              <div className="ml-auto max-w-[92%] whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-[#DCF8C6] px-3.5 py-2.5 font-sans text-[13px] leading-relaxed text-[#111B21] shadow-sm">
                {empty ? (
                  <span className="italic text-[#111B21]/40">Pesan masih kosong…</span>
                ) : (
                  renderWaFormatting(preview)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
