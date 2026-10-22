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
/* Bubble WhatsApp (tanpa container / header / keyboard)               */
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
/* Komponen editor                                                     */
/* ------------------------------------------------------------------ */

function VariableChip({ variableKey }: { variableKey: WhatsappVariableKey }) {
  const meta = WHATSAPP_TEMPLATE_VARIABLES.find(
    (item) => item.key === variableKey
  );

  return (
    <span
      title={`${meta?.desc ?? variableKey}. Diisi otomatis dan tidak bisa diubah.`}
      className="inline-flex h-6 shrink-0 select-none items-center gap-1 rounded-md border border-dashed border-[#C9A87C]/50 bg-[#C9A87C]/15 px-2 text-[11px] font-semibold text-[#E7CFA4]"
    >
      <Lock size={10} strokeWidth={2.6} />
      {meta?.label ?? variableKey}
    </span>
  );
}

function MarkerGlyph({ marker }: { marker: string }) {
  if (!marker) return null;

  return (
    <span
      title="Penanda tebal/miring WhatsApp, diatur otomatis"
      className="inline-flex h-6 select-none items-center font-mono text-xs text-[#C9A87C]/40"
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
    spacer ? "text-[11px] italic leading-6" : "text-sm leading-6"
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
          "w-0 min-w-full resize-none overflow-hidden bg-transparent caret-[#C9A87C] outline-none placeholder:text-[#C9A87C]/35",
          spacer ? "text-[#C9A87C]/70" : "text-[#F5EBE0]"
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
      <span className="w-6 shrink-0 select-none pt-2 text-right font-mono text-[10px] text-[#C9A87C]/30">
        {String(number).padStart(2, "0")}
      </span>

      <div
        className={clsx(
          "flex min-w-0 flex-1 flex-wrap items-start gap-x-1 gap-y-1 rounded-lg border px-2 py-1 transition-colors",
          variant === "spacer" &&
            "border-dashed border-[#3A2018] bg-transparent focus-within:border-[#C9A87C]/50 hover:border-[#6B2D2C]",
          variant === "text" &&
            "border-[#3A2018] bg-[#2A1510]/70 focus-within:border-[#C9A87C]/60 focus-within:bg-[#2A1510] hover:border-[#6B2D2C]",
          variant === "auto" &&
            "border-[#3A2018] border-l-2 border-l-[#C9A87C]/70 bg-[#150907] focus-within:border-y-[#C9A87C]/40 focus-within:border-r-[#C9A87C]/40 hover:bg-[#1C0E0B]"
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
                  spacer ? "Jarak antar paragraf (klik untuk menulis)" : undefined
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

      <div className="flex w-[3.25rem] shrink-0 items-center gap-0.5 pt-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          type="button"
          onClick={onAddBelow}
          aria-label="Tambah baris di bawah"
          title="Tambah baris di bawah"
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#C9A87C]/70 transition-colors hover:bg-[#3A2018] hover:text-[#F5EBE0]"
        >
          <Plus size={14} strokeWidth={2.4} />
        </button>

        {textOnly && canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus baris"
            title="Hapus baris"
            className="flex h-6 w-6 items-center justify-center rounded-md text-[#C9A87C]/70 transition-colors hover:bg-[#3A2018] hover:text-[#E58B80]"
          >
            <Trash2 size={13} strokeWidth={2.3} />
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
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 pb-10">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6B2D2C] text-white shadow-lg shadow-[#6B2D2C]/15">
            <MessageCircle size={22} strokeWidth={1.9} />
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#4A1A1A] sm:text-3xl">
              Pesan WhatsApp
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#817269]">
              Ubah kalimat pesan yang dikirim ke pelanggan setelah sesi foto.
              Bagian yang bertanda gembok diisi otomatis dan tidak bisa
              diubah.
            </p>
          </div>
        </div>

        {!loading && !loadError && (
          <div
            className={clsx(
              "flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              dirty
                ? "border-amber-200 bg-amber-50 text-amber-800"
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
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-[#E9DED2] bg-white">
          <LoaderCircle size={26} className="animate-spin text-[#6B2D2C]" />
          <p className="text-sm text-[#8A7A6F]">Memuat template pesan...</p>
        </div>
      ) : loadError ? (
        <section className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[#4A1A1A]">
                Template gagal dimuat
              </h2>
              <p className="mt-2 break-words text-sm leading-6 text-[#817269]">
                {loadError}
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
        <div className="grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          {/* EDITOR (tema gelap) */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#3A2018] bg-[#1B0D0A] shadow-[0_18px_50px_rgba(26,11,8,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#3A2018] bg-[#241210] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#F5EBE0]">
                  Isi pesan
                </h2>
                <p className="mt-0.5 text-xs text-[#C9A87C]/70">
                  Klik kalimat untuk mengubahnya. Tekan Enter untuk baris
                  baru.
                </p>
              </div>

              <span
                className={clsx(
                  "shrink-0 text-xs tabular-nums",
                  tooLong ? "font-semibold text-red-400" : "text-[#C9A87C]/60"
                )}
              >
                {value.length.toLocaleString("id-ID")} /{" "}
                {WHATSAPP_TEMPLATE_MAX_LENGTH.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Keterangan warna */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#3A2018] bg-[#1F0F0B] px-5 py-3 text-[11px] text-[#C9A87C]/80 sm:px-6">
              <span className="flex items-center gap-2">
                <span className="h-4 w-9 rounded border border-[#3A2018] bg-[#2A1510]" />
                Kalimat, bisa kamu ubah
              </span>

              <span className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center gap-1 rounded-md border border-dashed border-[#C9A87C]/50 bg-[#C9A87C]/15 px-1.5 font-semibold text-[#E7CFA4]">
                  <Lock size={9} strokeWidth={2.6} />
                  Otomatis
                </span>
                Diisi sistem, terkunci
              </span>

              <span className="flex items-center gap-2">
                <span className="w-9 border-t border-dashed border-[#6B4A3A]" />
                Jarak antar paragraf
              </span>
            </div>

            <div className="flex flex-col gap-1.5 px-3 py-4 sm:px-4">
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

            <div className="border-t border-[#3A2018] bg-[#150907] px-5 py-4 sm:px-6">
              <p className="mb-3 text-[11px] leading-5 text-[#C9A87C]/70">
                Pakai <code className="rounded bg-[#2A1510] px-1 py-0.5 text-[#E7CFA4]">*teks*</code>{" "}
                untuk tebal dan{" "}
                <code className="rounded bg-[#2A1510] px-1 py-0.5 text-[#E7CFA4]">_teks_</code>{" "}
                untuk miring, sama seperti di WhatsApp.
              </p>

              {tooLong && (
                <p className="mb-3 text-xs font-medium text-red-400">
                  Pesan melebihi batas karakter. Kurangi dulu sebelum
                  menyimpan.
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || empty || tooLong || saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C9A87C] px-6 py-2.5 text-sm font-semibold text-[#2A1510] shadow-md transition hover:bg-[#D8B98D] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Menyimpan..." : "Simpan perubahan"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#4A2A20] bg-transparent px-5 py-2.5 text-sm font-medium text-[#C9A87C] transition hover:bg-[#2A1510] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={15} />
                  Kembalikan bawaan
                </button>
              </div>
            </div>
          </section>

          {/* PREVIEW: bubble WhatsApp polos, tanpa container */}
          <aside className="min-w-0 xl:sticky xl:top-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-bold text-[#4A1A1A]">
                Pratinjau
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                LANGSUNG
              </span>
            </div>

            {empty ? (
              <p className="text-sm italic text-[#A39489]">
                Isi pesan akan muncul di sini.
              </p>
            ) : (
              <WhatsAppBubble text={previewText} time={previewTime} />
            )}

            <p className="mt-4 text-[11px] leading-5 text-[#9A8B80]">
              Data di pratinjau hanya contoh. Saat dikirim, bagian bergembok
              diganti data asli tiap pelanggan.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
