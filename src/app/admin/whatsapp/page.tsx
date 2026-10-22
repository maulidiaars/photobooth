"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCheck,
  Info,
  LoaderCircle,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getWhatsappTemplate,
  saveWhatsappTemplate,
} from "@/services/settingsService";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_TEMPLATE_MAX_LENGTH,
  WHATSAPP_TEMPLATE_VARIABLES,
  ensureRequiredVariables,
  parseTemplateToLines,
  renderWhatsappTemplate,
  serializeTemplateLines,
  type TemplatePart,
  type WhatsappTemplateVars,
  type WhatsappVariableKey,
} from "@/lib/whatsappTemplate";
import { APP_NAME, APP_URL } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Model editor: satu baris = beberapa potongan teks / variabel        */
/* ------------------------------------------------------------------ */

interface EditorLine {
  id: string;
  parts: TemplatePart[];
}

let lineCounter = 0;
const makeId = () => `line-${++lineCounter}`;

const makeTextLine = (value: string): EditorLine => ({
  id: makeId(),
  parts: [{ type: "text", value }],
});

const toEditorLines = (template: string): EditorLine[] =>
  parseTemplateToLines(template).map((parts) => ({
    id: makeId(),
    parts,
  }));

const toTemplate = (lines: EditorLine[]) =>
  serializeTemplateLines(lines.map((line) => line.parts));

const isTextOnly = (line: EditorLine) =>
  line.parts.every((part) => part.type === "text");

/**
 * Penanda format WhatsApp (* atau _) yang menempel di sebelah
 * variabel dipisah dari teks, supaya admin nggak lihat / ngerusak
 * tanda bintang itu. Tanda ini tetap ikut tersimpan di template.
 */
function getMarkers(parts: TemplatePart[], index: number) {
  const part = parts[index];
  let rest = part?.type === "text" ? part.value : "";
  let lead = "";
  let trail = "";

  if (parts[index - 1]?.type === "var" && /^[*_]/.test(rest)) {
    lead = rest.charAt(0);
    rest = rest.slice(1);
  }

  if (parts[index + 1]?.type === "var" && /[*_]$/.test(rest)) {
    trail = rest.slice(-1);
    rest = rest.slice(0, -1);
  }

  return { lead, display: rest, trail };
}

interface PendingFocus {
  lineId: string;
  partIndex: number;
  caret: number | "end";
}

/* ------------------------------------------------------------------ */
/* Data contoh buat preview                                            */
/* ------------------------------------------------------------------ */

const SAMPLE_VARS = Object.fromEntries(
  WHATSAPP_TEMPLATE_VARIABLES.map((item) => [
    item.key,
    item.key === "nama_brand"
      ? APP_NAME
      : item.key === "link_foto"
      ? `${APP_URL}/foto/a1b2c3d4`
      : item.sample,
  ])
) as WhatsappTemplateVars;

const WA_FONT =
  '"Segoe UI", "Helvetica Neue", Helvetica, "Lucida Grande", Arial, sans-serif';

/** Format WhatsApp: *tebal*, _miring_, dan link otomatis berwarna biru. */
function renderWhatsAppText(text: string): ReactNode[] {
  return text
    .split(/(https?:\/\/\S+|\*[^*\n]+\*|_[^_\n]+_)/g)
    .map((part, index) => {
      if (!part) return null;

      if (/^https?:\/\//.test(part)) {
        return (
          <span key={index} className="text-[#027EB5]">
            {part}
          </span>
        );
      }

      if (/^\*[^*\n]+\*$/.test(part)) {
        return (
          <strong key={index} className="font-bold">
            {part.slice(1, -1)}
          </strong>
        );
      }

      if (/^_[^_\n]+_$/.test(part)) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }

      return <span key={index}>{part}</span>;
    });
}

/* ------------------------------------------------------------------ */
/* Bubble WhatsApp                                                     */
/* ------------------------------------------------------------------ */

function WhatsAppBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-end pr-2">
      <div
        className="relative w-full max-w-[400px] rounded-lg rounded-tr-none bg-[#D9FDD3] px-[9px] pb-[5px] pt-[6px] text-[14.2px] leading-[19px] text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
        style={{ fontFamily: WA_FONT }}
      >
        {/* Ekor bubble */}
        <svg
          viewBox="0 0 8 13"
          width="8"
          height="13"
          aria-hidden
          className="absolute -right-2 top-0 text-[#D9FDD3]"
        >
          <path
            fill="currentColor"
            d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"
          />
        </svg>

        <div className="whitespace-pre-wrap break-words">
          {renderWhatsAppText(text)}
        </div>

        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] leading-[15px] text-[#667781]">
          <span>{time}</span>
          <CheckCheck size={16} strokeWidth={2} className="text-[#53BDEB]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu catatan (dibedakan jelas dari area yang bisa diedit)          */
/* ------------------------------------------------------------------ */

function NoteCard({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "tip";
}) {
  return (
    <div
      className={clsx(
        "flex gap-3 rounded-2xl border p-4 text-sm leading-6",
        tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      )}
    >
      <div
        className={clsx(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          tone === "info"
            ? "bg-sky-100 text-sky-700"
            : "bg-amber-100 text-amber-700"
        )}
      >
        <Info size={16} strokeWidth={2.4} />
      </div>

      <div className="min-w-0">
        <p
          className={clsx(
            "text-[11px] font-bold uppercase tracking-wider",
            tone === "info" ? "text-sky-700" : "text-amber-700"
          )}
        >
          Catatan · {title}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen editor                                                     */
/* ------------------------------------------------------------------ */

function VariableChip({ variableKey }: { variableKey: WhatsappVariableKey }) {
  const meta = WHATSAPP_TEMPLATE_VARIABLES.find(
    (item) => item.key === variableKey
  );

  return (
    <span
      title={`${meta?.desc ?? variableKey}. Diisi otomatis dan tidak bisa diubah.`}
      className="inline-flex h-7 shrink-0 select-none items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2.5 text-xs font-bold text-amber-900"
    >
      <Lock size={11} strokeWidth={2.6} />
      {meta?.label ?? variableKey}
    </span>
  );
}

function MarkerGlyph({ marker }: { marker: string }) {
  if (!marker) return null;

  return (
    <span
      title="Penanda tebal/miring WhatsApp, diatur otomatis"
      className="inline-flex h-7 select-none items-center rounded bg-stone-100 px-1 font-mono text-xs font-bold text-stone-400"
    >
      {marker}
    </span>
  );
}

interface AutoTextProps {
  value: string;
  spacer: boolean;
  fill: boolean;
  placeholder?: string;
  ariaLabel: string;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * Textarea yang tingginya ngikutin isi (bisa kebungkus ke baris
 * berikutnya) dan lebarnya ngikutin teks, jadi bisa ditaruh
 * sebaris sama chip variabel.
 */
function AutoText({
  value,
  spacer,
  fill,
  placeholder,
  ariaLabel,
  textareaRef,
  onChange,
  onKeyDown,
}: AutoTextProps) {
  const shared = clsx(
    "whitespace-pre-wrap break-words px-1 [grid-area:1/1]",
    spacer ? "text-xs italic leading-7" : "text-[15px] leading-7"
  );

  return (
    <span
      className={clsx(
        "inline-grid min-w-[1rem] max-w-full",
        fill && "w-full flex-1 basis-full"
      )}
    >
      <span aria-hidden className={clsx(shared, "invisible")}>
        {value + " "}
      </span>

      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={clsx(
          shared,
          "w-0 min-w-full resize-none overflow-hidden bg-transparent caret-garnet outline-none placeholder:text-stone-400 focus-visible:outline-none",
          spacer ? "text-stone-500" : "text-ink"
        )}
      />
    </span>
  );
}

interface LineRowProps {
  line: EditorLine;
  number: number;
  canRemove: boolean;
  registerRef: (
    partIndex: number
  ) => (el: HTMLTextAreaElement | null) => void;
  onChangeText: (partIndex: number, value: string) => void;
  onKeyDown: (
    partIndex: number,
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  onAddBelow: () => void;
  onRemove: () => void;
}

function LineRow({
  line,
  number,
  canRemove,
  registerRef,
  onChangeText,
  onKeyDown,
  onAddBelow,
  onRemove,
}: LineRowProps) {
  const textOnly = isTextOnly(line);
  const firstPart = line.parts[0];
  const spacer =
    textOnly && firstPart?.type === "text" && firstPart.value === "";
  const variant = !textOnly ? "auto" : spacer ? "spacer" : "text";

  return (
    <div className="group flex items-start gap-2">
      <span className="w-6 shrink-0 select-none pt-2.5 text-right font-mono text-[11px] text-stone-400">
        {String(number).padStart(2, "0")}
      </span>

      <div
        className={clsx(
          "flex min-w-0 flex-1 flex-wrap items-start gap-x-1.5 gap-y-1 rounded-xl border px-2.5 py-1.5 transition",
          variant === "spacer" &&
            "border-dashed border-stone-300 bg-stone-50/60 hover:border-stone-400 focus-within:border-garnet focus-within:bg-white focus-within:ring-2 focus-within:ring-garnet/15",
          variant === "text" &&
            "border-stone-300 bg-white shadow-sm hover:border-stone-400 focus-within:border-garnet focus-within:ring-2 focus-within:ring-garnet/15",
          variant === "auto" &&
            "border-amber-200 border-l-4 border-l-amber-400 bg-amber-50/60 hover:border-amber-300 hover:border-l-amber-400 focus-within:border-amber-300 focus-within:border-l-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-300/30"
        )}
      >
        {line.parts.map((part, index) => {
          if (part.type === "var") {
            return <VariableChip key={`v-${index}`} variableKey={part.key} />;
          }

          const { lead, display, trail } = getMarkers(line.parts, index);

          return (
            <span
              key={`t-${index}`}
              className={clsx(
                "inline-flex max-w-full items-start gap-0.5",
                textOnly && "w-full flex-1 basis-full"
              )}
            >
              <MarkerGlyph marker={lead} />
              <AutoText
                value={display}
                spacer={spacer}
                fill={textOnly}
                placeholder={
                  spacer
                    ? "Baris kosong = jarak antar paragraf (klik kalau mau diisi)"
                    : undefined
                }
                ariaLabel="Isi kalimat"
                textareaRef={registerRef(index)}
                onChange={(value) => onChangeText(index, lead + value + trail)}
                onKeyDown={(event) => onKeyDown(index, event)}
              />
              <MarkerGlyph marker={trail} />
            </span>
          );
        })}
      </div>

      <div className="flex w-[3.5rem] shrink-0 items-center gap-0.5 pt-1.5">
        <button
          type="button"
          onClick={onAddBelow}
          aria-label="Tambah baris di bawah"
          title="Tambah baris di bawah"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Plus size={15} strokeWidth={2.4} />
        </button>

        {textOnly && canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus baris"
            title="Hapus baris"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} strokeWidth={2.3} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default function AdminWhatsappPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [savedValue, setSavedValue] = useState("");

  const inputRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<PendingFocus | null>(null);

  const value = useMemo(() => toTemplate(lines), [lines]);
  const dirty = value !== savedValue;
  const empty = value.trim().length === 0;
  const tooLong = value.length > WHATSAPP_TEMPLATE_MAX_LENGTH;

  const previewTime = useMemo(
    () =>
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    []
  );

  const previewText = useMemo(
    () => renderWhatsappTemplate(value, SAMPLE_VARS),
    [value]
  );

  /* ----- muat template yang tersimpan ----- */
  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      try {
        const result = await getWhatsappTemplate();

        if (cancelled) return;

        setSavedValue(result.template);
        setLines(toEditorLines(ensureRequiredVariables(result.template)));
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

  /* ----- fokus ke baris yang baru dibuat / baris sebelumnya ----- */
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;

    const el = inputRefs.current.get(`${target.lineId}:${target.partIndex}`);
    pendingFocus.current = null;
    if (!el) return;

    el.focus();

    const position = target.caret === "end" ? el.value.length : target.caret;
    el.setSelectionRange(position, position);
  }, [lines]);

  /* ----- peringatan kalau keluar halaman padahal belum disimpan ----- */
  useEffect(() => {
    if (!dirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ----- simpan ----- */
  const handleSave = async () => {
    if (!dirty || empty || tooLong || saving) return;

    setSaving(true);

    try {
      const result = await saveWhatsappTemplate(value);

      setSavedValue(result.template);
      toast.push(
        "Template tersimpan dan langsung dipakai untuk pesan berikutnya.",
        "success"
      );
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

  // Ctrl/Cmd + S = simpan
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleReset = () => {
    setLines(toEditorLines(DEFAULT_WHATSAPP_TEMPLATE));
    toast.push(
      "Template bawaan dipulihkan. Tekan Simpan untuk menerapkannya.",
      "info"
    );
  };

  /* ----- aksi di editor ----- */
  const changeText = (lineId: string, partIndex: number, raw: string) => {
    // Kurung kurawal dibuang supaya variabel nggak bisa dibuat/diubah manual.
    const clean = raw.replace(/[{}]/g, "").replace(/\r?\n/g, " ");

    setLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              parts: line.parts.map((part, index) =>
                index === partIndex && part.type === "text"
                  ? { ...part, value: clean }
                  : part
              ),
            }
          : line
      )
    );
  };

  const addLineBelow = (lineId: string) => {
    const newLine = makeTextLine("");
    pendingFocus.current = { lineId: newLine.id, partIndex: 0, caret: 0 };

    setLines((current) =>
      current.flatMap((line) =>
        line.id === lineId ? [line, newLine] : [line]
      )
    );
  };

  const splitLine = (
    lineId: string,
    partIndex: number,
    before: string,
    after: string
  ) => {
    const newLine = makeTextLine(after);
    pendingFocus.current = { lineId: newLine.id, partIndex: 0, caret: 0 };

    setLines((current) =>
      current.flatMap((line) => {
        if (line.id !== lineId) return [line];

        const parts: TemplatePart[] = line.parts.map((part, index) =>
          index === partIndex && part.type === "text"
            ? { ...part, value: before }
            : part
        );

        return [{ ...line, parts }, newLine];
      })
    );
  };

  const removeLine = (lineId: string) => {
    if (lines.length <= 1) return;

    const index = lines.findIndex((line) => line.id === lineId);
    const neighbour = lines[index - 1] ?? lines[index + 1];

    if (neighbour) {
      pendingFocus.current = {
        lineId: neighbour.id,
        partIndex: neighbour.parts.length - 1,
        caret: "end",
      };
    }

    setLines((current) => current.filter((line) => line.id !== lineId));
  };

  const handleKeyDown = (
    line: EditorLine,
    partIndex: number,
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter") {
      event.preventDefault();

      const el = event.currentTarget;
      const isLastPart = partIndex === line.parts.length - 1;

      if (isLastPart) {
        const caretStart = el.selectionStart ?? el.value.length;
        const caretEnd = el.selectionEnd ?? caretStart;
        const { lead } = getMarkers(line.parts, partIndex);

        splitLine(
          line.id,
          partIndex,
          lead + el.value.slice(0, caretStart),
          el.value.slice(caretEnd)
        );
      } else {
        addLineBelow(line.id);
      }

      return;
    }

    const firstPart = line.parts[0];

    if (
      event.key === "Backspace" &&
      isTextOnly(line) &&
      firstPart?.type === "text" &&
      firstPart.value === "" &&
      lines.length > 1
    ) {
      event.preventDefault();
      removeLine(line.id);
    }
  };

  const registerRef =
    (lineId: string) =>
    (partIndex: number) =>
    (el: HTMLTextAreaElement | null) => {
      const key = `${lineId}:${partIndex}`;

      if (el) {
        inputRefs.current.set(key, el);
      } else {
        inputRefs.current.delete(key);
      }
    };

  /* ----- tampilan ----- */
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 pb-10">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-garnet text-white shadow-lg shadow-garnet/20">
            <MessageCircle size={22} strokeWidth={1.9} />
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-garnet-dark sm:text-3xl">
              Pesan WhatsApp
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-stone-600">
              Atur isi pesan yang dikirim ke pelanggan setelah sesi foto.
              Hasilnya langsung terlihat di sebelah kanan.
            </p>
          </div>
        </div>

        {!loading && !loadError && (
          <div
            className={clsx(
              "flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              dirty
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            )}
          >
            <span
              className={clsx(
                "h-2 w-2 rounded-full",
                dirty ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
            {dirty ? "Belum disimpan" : "Tersimpan"}
          </div>
        )}
      </motion.header>

      {loading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-stone-200 bg-white">
          <LoaderCircle size={26} className="animate-spin text-garnet" />
          <p className="text-sm text-stone-500">Memuat template pesan...</p>
        </div>
      ) : loadError ? (
        <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-garnet-dark">
                Template gagal dimuat
              </h2>
              <p className="mt-2 break-words text-sm leading-6 text-stone-600">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-garnet px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-garnet-dark"
              >
                Coba muat ulang
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* CARA PAKAI (catatan) */}
          <NoteCard title="Cara mengubah pesan">
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>
                Klik kalimat yang mau diubah di kotak putih, lalu ketik.
              </li>
              <li>
                Tekan <b>Enter</b> untuk baris baru, tombol <b>+</b> untuk
                menambah baris, ikon sampah untuk menghapus.
              </li>
              <li>
                Cek hasilnya di pratinjau, lalu tekan <b>Simpan perubahan</b>{" "}
                (atau <b>Ctrl + S</b>).
              </li>
            </ol>
          </NoteCard>

          <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
            {/* ===================== EDITOR ===================== */}
            <div className="flex min-w-0 flex-col gap-4">
              <section className="min-w-0 overflow-clip rounded-3xl border border-stone-200 bg-white shadow-[0_10px_34px_rgba(58,40,31,0.08)]">
                <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-garnet/10 text-garnet">
                      <Pencil size={17} strokeWidth={2.3} />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-garnet-dark">
                        Tulis pesan di sini
                      </h2>
                      <p className="text-xs text-stone-500">
                        Hanya kotak putih dan kuning yang bisa diedit
                      </p>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs tabular-nums",
                      tooLong
                        ? "bg-red-50 font-semibold text-red-600"
                        : "bg-stone-100 text-stone-500"
                    )}
                  >
                    {value.length.toLocaleString("id-ID")} /{" "}
                    {WHATSAPP_TEMPLATE_MAX_LENGTH.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Keterangan warna */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-200 bg-[#FBF6EC] px-5 py-3 text-xs text-stone-600 sm:px-6">
                  <span className="font-bold uppercase tracking-wider text-stone-500">
                    Keterangan:
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-5 w-9 rounded-md border border-stone-300 bg-white" />
                    Kalimat biasa (bisa diubah)
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-1.5 font-bold text-amber-900">
                      <Lock size={10} strokeWidth={2.6} />
                      Otomatis
                    </span>
                    Diisi sistem (terkunci)
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-5 w-9 rounded-md border border-dashed border-stone-300 bg-stone-50" />
                    Jarak antar paragraf
                  </span>
                </div>

                {/* Baris-baris pesan */}
                <div className="flex flex-col gap-2 bg-[#FFFDF8] px-3 py-5 sm:px-4">
                  {lines.map((line, index) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      number={index + 1}
                      canRemove={lines.length > 1}
                      registerRef={registerRef(line.id)}
                      onChangeText={(partIndex, text) =>
                        changeText(line.id, partIndex, text)
                      }
                      onKeyDown={(partIndex, event) =>
                        handleKeyDown(line, partIndex, event)
                      }
                      onAddBelow={() => addLineBelow(line.id)}
                      onRemove={() => removeLine(line.id)}
                    />
                  ))}
                </div>

                {/* Tombol simpan (nempel di bawah saat scroll) */}
                <div className="sticky bottom-0 z-10 border-t border-stone-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
                  {tooLong && (
                    <p className="mb-3 text-xs font-semibold text-red-600">
                      Pesan melebihi batas karakter. Kurangi dulu sebelum
                      menyimpan.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-stone-500">
                      {dirty
                        ? "Ada perubahan yang belum disimpan."
                        : "Semua perubahan sudah tersimpan."}
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={15} />
                        Kembalikan bawaan
                      </button>

                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!dirty || empty || tooLong || saving}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        {saving ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Save size={17} />
                        )}
                        {saving ? "Menyimpan..." : "Simpan perubahan"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* CATATAN: tebal / miring */}
              <NoteCard title="Huruf tebal & miring" tone="tip">
                <p>
                  Ketik <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] font-bold">*teks*</code>{" "}
                  supaya <b>tebal</b>, dan{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] font-bold">_teks_</code>{" "}
                  supaya <i>miring</i>, sama seperti di WhatsApp. Tanda{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] font-bold">*</code>{" "}
                  di sebelah kotak kuning diatur otomatis, biarkan saja.
                </p>
              </NoteCard>

              {/* CATATAN: bagian otomatis */}
              <NoteCard title="Bagian otomatis (bergembok)">
                <p className="mb-2">
                  Kotak kuning bergembok akan diganti data asli tiap pelanggan
                  saat pesan dikirim. Kamu tidak perlu mengetiknya:
                </p>
                <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {WHATSAPP_TEMPLATE_VARIABLES.map((item) => (
                    <li key={item.key} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-1.5 text-[11px] font-bold text-amber-900">
                        <Lock size={9} strokeWidth={2.6} />
                        {item.label}
                      </span>
                      <span className="text-[13px] leading-5 text-sky-900/80">
                        {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13px] text-sky-900/80">
                  Link foto selalu disertakan otomatis supaya pelanggan pasti
                  bisa mengunduh fotonya.
                </p>
              </NoteCard>
            </div>

            {/* ===================== PRATINJAU ===================== */}
            <aside className="min-w-0 xl:sticky xl:top-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-garnet-dark">
                  <Smartphone size={18} strokeWidth={2.2} />
                  Pratinjau
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  LANGSUNG
                </span>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#EFE7DA] p-4 sm:p-5">
                <p className="mb-3 text-center text-[11px] font-medium text-stone-500">
                  Begini tampilan pesan di WhatsApp pelanggan
                </p>

                {empty ? (
                  <p className="py-6 text-center text-sm italic text-stone-500">
                    Isi pesan akan muncul di sini.
                  </p>
                ) : (
                  <WhatsAppBubble text={previewText} time={previewTime} />
                )}
              </div>

              <p className="mt-3 text-[11px] leading-5 text-stone-500">
                Data di pratinjau hanya contoh. Saat dikirim, bagian bergembok
                diganti data asli tiap pelanggan.
              </p>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
