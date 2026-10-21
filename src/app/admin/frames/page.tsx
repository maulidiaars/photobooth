
const handleToggleArchive = async (frame: Frame) => {
  const nextArchived = !frame.archived;

  try {
    const updated = await setFrameArchived(frame.id, nextArchived);

    // Perbarui state lokal tanpa reload halaman.
    setFrames((current) =>
      current.map((item) =>
        item.id === frame.id ? updated : item
      )
    );

    // Langsung pindah ke tab tujuan.
    setView(nextArchived ? "archived" : "active");

    toast.push(
      nextArchived
        ? `Frame "${frame.nama}" berhasil diarsipkan`
        : `Frame "${frame.nama}" berhasil diaktifkan kembali`,
      "success"
    );
  } catch {
    toast.push(
      "Gagal mengubah status arsip frame",
      "error"
    );
  }
};
