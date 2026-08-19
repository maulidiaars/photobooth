/**
 * Buka window baru berisi foto dan langsung trigger dialog print browser.
 * Dipakai bareng oleh dashboard (PhotoLightbox) dan notifikasi lonceng
 * (NotificationBell) supaya perilakunya konsisten di dua tempat itu.
 *
 * `onDone` dipanggil sekali saja setelah proses print itu "selesai" —
 * yaitu begitu event `afterprint` kebaca (admin klik Print/Cancel di
 * dialog cetak), atau begitu window preview-nya ditutup manual. Dari titik
 * itu pemanggil (mis. notifikasi) baru boleh menandai foto sebagai sudah
 * dicetak & menghilangkan notifnya — bukan langsung pas tombol diklik.
 */
export function openPrintWindow(
  imageUrl: string,
  opts: { onDone?: () => void; onBlocked?: () => void } = {}
): Window | null {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    opts.onBlocked?.();
    return null;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Foto</title>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; background: #fff; }
          body { display: flex; align-items: center; justify-content: center; }
          img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          @media print { @page { margin: 0; } }
        </style>
      </head>
      <body>
        <img src="${imageUrl}" alt="Hasil foto" />
      </body>
    </html>
  `);
  win.document.close();

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearInterval(closedPoll);
    opts.onDone?.();
  };

  const triggerPrint = () => {
    win.focus();
    win.print();
  };

  const img = win.document.querySelector("img");
  if (img) {
    if (img.complete) {
      triggerPrint();
    } else {
      img.addEventListener("load", triggerPrint);
    }
  }

  // Browser modern nembak `afterprint` begitu dialog print ditutup
  // (baik admin beneran klik "Print" atau "Cancel").
  win.addEventListener("afterprint", finish);

  // Fallback: kalau admin nutup window preview-nya langsung tanpa lewat
  // dialog print (atau browser-nya gak fire afterprint di popup, kayak
  // sebagian versi Safari), tetap anggap "selesai" begitu window-nya
  // ketutup supaya notifikasi gak nyangkut selamanya.
  const closedPoll = window.setInterval(() => {
    if (win.closed) {
      finish();
    }
  }, 500);

  return win;
}
