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
