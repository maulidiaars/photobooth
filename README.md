# 🍡 Klikka Photobooth

Online Photobooth modern bertema **Claymorphism** (soft 3D, pastel, rounded, playful) —
dibangun dengan **Next.js 15 (App Router)**, **TypeScript (strict)**, **Tailwind CSS**,
**Framer Motion**, **react-webcam**, dan **MySQL**.

---

## ✨ Fitur

**User**
- Landing page fullscreen dengan ilustrasi clay animasi & floating background
- Pilih frame lewat carousel horizontal
- Kamera 2 kolom (kiri: preview kamera fullscreen, kanan: info frame + progress kotak foto + kontrol): countdown 3-2-1, flash effect, shutter sound, retake per-foto atau retake semua
- Generate hasil: gabung semua foto ke frame PNG via `<canvas>` (memakai posisi lubang asli hasil deteksi, bukan grid tebakan), preview, download PNG, simpan ke database
- Halaman selesai dengan instruksi menemui admin untuk cetak

**Admin**
- Login (JWT + httpOnly cookie)
- Dashboard: total frame, total foto, pending print, printed
- Kelola Frame: **cukup upload 1 file PNG transparan** — jumlah & posisi kotak foto terdeteksi otomatis dari lubang transparan di gambar itu sendiri (tidak perlu isi jumlah slot atau upload thumbnail terpisah), edit, hapus
- Kelola Foto: preview, download, print, ubah status jadi *Printed*, hapus

---

## 🗂️ Struktur Proyek

```
src/
  app/                  # Routes (App Router) — pages & API routes
    page.tsx            # Landing
    frame/               # Pilih frame
    camera/              # Kamera + capture
    result/              # Generate hasil
    finish/              # Selesai
    admin/               # Login, dashboard, kelola frame, kelola foto
    api/                 # Route handlers (frames, photos, admin/login, admin/stats)
  components/            # UI per fitur (ui, landing, frame, camera, result, admin)
  hooks/                 # useCamera, useCountdown, usePhotoSession
  lib/                   # db, auth, canvas (merge foto), constants, fileStorage, requireAdmin
  services/               # Client-side fetch wrappers (frameService, photoService)
  store/                 # Zustand session store (frame terpilih, foto, hasil)
  types/                  # Frame, Photo, Admin types
  middleware.ts           # Guard route /admin/*
database/
  schema.sql              # Struktur tabel frames, photos, admins
scripts/
  init-db.js               # Buat database + seed admin
```

---

## 🚀 Instalasi

### 1. Prasyarat
- Node.js ≥ 18.18
- MySQL Server berjalan lokal (atau remote)

### 2. Install dependency
```bash
npm install
```

### 3. Konfigurasi environment
```bash
cp .env.example .env
```
Sesuaikan kredensial MySQL, `JWT_SECRET`, serta `ADMIN_USERNAME` / `ADMIN_PASSWORD` default.

### 4. Inisialisasi database
Script ini akan membuat database `clay_photobooth`, seluruh tabel (`frames`, `photos`, `admins`),
dan membuat 1 akun admin default sesuai `.env`.
```bash
npm run db:init
```
> Sudah pernah `db:init` sebelum fitur deteksi otomatis ada? Jalankan
> `database/migration_slot_layout.sql` untuk menambah kolom `slot_layout` ke tabel `frames`
> yang sudah ada (lalu hapus & upload ulang frame lama agar terdeteksi otomatis).

### 5. Jalankan development server
```bash
npm run dev
```
Buka `http://localhost:3000`.

### 6. Login admin
Buka `http://localhost:3000/admin/login` lalu masuk dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD`
yang telah di-seed. Setelah login, tambahkan minimal 1 frame di **Kelola Frame** agar
halaman **Pilih Frame** di sisi user tidak kosong.

### 7. Tambahkan sound effect shutter
Simpan file `shutter.mp3` (klik kamera) di `public/sounds/shutter.mp3`.

---

## 🖼️ Cara Kerja Deteksi Frame Otomatis

Admin hanya mengunggah **1 file PNG transparan**. Saat file dipilih di form **Kelola Frame**,
browser langsung menganalisis kanal alpha gambar tersebut (`src/lib/frameSlotDetector.ts`)
memakai algoritma *connected-component labeling* (flood fill) untuk menemukan setiap area
transparan ("lubang") sebagai satu kotak foto — lengkap dengan posisi & ukuran presisinya
(disimpan sebagai fraksi 0–1 dari lebar/tinggi gambar, bukan piksel absolut, supaya tetap
akurat di ukuran berapa pun). Hasil deteksi ditampilkan langsung sebagai overlay kotak
bernomor di atas preview frame agar admin bisa memverifikasi sebelum menyimpan.

Data ini (`slot_layout`) tersimpan di database sebagai JSON dan dipakai ulang saat proses
generate hasil foto (`src/lib/canvas.ts`): setiap foto hasil jepretan digambar tepat di
posisi lubang aslinya (dengan *clip* ketat) sehingga foto **tidak pernah keluar dari
kotaknya masing-masing**, lalu artwork frame PNG ditimpa di atasnya.

Ketentuan agar deteksi akurat:
- Area transparan (alpha rendah) di PNG = satu kotak foto
- Area transparan yang sangat kecil (< ~1.2% luas gambar) diabaikan otomatis sebagai noise
- Jumlah kotak foto = jumlah area transparan yang terdeteksi (tidak dibatasi 2/4/6/8, bebas berapa pun)

---

## 🏗️ Build Production

```bash
npm run build
npm run start
```

---

## 🔒 Keamanan (catatan pengembangan lanjutan)

- Middleware hanya memeriksa keberadaan cookie admin (karena `jsonwebtoken` butuh Node's
  `crypto` yang tidak selalu tersedia penuh di Edge Runtime bawaan Middleware). Verifikasi
  JWT penuh dilakukan di setiap API route admin lewat `requireAdmin()` (Node runtime), jadi
  data tetap terlindungi meski shell halaman sempat ter-render.
- Untuk produksi, pertimbangkan: rate limiting login, HTTPS wajib (cookie `secure`), rotasi
  `JWT_SECRET`, serta validasi ukuran/tipe file upload yang lebih ketat.

---

## 🎨 Design Tokens

- **Warna**: cream, pink pastel, purple pastel, mint, soft yellow (lihat `tailwind.config.ts`)
- **Font**: Fredoka (heading), Poppins (body)
- **Shadow**: custom `shadow-clay`, `shadow-clay-inset`, `shadow-clay-lg` untuk efek soft 3D
- **Radius**: 24–48px (`rounded-clay-sm` / `rounded-clay` / `rounded-clay-lg`)
- **Animasi**: floaty (blob mengambang), popIn, flash — via Tailwind keyframes + Framer Motion
