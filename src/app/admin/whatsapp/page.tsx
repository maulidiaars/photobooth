                )}
              >
                {value.length.toLocaleString("id-ID")} /{" "}
                {WHATSAPP_TEMPLATE_MAX_LENGTH.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Keterangan warna */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#E9DDE1] bg-[#FCF5F7] px-5 py-3 text-[11px] text-[#8B747C] sm:px-6">
              <span className="flex items-center gap-2">
                <span className="h-4 w-9 rounded border border-[#E9DDE1] bg-[#FFF9FB]" />
                Kalimat, bisa kamu ubah
              </span>

              <span className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center gap-1 rounded-md border border-dashed border-[#D9A9B8] bg-[#F9EAF0] px-1.5 font-semibold text-[#7B3F50]">
                  <Lock size={9} strokeWidth={2.6} />
                  Otomatis
                </span>
                Diisi sistem, terkunci
              </span>

              <span className="flex items-center gap-2">
                <span className="w-9 border-t border-dashed border-[#D8C5CC]" />
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

            <div className="border-t border-[#E9DDE1] bg-[#FFFBFC] px-5 py-4 sm:px-6">
              <p className="mb-3 text-[11px] leading-5 text-[#8B747C]">
                Pakai <code className="rounded bg-[#FFF9FB] px-1 py-0.5 text-[#7B3F50]">*teks*</code>{" "}
                untuk tebal dan{" "}
                <code className="rounded bg-[#FFF9FB] px-1 py-0.5 text-[#7B3F50]">_teks_</code>{" "}
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8D435B] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#74354A] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E3D1D8] bg-transparent px-5 py-2.5 text-sm font-medium text-[#7B3F50] transition hover:bg-[#FFF9FB] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={15} />
                  Kembalikan bawaan
                </button>
              </div>
            </div>
          </section>

          {/* PREVIEW: bubble WhatsApp dengan latar lembut */}
          <aside className="min-w-0 xl:sticky xl:top-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-bold text-[#512C3A]">
                Pratinjau
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                LANGSUNG
              </span>
            </div>

            {empty ? (
              <p className="text-sm italic text-[#A18C94]">
                Isi pesan akan muncul di sini.
              </p>
            ) : (
              <WhatsAppBubble text={previewText} time={previewTime} />
            )}

            <p className="mt-4 text-[11px] leading-5 text-[#8B747C]">
              Data di pratinjau hanya contoh. Saat dikirim, bagian bergembok
              diganti data asli tiap pelanggan.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
