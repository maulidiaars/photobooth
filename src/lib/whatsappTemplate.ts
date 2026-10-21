/**
 * Template pesan WhatsApp yang dikirim admin ke pelanggan.
 * File ini dipakai di server DAN browser, jadi jangan import
 * apa pun yang butuh Node (db, fs, dll) di sini.
 */

export const WHATSAPP_TEMPLATE_KEY = "whatsapp_template";
export const WHATSAPP_TEMPLATE_MAX_LENGTH = 3000;

// Data kontak/sosmed yang diisikan ke variabel {nomor_admin}, {instagram}, {tiktok}.
export const WA_ADMIN_PHONE = "083833726472";
export const WA_TIKTOK_URL = "https://www.tiktok.com/@clikja.photobooth";
export const WA_INSTAGRAM_URL = "https://www.instagram.com/clikjaphotobooth";

export function formatPhoneDisplay(raw: string) {
  const d = raw.replace(/[^\d]/g, "");
  return d.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

// ------------------------------------------------------------------
// Variabel yang bisa dipakai di template, ditulis dengan kurung kurawal
// ------------------------------------------------------------------
export const WHATSAPP_TEMPLATE_VARIABLES = [
  { key: "nama_brand", label: "Nama brand", desc: "Nama brand photobooth", sample: "Clikja Photobooth" },
  { key: "frame", label: "Nama frame", desc: "Nama frame yang dipakai pelanggan", sample: "Pink Ribbon" },
  { key: "tanggal", label: "Tanggal foto", desc: "Tanggal & jam foto diambil", sample: "20 Okt 2026, 14.30" },
  {
    key: "link_foto",
    label: "Link foto",
    desc: "Link halaman foto untuk download (WAJIB ada)",
    sample: "https://contoh.vercel.app/foto/abc123",
  },
  { key: "nomor_admin", label: "Nomor admin", desc: "Nomor WhatsApp admin", sample: formatPhoneDisplay(WA_ADMIN_PHONE) },
  { key: "instagram", label: "Link Instagram", desc: "Link Instagram", sample: WA_INSTAGRAM_URL },
  { key: "tiktok", label: "Link TikTok", desc: "Link TikTok", sample: WA_TIKTOK_URL },
] as const;

export type WhatsappVariableKey = (typeof WHATSAPP_TEMPLATE_VARIABLES)[number]["key"];
export type WhatsappTemplateVars = Record<WhatsappVariableKey, string>;

/** Variabel yang kalau hilang bikin pesan jadi nggak berguna. */
export const WHATSAPP_REQUIRED_VARIABLE: WhatsappVariableKey = "link_foto";

// ------------------------------------------------------------------
// Emoji di isi bawaan dibuat dari Unicode code point (bukan diketik
// langsung) supaya nggak rusak waktu file ini di-copy-paste.
// Admin TIDAK punya pilihan emoji di editor.
// ------------------------------------------------------------------
const cp = (...codes: number[]) => String.fromCodePoint(...codes);

const E = {
  film: cp(0x1f39e, 0xfe0f),
  frame: cp(0x1f5bc, 0xfe0f),
  calendar: cp(0x1f5d3, 0xfe0f),
  one: `1${cp(0xfe0f, 0x20e3)}`,
  two: `2${cp(0xfe0f, 0x20e3)}`,
  camera: cp(0x1f4f8),
  music: cp(0x1f3b5),
  wave: cp(0x1f44b),
};

/** Isi bawaan — sama persis dengan pesan lama sebelum bisa diatur. */
export const DEFAULT_WHATSAPP_TEMPLATE = [
  "*{nama_brand}*",
  "",
  `Haii, terima kasih banyak ya udah mampir dan berfoto bareng kami hari ini! ${E.film}`,
  "",
  `${E.frame} Frame: *{frame}*`,
  `${E.calendar} Tanggal: {tanggal}`,
  "",
  "Yeay, hasil foto kamu udah jadi! Klik link di bawah ini buat lihat & download-nya ya:",
  "{link_foto}",
  "",
  "Di halaman itu ada 2 bagian:",
  `${E.one} Hasil foto lengkap dengan frame — tinggal tekan tombol download-nya`,
  `${E.two} Foto asli satuan (tanpa frame) — geser satu-satu, tiap foto ada tombol download sendiri`,
  "",
  "Ada kendala atau mau cetak ulang? Hubungi admin kami di *{nomor_admin}*",
  "",
  "Yuk follow kami juga biar gak ketinggalan update seru lainnya:",
  `${E.camera} Instagram: {instagram}`,
  `${E.music} TikTok: {tiktok}`,
  "",
  `Semoga harimu menyenangkan, sampai jumpa lagi! ${E.wave}`,
  "",
  "_Salam hangat, tim {nama_brand}_",
].join("\n");

/**
 * Ganti {variabel} di template dengan nilai aslinya.
 * Variabel yang salah ketik / nggak dikenal dibiarkan apa adanya.
 */
export function renderWhatsappTemplate(
  template: string,
  vars: WhatsappTemplateVars
): string {
  return template
    .replace(/\r\n/g, "\n")
    .replace(/\{(\w+)\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(vars, key)
        ? vars[key as WhatsappVariableKey]
        : match
    );
}

// ------------------------------------------------------------------
// Helper editor: template <-> baris-baris yang bisa diedit
// ------------------------------------------------------------------
export type TemplatePart =
  | { type: "text"; value: string }
  | { type: "var"; key: WhatsappVariableKey };

const VARIABLE_KEYS: string[] = WHATSAPP_TEMPLATE_VARIABLES.map((v) => v.key);

/**
 * Pecah template jadi baris, lalu tiap baris jadi potongan teks &
 * variabel. Selalu selang-seling: teks, variabel, teks, variabel, teks
 * (teks boleh kosong). Variabel yang salah ketik dianggap teks biasa.
 */
export function parseTemplateToLines(template: string): TemplatePart[][] {
  return template
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const parts: TemplatePart[] = [];
      let buffer = "";

      for (const chunk of line.split(/(\{\w+\})/g)) {
        const match = /^\{(\w+)\}$/.exec(chunk);

        if (match && VARIABLE_KEYS.includes(match[1])) {
          parts.push({ type: "text", value: buffer });
          buffer = "";
          parts.push({ type: "var", key: match[1] as WhatsappVariableKey });
        } else {
          buffer += chunk;
        }
      }

      parts.push({ type: "text", value: buffer });
      return parts;
    });
}

export function serializeTemplateLines(lines: TemplatePart[][]): string {
  return lines
    .map((parts) =>
      parts
        .map((part) => (part.type === "text" ? part.value : `{${part.key}}`))
        .join("")
    )
    .join("\n");
}

/** Pastikan {link_foto} selalu ada, biar pelanggan pasti dapat link. */
export function ensureRequiredVariables(template: string): string {
  return template.includes(`{${WHATSAPP_REQUIRED_VARIABLE}}`)
    ? template
    : `${template.trimEnd()}\n\n{${WHATSAPP_REQUIRED_VARIABLE}}`;
}

/** Isi semua variabel dengan data sesi foto yang sebenarnya. */
export function buildWhatsappVars(input: {
  brand: string;
  frame: string;
  tanggal: string;
  link: string;
}): WhatsappTemplateVars {
  return {
    nama_brand: input.brand,
    frame: input.frame,
    tanggal: input.tanggal,
    link_foto: input.link,
    nomor_admin: formatPhoneDisplay(WA_ADMIN_PHONE),
    instagram: WA_INSTAGRAM_URL,
    tiktok: WA_TIKTOK_URL,
  };
}
