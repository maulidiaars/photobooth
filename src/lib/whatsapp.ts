/**
 * WhatsApp can't attach a file automatically through a wa.me link — that
 * needs the paid WhatsApp Business API. So instead of opening a chat and
 * hoping the admin remembers to attach the file, the message includes a
 * link to a public page (/foto/[id]) where the guest can view and
 * download their own result photo straight from their phone.
 *
 * Note: if the guest's number isn't already saved in the admin's WhatsApp
 * contacts, WhatsApp itself (not this app) shows a one-time "chat with
 * this number?" confirmation before opening the conversation — that's
 * normal WhatsApp behaviour for unsaved numbers, not a bug, and there's
 * no way to skip it without the paid Business API.
 */

/** Turns a local Indonesian number (08xx / 62xx / +62xx) into the
 *  62-prefixed digits-only format wa.me expects. */
function toWhatsappDigits(rawNumber: string) {
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

/** Builds a wa.me deep link, prefilled with the given message. */
export function buildWhatsappLink(rawNumber: string, message: string) {
  return `https://wa.me/${toWhatsappDigits(rawNumber)}?text=${encodeURIComponent(message)}`;
}

/** Absolute URL of the public "hasil foto" page for a given photo id. */
export function buildResultPageUrl(photoId: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const origin = configured || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/foto/${photoId}`;
}

/** Ready-to-send WhatsApp message: thanks + frame + link to download. */
export function buildResultMessage(params: {
  frameName?: string | null;
  createdAt: string;
  photoUrl: string;
}) {
  const { frameName, createdAt, photoUrl } = params;
  const tanggal = new Date(createdAt).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return [
    "✨ *Terima kasih sudah menggunakan Photobooth kami!* ✨",
    "",
    `📸 *Frame:* ${frameName ?? "Frame"}`,
    `📅 *Tanggal:* ${tanggal}`,
    "",
    "Hasil fotomu sudah siap. Klik link di bawah ini untuk melihat dan mendownload fotonya langsung ke HP kamu:",
    photoUrl,
    "",
    "*Salam hangat dari tim Photobooth!* 🎉",
  ].join("\n");
}
