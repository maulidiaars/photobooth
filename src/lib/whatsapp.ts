/**
 * Builds a wa.me deep link so the admin can send the guest their raw
 * photo file with one click. Browsers/devices can't send a WhatsApp
 * message with an attachment fully automatically without the WhatsApp
 * Business API, so this opens a prefilled chat — admin just attaches
 * the file (already open from "Print"/download) and hits send.
 */
export function buildWhatsappLink(rawNumber: string, message?: string) {
  const digits = rawNumber.replace(/[^\d]/g, "");
  // Indonesian numbers starting with 0 -> country code 62
  const withCountryCode = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const text = encodeURIComponent(
    message ??
      "Halo! Ini file mentahan hasil photobooth kamu ya, terima kasih sudah mampir."
  );
  return `https://wa.me/${withCountryCode}?text=${text}`;
}

/**
 * Tries to hand the actual photo file to WhatsApp via the native Web
 * Share sheet (works on most mobile browsers, and on desktop Chrome/
 * Edge when a share target is registered) so the admin doesn't have
 * to manually attach the file after opening the chat. Falls back to
 * the plain wa.me text link — the only thing possible without the
 * paid WhatsApp Business API — when file sharing isn't supported.
 * Returns which path was taken so the caller can inform the admin.
 */
export async function shareResultToWhatsapp(
  imageUrl: string,
  rawNumber: string,
  fileName = "photobooth.jpg"
): Promise<"shared" | "link"> {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      const canShareFiles =
        "canShare" in navigator && (navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }).canShare?.({ files: [file] });
      if (canShareFiles) {
        await navigator.share({
          files: [file],
          text: "Ini file mentahan hasil photobooth kamu ya, terima kasih sudah mampir!",
        });
        return "shared";
      }
    }
  } catch {
    // user cancelled the share sheet, or it failed — fall through to the link
  }
  window.open(buildWhatsappLink(rawNumber), "_blank", "noopener,noreferrer");
  return "link";
}
