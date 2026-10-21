export interface WhatsappTemplateData {
  template: string;
  isDefault: boolean;
}

const URL = "/api/settings/whatsapp-template";

export async function getWhatsappTemplate(): Promise<WhatsappTemplateData> {
  const res = await fetch(URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat template WhatsApp");
  const json = await res.json();
  return json.data as WhatsappTemplateData;
}

export async function saveWhatsappTemplate(template: string): Promise<WhatsappTemplateData> {
  const res = await fetch(URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? "Gagal menyimpan template WhatsApp");
  return json.data as WhatsappTemplateData;
}
