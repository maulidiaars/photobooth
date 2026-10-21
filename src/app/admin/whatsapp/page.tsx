
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  RotateCcw,
  Save,
  Smile,
  Sparkles,
  Variable,
} from "lucide-react";
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

const EMOJI_GROUPS = [
  {
    name: "Favorit",
    icon: Heart,
    emojis: ["❤️", "💕", "💖", "🥰", "😍", "😘", "✨", "🌸", "🤍", "💗", "🫶", "😊"],
  },
  {
    name: "Photobooth",
    icon: ImageIcon,
    emojis: ["📸", "📷", "🖼️", "🎞️", "🎀", "🎨", "🌷", "🌹", "⭐", "💫", "🎉", "🎁"],
  },
  {
    name: "Sapaan",
    icon: Smile,
    emojis: ["👋", "😊", "🥳", "🤗", "💌", "💬", "🙏", "👍", "🤩", "😎", "🫰", "💐"],
  },
];

/** Render format WhatsApp *tebal* dan _miring_ untuk preview. */
function renderWaFormatting(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, i) => {
    if (/^\*[^*\n]+\*$/.test(part)) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }

    if (/^_[^_\n]+_$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }

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
  const [activeEmojiGroup, setActiveEmojiGroup] = useState("Favorit");
  const [showVariables, setShowVariables] = useState(true);
  const [showEmojis, setShowEmojis] = useState(true);

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
  const activeGroup = EMOJI_GROUPS.find((group) => group.name === activeEmojiGroup) ?? EMOJI_GROUPS[0];

  const preview = useMemo(() => {
    const vars = Object.fromEntries(
      WHATSAPP_TEMPLATE_VARIABLES.map((item) => [
        item.key,
        item.key === "nama_brand" ? APP_NAME : item.sample,
      ])
    ) as WhatsappTemplateVars;

    return renderWhatsappTemplate(value, vars);
  }, [value]);

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
      setValue(saved.template);
      toast.push("Template pesan WhatsApp berhasil disimpan", "success");
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : "Gagal menyimpan template",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValue(DEFAULT_WHATSAPP_TEMPLATE);
    toast.push(
      "Template dikembalikan ke bawaan. Tekan Simpan untuk menerapkan.",
      "info"
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6B2D2C] text-[#FFF8ED] shadow-sm">
            <MessageCircle size={23} strokeWidth={2} />
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#4A1A1A] sm:text-3xl">
              Pesan WhatsApp
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6F6258]">
              Atur pesan otomatis untuk pelanggan dan lihat hasilnya langsung
              sebelum digunakan.
            </p>
          </div>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
            dirty
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              dirty ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          {dirty ? "Perubahan belum disimpan" : "Template tersimpan"}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center gap-3 rounded-3xl border border-[#E8DDD0] bg-[#FBF7F2] text-sm text-[#806C60]">
          <Loader2 className="animate-spin text-[#6B2D2C]" size={21} />
          Memuat pengaturan pesan...
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          {/* EDITOR */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E8DDD0] bg-[#FFFCF7] shadow-[0_8px_30px_rgba(74,26,26,0.045)]">
            <div className="border-b border-[#EDE3D8] px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#4A1A1A]">
                    Editor pesan
                  </h2>
                  <p className="mt-1 text-xs text-[#85766B]">
                    Tulis pesan sesuai gaya brand kamu.
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EBE0] text-[#6B2D2C]">
                  <Variable size={19} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-7">
              {/* VARIABLES */}
              <div className="overflow-hidden rounded-2xl border border-[#E8DDD0] bg-white">
                <button
                  type="button"
                  onClick={() => setShowVariables((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#FCF8F3]"
                  aria-expanded={showVariables}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EBE0] text-[#6B2D2C]">
                      <Variable size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#4A1A1A]">
                        Variabel otomatis
                      </span>
                      <span className="mt-0.5 block text-xs text-[#89786B]">
                        Klik untuk menyisipkan data dinamis
                      </span>
                    </span>
                  </span>

                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-[#8C7769] transition-transform ${
                      showVariables ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showVariables && (
                  <div className="border-t border-[#F0E7DD] px-4 pb-4 pt-3">
                    <div className="flex flex-wrap gap-2">
                      {WHATSAPP_TEMPLATE_VARIABLES.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          title={item.desc}
                          onClick={() => insertAtCursor(`{${item.key}}`)}
                          className="rounded-lg border border-[#E7D6C9] bg-[#FBF5ED] px-2.5 py-2 font-mono text-[11px] text-[#6B2D2C] transition hover:border-[#6B2D2C] hover:bg-[#6B2D2C] hover:text-white focus-visible:outline-[#6B2D2C]"
                        >
                          {`{${item.key}}`}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[#8B7A6E]">
                      Variabel akan diganti otomatis dengan data yang sesuai saat pesan dibuat.
                    </p>
                  </div>
                )}
              </div>

              {/* EMOJI PICKER */}
              <div className="overflow-hidden rounded-2xl border border-[#E8DDD0] bg-white">
                <button
                  type="button"
                  onClick={() => setShowEmojis((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#FCF8F3]"
                  aria-expanded={showEmojis}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCE8EA] text-[#8E3B48]">
                      <Smile size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#4A1A1A]">
                        Emoji
                      </span>
                      <span className="mt-0.5 block text-xs text-[#89786B]">
                        Tambahkan sentuhan personal
                      </span>
                    </span>
                  </span>

                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-[#8C7769] transition-transform ${
                      showEmojis ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showEmojis && (
                  <div className="border-t border-[#F0E7DD] p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {EMOJI_GROUPS.map((group) => {
                        const Icon = group.icon;
                        const selected = activeEmojiGroup === group.name;

                        return (
                          <button
                            key={group.name}
                            type="button"
                            onClick={() => setActiveEmojiGroup(group.name)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition ${
                              selected
                                ? "bg-[#6B2D2C] text-white shadow-sm"
                                : "bg-[#F8F1E8] text-[#715B50] hover:bg-[#F0E2D5]"
                            }`}
                          >
                            <Icon size={13} />
                            {group.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                      {activeGroup.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertAtCursor(emoji)}
                          aria-label={`Sisipkan emoji ${emoji}`}
                          title={`Sisipkan ${emoji}`}
                          className="flex aspect-square items-center justify-center rounded-xl border border-transparent bg-[#FBF7F2] text-xl transition hover:-translate-y-0.5 hover:border-[#E6CFC2] hover:bg-[#F6E9DE] active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MESSAGE INPUT */}
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="whatsapp-template"
                    className="text-sm font-semibold text-[#4A1A1A]"
                  >
                    Isi pesan
                  </label>

                  <span
                    className={`text-xs tabular-nums ${
                      tooLong ? "font-semibold text-red-600" : "text-[#8A7B70]"
                    }`}
                  >
                    {value.length.toLocaleString("id-ID")} /{" "}
                    {WHATSAPP_TEMPLATE_MAX_LENGTH.toLocaleString("id-ID")}
                  </span>
                </div>

                <textarea
                  id="whatsapp-template"
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  rows={18}
                  spellCheck={false}
                  placeholder="Tulis pesan WhatsApp kamu di sini..."
                  className="w-full resize-y rounded-2xl border border-[#E5D8CC] bg-white px-4 py-4 font-sans text-sm leading-7 text-[#3E3029] outline-none transition placeholder:text-[#B0A197] focus:border-[#8C4545] focus:ring-4 focus:ring-[#8C4545]/10"
                />

                <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#89786B]">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-[#A77B47]" />
                  <p>
                    Gunakan <code className="rounded bg-[#F5EBE0] px-1 py-0.5 text-[#6B2D2C]">*teks*</code>{" "}
                    untuk <strong>tebal</strong> dan{" "}
                    <code className="rounded bg-[#F5EBE0] px-1 py-0.5 text-[#6B2D2C]">_teks_</code>{" "}
                    untuk <em>miring</em>, seperti format WhatsApp.
                  </p>
                </div>

                {missingLink && !empty && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Link foto belum dicantumkan
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        Tambahkan variabel{" "}
                        <code className="rounded bg-amber-100 px-1 py-0.5">
                          {"{link_foto}"}
                        </code>{" "}
                        supaya pelanggan dapat membuka dan mengunduh hasil fotonya.
                      </p>
                    </div>
                  </div>
                )}

                {tooLong && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Pesan terlalu panjang. Kurangi karakter sebelum menyimpan.
                  </p>
                )}

                {empty && (
                  <p className="mt-3 text-xs text-amber-700">
                    Pesan tidak boleh kosong.
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-3 border-t border-[#EDE3D8] pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || empty || tooLong || saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6B2D2C] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4A1A1A] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Menyimpan..." : "Simpan perubahan"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving || value === DEFAULT_WHATSAPP_TEMPLATE}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E4D6C9] bg-white px-5 py-3 text-sm font-medium text-[#6B5044] transition hover:bg-[#F8F1E8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={16} />
                  Reset bawaan
                </button>
              </div>
            </div>
          </section>

          {/* LIVE WHATSAPP PREVIEW */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E8DDD0] bg-[#FFFCF7] shadow-[0_8px_30px_rgba(74,26,26,0.045)] xl:sticky xl:top-5">
            <div className="border-b border-[#EDE3D8] px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDEBDD] text-[#276749]">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#4A1A1A]">
                      Pratinjau pesan
                    </h2>
                    <p className="mt-0.5 text-xs text-[#85766B]">
                      Tampilan simulasi WhatsApp
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F4E8] px-2.5 py-1.5 text-[10px] font-semibold text-[#276749]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#35A56A]" />
                  LIVE
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* PHONE CHAT */}
              <div className="mx-auto max-w-[440px] overflow-hidden rounded-[24px] border border-[#D7D0C8] bg-[#EFEAE2] shadow-[0_12px_35px_rgba(38,30,24,0.12)]">
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3.5 text-white">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3E4D2] text-[#6B2D2C]">
                    <ImageIcon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{APP_NAME}</p>
                    <p className="mt-0.5 text-[11px] text-white/75">
                      Pesan otomatis
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-white/90">
                    <MessageCircle size={19} />
                    <ChevronDown size={19} />
                  </div>
                </div>

                {/* CHAT BODY */}
                <div
                  className="relative max-h-[min(65vh,680px)] min-h-[340px] overflow-y-auto px-3 py-5 sm:px-4"
                  style={{
                    backgroundColor: "#EFEAE2",
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(135,118,99,0.07) 1px, transparent 1.5px), radial-gradient(circle at 80% 60%, rgba(135,118,99,0.06) 1px, transparent 1.5px)",
                    backgroundSize: "24px 24px, 31px 31px",
                  }}
                >
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-lg bg-[#FDF7E8] px-3 py-1.5 text-[10px] font-medium text-[#776A5C] shadow-sm">
                      HARI INI
                    </span>
                  </div>

                  <div className="mb-3 flex justify-end">
                    <div className="max-w-[96%] rounded-xl bg-[#DCF8C6] px-3.5 py-3 text-[13px] leading-[1.65] text-[#26332A] shadow-sm sm:max-w-[92%]">
                      {empty ? (
                        <span className="italic text-[#75816F]">
                          Pesan kamu akan muncul di sini...
                        </span>
                      ) : (
                        renderWaFormatting(preview)
                      )}

                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-[#738274]">
                          14.30
                        </span>
                        <CheckCheck
                          size={15}
                          className="text-[#53A5D4]"
                          aria-label="Terkirim dan dibaca (simulasi)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-1">
                    <span className="rounded-lg bg-white/80 px-3 py-1.5 text-center text-[10px] leading-relaxed text-[#807469] shadow-sm">
                      Pratinjau ini hanya simulasi.
                      <br />
                      Pesan belum dikirim ke pelanggan.
                    </span>
                  </div>
                </div>

                {/* CHAT INPUT DECORATION */}
                <div className="flex items-center gap-3 border-t border-[#D8D1C8] bg-[#F7F5F1] px-3 py-3">
                  <Smile size={22} className="shrink-0 text-[#7D8880]" />
                  <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-[#E5E0D9] bg-white px-4 text-xs text-[#A7A29C]">
                    Pesan
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white">
                    <MessageCircle size={18} />
                  </div>
                </div>
              </div>

              {/* PREVIEW STATUS */}
              <div className="mx-auto mt-4 flex max-w-[440px] items-start gap-2.5 rounded-xl border border-[#E9DFD3] bg-white/75 p-3.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5EBE0] text-[#6B2D2C]">
                  <Clock3 size={15} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#4A1A1A]">
                    Perubahan terlihat langsung
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#89786B]">
                    Coba ubah teks di editor. Pratinjau akan mengikuti perubahan
                    tanpa perlu menyimpan terlebih dahulu.
                  </p>
                </div>
              </div>

              {missingLink && !empty && (
                <div className="mx-auto mt-3 flex max-w-[440px] items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />
                  <p className="text-xs leading-relaxed text-amber-900">
                    <strong>Periksa pesan:</strong> variabel{" "}
                    <code className="rounded bg-amber-100 px-1 py-0.5">
                      {"{link_foto}"}
                    </code>{" "}
                    belum ada.
                  </p>
                </div>
              )}

              {!dirty && !empty && !missingLink && (
                <div className="mx-auto mt-3 flex max-w-[440px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <Check size={16} className="shrink-0" />
                  Template tersimpan dan variabel link foto tersedia.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
