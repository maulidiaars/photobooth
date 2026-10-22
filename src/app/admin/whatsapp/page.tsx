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
  LoaderCircle,
  Lock,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
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
/* Potongan kecil UI                                                   */
/* ------------------------------------------------------------------ */

/** Pil "otomatis": dipakai di editor, legenda, dan catatan. */
function AutoPill({
  label,
  title,
  small = false,
}: {
  label: string;
  title?: string;
  small?: boolean;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex shrink-0 select-none items-center gap-1 rounded-full border border-[#6B2D2C]/20 bg-[#6B2D2C]/[0.07] font-medium text-[#6B2D2C]",
        small ? "h-5 px-2 text-[11px]" : "h-7 px-3 text-xs"
      )}
    >
      <Lock size={small ? 9 : 11} strokeWidth={2.4} />
      {label}
    </span>
  );
}

function VariableChip({ variableKey }: { variableKey: WhatsappVariableKey }) {
  const meta = WHATSAPP_TEMPLATE_VARIABLES.find(
    (item) => item.key === variableKey
  );

  return (
    <AutoPill
      label={meta?.label ?? variableKey}
      title={`${meta?.desc ?? variableKey}. Diisi otomatis dan tidak bisa diubah.`}
    />
  );
}

function MarkerGlyph({ marker }: { marker: string }) {
  if (!marker) return null;

  return (
    <span
      title="Penanda tebal/miring WhatsApp, diatur otomatis"
      className="inline-flex h-7 select-none items-center font-mono text-xs text-[#8B5A4B]/40"
    >
      {marker}
    </span>
  );
}

function Hairline() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-[#6B2D2C]/20 via-[#8B5A4B]/35 to-[#6B2D2C]/20" />
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
          "w-0 min-w-full resize-none overflow-hidden bg-transparent caret-[#6B2D2C] outline-none focus-visible:outline-none",
          spacer
            ? "text-[#8B5A4B] placeholder:text-transparent group-hover:placeholder:text-[#8B5A4B]/50 focus:placeholder:text-[#8B5A4B]/60"
            : "text-ink placeholder:text-[#8B5A4B]/40"
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

  return (
    <div className="group flex items-start gap-1.5">
      <span className="w-6 shrink-0 select-none pt-[7px] text-right font-serif text-[11px] italic text-[#8B5A4B]/40">
        {number}
      </span>

      <div
        className={clsx(
          "relative flex min-w-0 flex-1 flex-wrap items-start gap-x-1.5 gap-y-1 rounded-xl px-3 transition-all duration-150",
          "hover:bg-[#F5EBE0]/70 focus-within:bg-white focus-within:shadow-[0_0_0_1.5px_rgba(107,45,44,0.35),0_6px_18px_-8px_rgba(107,45,44,0.3)]",
          spacer ? "py-0" : "py-1"
        )}
      >
        {spacer && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 border-t border-dotted border-[#8B5A4B]/25 group-focus-within:opacity-0"
          />
        )}

        {line.parts.map((part, index) => {
          if (part.type === "var") {
            return (
              <span key={`v-${index}`} className="flex h-7 items-center">
                <VariableChip variableKey={part.key} />
              </span>
            );
          }

          const { lead, display, trail } = getMarkers(line.parts, index);

          return (
            <span
              key={`t-${index}`}
              className={clsx(
                "relative inline-flex max-w-full items-start gap-0.5",
                textOnly && "w-full flex-1 basis-full"
              )}
            >
              <MarkerGlyph marker={lead} />
              <AutoText
                value={display}
                spacer={spacer}
                fill={textOnly}
                placeholder={spacer ? "jarak antar paragraf" : undefined}
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

      <div className="flex w-[3.25rem] shrink-0 items-center gap-0.5 pt-0.5 opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          type="button"
          onClick={onAddBelow}
          aria-label="Tambah baris di bawah"
          title="Tambah baris di bawah"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B2D2C] transition-colors hover:bg-[#6B2D2C]/10"
        >
          <Plus size={15} strokeWidth={2.2} />
        </button>

        {textOnly && canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus baris"
            title="Hapus baris"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B2D2C] transition-colors hover:bg-[#6B2D2C]/10"
          >
            <Trash2 size={14} strokeWidth={2.1} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Satu butir catatan di panel samping. */
function NoteItem({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 font-serif text-lg italic leading-none text-[#6B2D2C]/50">
        {index}.
      </span>
      <div className="min-w-0">
        <p className="font-serif text-[15px] font-semibold text-[#4A1A1A]">
          {title}
        </p>
        <div className="mt-1 text-[13px] leading-6 text-[#6B5A50]">
          {children}
        </div>
      </div>
    </li>
  );
}

const codeCls =
  "rounded bg-[#F5EBE0] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[#6B2D2C]";

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
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 pb-12">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6B2D2C] text-[#F5EBE0] shadow-lg shadow-[#6B2D2C]/20">
              <MessageCircle size={21} strokeWidth={1.9} />
            </div>

            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold tracking-wide text-[#4A1A1A] sm:text-3xl">
                Pesan WhatsApp
              </h1>
              <p className="font-serif text-sm italic tracking-wide text-[#8B5A4B]">
                kata-kata yang diterima pelanggan setelah sesi foto
              </p>
            </div>
          </div>

          {!loading && !loadError && (
            <div className="flex items-center gap-2 font-serif text-sm italic text-[#8B5A4B]">
              <span
                className={clsx(
                  "h-2 w-2 rounded-full transition-colors",
                  dirty ? "bg-amber-500" : "bg-emerald-600"
                )}
              />
              {dirty ? "Belum disimpan" : "Tersimpan"}
            </div>
          )}
        </div>

        <Hairline />
      </motion.header>

      {loading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-[#E9DED2] bg-white/70">
          <LoaderCircle size={26} className="animate-spin text-[#6B2D2C]" />
          <p className="font-serif text-sm italic text-[#8B5A4B]">
            Memuat template pesan...
          </p>
        </div>
      ) : loadError ? (
        <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="font-serif text-base font-semibold text-[#4A1A1A]">
                Template gagal dimuat
              </h2>
              <p className="mt-2 break-words text-sm leading-6 text-[#817269]">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-[#6B2D2C] px-4 py-2.5 text-sm font-semibold text-[#F5EBE0] transition hover:bg-[#4A1A1A]"
              >
                Coba muat ulang
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          {/* ===================== EDITOR ===================== */}
          <section className="min-w-0 overflow-clip rounded-3xl border border-[#E9DED2] bg-[#FFFCF6] shadow-[0_24px_60px_-28px_rgba(74,26,26,0.35)]">
            <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-8">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#4A1A1A]">
                  Isi pesan
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[#8B5A4B]">
                  Klik kalimat mana saja untuk mengubahnya. Tekan{" "}
                  <kbd className="rounded border border-[#E0D2C2] bg-white px-1.5 py-px font-mono text-[11px] text-[#6B2D2C]">
                    Enter
                  </kbd>{" "}
                  untuk baris baru.
                </p>
              </div>

              <span
                className={clsx(
                  "shrink-0 pt-1.5 font-serif text-xs italic tabular-nums",
                  tooLong ? "font-semibold text-red-600" : "text-[#8B5A4B]/70"
                )}
              >
                {value.length.toLocaleString("id-ID")} /{" "}
                {WHATSAPP_TEMPLATE_MAX_LENGTH.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="px-6 sm:px-8">
              <Hairline />
            </div>

            {/* Baris-baris pesan */}
            <div className="flex flex-col gap-0.5 px-3 py-5 sm:px-5">
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

            {/* Legenda satu baris */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-[#E9DED2] bg-[#F9F1E4]/70 px-6 py-3 text-xs text-[#8B5A4B] sm:px-8">
              <span>Teks biasa bisa kamu ketik.</span>
              <AutoPill label="Otomatis" small />
              <span>diisi sistem untuk tiap pelanggan, tidak bisa diubah.</span>
            </div>

            {/* Tombol simpan (nempel di bawah saat scroll) */}
            <div className="sticky bottom-0 z-10 border-t border-[#E9DED2] bg-[#FFFCF6]/95 px-6 py-4 backdrop-blur sm:px-8">
              {tooLong && (
                <p className="mb-3 text-xs font-semibold text-red-600">
                  Pesan melebihi batas karakter. Kurangi dulu sebelum
                  menyimpan.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-[#8B5A4B] transition hover:bg-[#6B2D2C]/10 hover:text-[#6B2D2C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={15} />
                  Kembalikan bawaan
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || empty || tooLong || saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6B2D2C] px-7 py-2.5 font-serif text-[15px] font-medium tracking-wide text-[#F5EBE0] shadow-lg shadow-[#6B2D2C]/25 transition hover:bg-[#4A1A1A] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
          </section>

          {/* ===================== SAMPING: PRATINJAU + CATATAN ===================== */}
          <aside className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-2">
            {/* Pratinjau */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-bold text-[#4A1A1A]">
                  Pratinjau
                </h2>
                <span className="inline-flex items-center gap-1.5 font-serif text-xs italic text-[#8B5A4B]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  diperbarui langsung
                </span>
              </div>

              <div className="rounded-3xl border border-[#E9DED2] bg-[#EFE5D5] p-4 sm:p-5">
                {empty ? (
                  <p className="py-6 text-center font-serif text-sm italic text-[#8B5A4B]">
                    Isi pesan akan muncul di sini.
                  </p>
                ) : (
                  <WhatsAppBubble text={previewText} time={previewTime} />
                )}
              </div>

              <p className="mt-3 font-serif text-xs italic leading-5 text-[#8B5A4B]/80">
                Data di pratinjau hanya contoh. Saat dikirim, bagian otomatis
                diganti data asli tiap pelanggan.
              </p>
            </div>

            {/* Catatan: sengaja polos tanpa kartu, beda dari area edit */}
            <div className="border-l-2 border-dashed border-[#6B2D2C]/25 pl-5">
              <h2 className="font-hand text-2xl leading-none text-[#6B2D2C]">
                catatan kecil
              </h2>

              <ul className="mt-4 flex flex-col gap-5">
                <NoteItem index={1} title="Huruf tebal & miring">
                  Apit kata dengan <code className={codeCls}>*bintang*</code>{" "}
                  supaya <b>tebal</b>, atau{" "}
                  <code className={codeCls}>_garis bawah_</code> supaya{" "}
                  <i>miring</i>, sama seperti di WhatsApp.
                </NoteItem>

                <NoteItem index={2} title="Bagian otomatis">
                  <p className="mb-2">
                    Pil bergembok akan diganti data asli saat pesan dikirim.
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {WHATSAPP_TEMPLATE_VARIABLES.map((item) => (
                      <li key={item.key} className="flex items-start gap-2">
                        <AutoPill label={item.label} small />
                        <span className="pt-px text-[12px] leading-5">
                          {item.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </NoteItem>

                <NoteItem index={3} title="Link foto">
                  Selalu ikut terkirim, jadi pelanggan pasti bisa mengunduh
                  fotonya.
                </NoteItem>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
