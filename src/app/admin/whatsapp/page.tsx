
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  FileText,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Variable,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getWhatsappTemplate,
  saveWhatsappTemplate,
} from "@/services/settingsService";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_REQUIRED_VARIABLE,
  WHATSAPP_TEMPLATE_MAX_LENGTH,
  WHATSAPP_TEMPLATE_VARIABLES,
  renderWhatsappTemplate,
  type WhatsappTemplateVars,
} from "@/lib/whatsappTemplate";
import { APP_NAME } from "@/lib/constants";

function renderWhatsAppText(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, index) => {
    if (/^\*[^*\n]+\*$/.test(part)) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }

    if (/^_[^_\n]+_$/.test(part)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <span key={index}>{part}</span>;
  });
}

export default function AdminWhatsappPage() {
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [showVariables, setShowVariables] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      try {
        const result = await getWhatsappTemplate();

        if (cancelled) return;

        setValue(result.template);
        setSavedValue(result.template);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Gagal memuat template WhatsApp.";

        setLoadError(message);
        toast.push(message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTemplate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = value !== savedValue;
  const empty = value.trim().length === 0;
  const tooLong = value.length > WHATSAPP_TEMPLATE_MAX_LENGTH;
  const missingLink = !value.includes(`{${WHATSAPP_REQUIRED_VARIABLE}}`);

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
    const textarea = textareaRef.current;

    if (!textarea) {
      setValue((current) => current + text);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue =
      value.slice(0, start) + text + value.slice(end);

    setValue(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = async () => {
    if (!dirty || empty || tooLong || saving) return;

    setSaving(true);

    try {
      const result = await saveWhatsappTemplate(value);

      setValue(result.template);
      setSavedValue(result.template);
      setLoadError("");

      toast.push("Template WhatsApp berhasil disimpan.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan template WhatsApp.";

      toast.push(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValue(DEFAULT_WHATSAPP_TEMPLATE);
    toast.push(
      "Template bawaan dipulihkan. Tekan Simpan untuk menerapkan perubahan.",
      "info"
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-7 pb-10">
      {/* PAGE HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6B2D2C] text-white shadow-lg shadow-[#6B2D2C]/15">
            <MessageCircle size={25} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#4A1A1A] sm:text-3xl">
                Pesan WhatsApp
              </h1>

              <span className="rounded-full border border-[#E8DDD0] bg-[#FBF7F2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B6256]">
                Pengaturan
              </span>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-[#817269]">
              Atur pesan yang diterima pelanggan setelah sesi foto selesai.
              Edit isi pesan dan lihat pratinjaunya secara langsung.
            </p>
          </div>
        </div>

        <div
          className={`flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium ${
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
          {dirty ? "Ada perubahan belum disimpan" : "Tidak ada perubahan"}
        </div>
      </motion.header>

      {/* INTRO STRIP */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E9DED2] bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EBE0] text-[#6B2D2C]">
            <FileText size={19} />
          </div>
          <div>
            <p className="text-xs text-[#8A7A6F]">Pengaturan pesan</p>
            <p className="mt-0.5 text-sm font-semibold text-[#4A1A1A]">
              Bebas diedit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#E9DED2] bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EBE0] text-[#6B2D2C]">
            <Variable size={19} />
          </div>
          <div>
            <p className="text-xs text-[#8A7A6F]">Data otomatis</p>
            <p className="mt-0.5 text-sm font-semibold text-[#4A1A1A]">
              Variabel dinamis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#E9DED2] bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EBE0] text-[#6B2D2C]">
            <ShieldCheck size={19} />
          </div>
          <div>
            <p className="text-xs text-[#8A7A6F]">Pratinjau</p>
            <p className="mt-0.5 text-sm font-semibold text-[#4A1A1A]">
              Sebelum dikirim
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl border border-[#E9DED2] bg-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EBE0] text-[#6B2D2C]">
            <LoaderCircle size={25} className="animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#4A1A1A]">
              Memuat pengaturan
            </p>
            <p className="mt-1 text-xs text-[#8A7A6F]">
              Mengambil template pesan dari server...
            </p>
          </div>
        </div>
      ) : loadError ? (
        <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[#4A1A1A]">
                Pengaturan gagal dimuat
              </h2>
              <p className="mt-2 break-words text-sm leading-6 text-[#817269]">
                {loadError}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#817269]">
                Periksa sesi admin dan endpoint penyimpanan terlebih dahulu.
                Halaman tidak menimpa pesan yang tersimpan dengan template
                bawaan secara otomatis.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-[#6B2D2C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A1A1A]"
              >
                Coba muat ulang
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          {/* EDITOR */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E9DED2] bg-white shadow-[0_12px_40px_rgba(74,26,26,0.045)]">
            <div className="border-b border-[#F0E7DD] px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A17B67]">
                    Message builder
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-[#4A1A1A]">
                    Editor pesan
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#8A7A6F]">
                    Tulis pesan sesuai gaya komunikasi brand kamu.
                  </p>
                </div>

                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F0E8] text-[#6B2D2C] sm:flex">
                  <FileText size={21} />
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              {/* VARIABLES */}
              <div className="overflow-hidden rounded-2xl border border-[#E9DED2] bg-[#FFFCF8]">
                <button
                  type="button"
                  onClick={() => setShowVariables((current) => !current)}
                  aria-expanded={showVariables}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#F9F2EA]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E2D5] text-[#6B2D2C]">
                      <Variable size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#4A1A1A]">
                        Variabel otomatis
                      </span>
                      <span className="mt-0.5 block text-xs text-[#8A7A6F]">
                        Klik untuk menyisipkan data ke pesan
                      </span>
                    </span>
                  </span>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#8A7A6F] transition-transform ${
                      showVariables ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showVariables && (
                  <div className="border-t border-[#E9DED2] p-4">
                    <div className="flex flex-wrap gap-2">
                      {WHATSAPP_TEMPLATE_VARIABLES.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          title={item.desc}
                          onClick={() => insertAtCursor(`{${item.key}}`)}
                          className="rounded-lg border border-[#E3D1C2] bg-white px-3 py-2 font-mono text-[11px] text-[#6B2D2C] transition hover:border-[#6B2D2C] hover:bg-[#6B2D2C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2D2C]/30"
                        >
                          {`{${item.key}}`}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#8A7A6F]">
                      Variabel akan diganti dengan data yang sesuai saat pesan
                      dibuat. Pastikan nama variabel ditulis dengan benar.
                    </p>
                  </div>
                )}
              </div>

              {/* TEXT EDITOR */}
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
                      tooLong
                        ? "font-semibold text-red-600"
                        : "text-[#8A7A6F]"
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
                  onChange={(event) => setValue(event.target.value)}
                  rows={18}
                  spellCheck={false}
                  placeholder="Tulis pesan untuk pelanggan di sini..."
                  className="w-full resize-y rounded-2xl border border-[#E5D9CE] bg-[#FFFEFC] px-4 py-4 text-sm leading-7 text-[#3F3029] outline-none transition placeholder:text-[#B5A69A] focus:border-[#8A4542] focus:ring-4 focus:ring-[#8A4542]/10"
                />

                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#F8F3EC] p-3.5">
                  <Sparkles
                    size={16}
                    className="mt-0.5 shrink-0 text-[#A17B45]"
                  />
                  <p className="text-xs leading-5 text-[#78685C]">
                    Gunakan <code className="rounded bg-white px-1.5 py-0.5 text-[#6B2D2C]">*teks*</code>{" "}
                    untuk <strong>tebal</strong> atau{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 text-[#6B2D2C]">_teks_</code>{" "}
                    untuk <em>miring</em>. Format ini akan mengikuti format
                    WhatsApp.
                  </p>
                </div>

                {missingLink && !empty && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Link foto belum disertakan
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Tambahkan variabel{" "}
                        <code className="rounded bg-amber-100 px-1.5 py-0.5">
                          {"{link_foto}"}
                        </code>{" "}
                        agar pelanggan menerima link untuk melihat dan
                        mengunduh hasil fotonya.
                      </p>
                    </div>
                  </div>
                )}

                {empty && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Pesan tidak boleh kosong.
                  </p>
                )}

                {tooLong && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Pesan melebihi batas karakter. Kurangi panjang pesan
                    sebelum menyimpan.
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="border-t border-[#F0E7DD] pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!dirty || empty || tooLong || saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#6B2D2C] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#6B2D2C]/10 transition hover:bg-[#4A1A1A] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {saving ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {saving ? "Menyimpan perubahan..." : "Simpan perubahan"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving || value === DEFAULT_WHATSAPP_TEMPLATE}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E5D9CE] bg-white px-5 py-3 text-sm font-medium text-[#6D5548] transition hover:bg-[#F9F3EC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw size={16} />
                    Reset bawaan
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#948377]">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  <p>
                    Perubahan baru diterapkan setelah berhasil disimpan.
                    Reset bawaan hanya mengubah isi editor sampai kamu menekan
                    tombol Simpan.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E9DED2] bg-white shadow-[0_12px_40px_rgba(74,26,26,0.045)] xl:sticky xl:top-5">
            <div className="border-b border-[#F0E7DD] px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A17B67]">
                    Live preview
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-[#4A1A1A]">
                    Pratinjau WhatsApp
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#8A7A6F]">
                    Contoh pesan yang akan diterima pelanggan.
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  LANGSUNG
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* CHAT MOCKUP */}
              <div className="mx-auto max-w-[480px] overflow-hidden rounded-[22px] border border-[#D8D2CA] bg-[#EDE7DF] shadow-[0_16px_40px_rgba(48,35,27,0.12)]">
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3.5 text-white">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7D5C2] text-[#6B2D2C]">
                    <MessageCircle size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {APP_NAME}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/75">
                      Pesan bisnis
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-white/90">
                    <MessageCircle size={18} />
                    <ChevronDown size={18} />
                  </div>
                </div>

                {/* CHAT CONTENT */}
                <div
                  className="max-h-[min(65vh,680px)] min-h-[360px] overflow-y-auto px-3 py-5 sm:px-4"
                  style={{
                    backgroundColor: "#EFEAE2",
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(135,118,99,0.07) 1px, transparent 1.5px), radial-gradient(circle at 80% 60%, rgba(135,118,99,0.06) 1px, transparent 1.5px)",
                    backgroundSize: "24px 24px, 31px 31px",
                  }}
                >
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-lg bg-[#FCF7E8] px-3 py-1.5 text-[10px] font-medium text-[#827363] shadow-sm">
                      HARI INI
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[96%] rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-3 text-[13px] leading-[1.7] text-[#26332A] shadow-sm sm:max-w-[94%]">
                      <div className="whitespace-pre-wrap break-words">
                        {empty ? (
                          <span className="italic text-[#829080]">
                            Isi pesan akan muncul di sini...
                          </span>
                        ) : (
                          renderWhatsAppText(preview)
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-[#758274]">
                          14.30
                        </span>
                        <CheckCheck
                          size={15}
                          className="text-[#53A5D4]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <span className="max-w-[260px] rounded-lg bg-white/80 px-3 py-2 text-center text-[10px] leading-4 text-[#81766B] shadow-sm">
                      Simulasi tampilan pesan. Pesan ini belum dikirim ke
                      pelanggan.
                    </span>
                  </div>
                </div>

                {/* CHAT COMPOSER */}
                <div className="flex items-center gap-3 border-t border-[#D8D1C8] bg-[#F7F5F1] px-3 py-3">
                  <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-[#E5E0D9] bg-white px-4 text-xs text-[#A7A29C]">
                    Pesan
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white">
                    <MessageCircle size={18} />
                  </div>
                </div>
              </div>

              {/* PREVIEW INFO */}
              <div className="mt-4 rounded-2xl border border-[#E9DED2] bg-[#FFFCF8] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E2D5] text-[#6B2D2C]">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#4A1A1A]">
                      Preview diperbarui otomatis
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#89786B]">
                      Perubahan teks terlihat langsung di sini. Kamu bisa
                      memeriksa isi pesan sebelum menyimpan pengaturan.
                    </p>
                  </div>
                </div>
              </div>

              {missingLink && !empty && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />
                  <p className="text-xs leading-5 text-amber-900">
                    Variabel{" "}
                    <code className="rounded bg-amber-100 px-1.5 py-0.5">
                      {"{link_foto}"}
                    </code>{" "}
                    belum ada di pesan.
                  </p>
                </div>
              )}

              {!dirty && !empty && !missingLink && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <Check size={16} className="shrink-0" />
                  Tidak ada perubahan yang menunggu disimpan.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
