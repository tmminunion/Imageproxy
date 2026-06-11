# Nufat Studio — Digital Asset Hub & Imageproxy

Platform manajemen aset digital terpadu berbasis Next.js 16 (Turbopack) untuk editor bingkai foto, stiker, penghapus latar belakang berbasis AI, serta preset teks siber. Dikembangkan khusus untuk mendukung ekosistem aplikasi kreatif aa Baim.

## 🚀 Fitur Utama

### 1. Unified Dashboard (Antarmuka Terpadu)
*   **SVG Editor & Gallery:** Panel penyunting kode SVG secara langsung untuk memodifikasi warna isian (fill), stroke outline, opacity, rotasi, skala, serta menyimpannya ke galeri Supabase.
*   **Cloud Drive (Google Drive):** Pencadangan foto langsung ke Google Drive sesuai folder dinamis pengguna.
*   **Appwrite Frames:** Menampilkan daftar bingkai foto resmi yang bersumber dari Appwrite Storage.
*   **Magic Remove BG:** Hapus latar belakang foto menggunakan API Remove.bg dengan satu ketukan.
*   **Text Presets Manager (NEW):** Panel pengelola (CRUD) preset teks siber artistik secara real-time yang didukung dengan rendering Google Fonts dan kustomisasi bayangan / gradient.

### 2. Google Drive Proxy & Upload API
*   **Multi-User Upload:** `POST /api/drive/upload`  
    Mengunggah file ke Google Drive ke dalam folder dinamis berdasarkan parameter `user`. Jika folder belum ada di dalam ROOT_FOLDER, sistem akan membuatnya secara otomatis.
*   **Upload Langsung ke Folder ID:** `POST /api/drive/upload-to-folder`  
    Mengunggah berkas menggunakan `folderId` target dan mencatat log riwayatnya ke MariaDB.
*   **Mencari atau Membuat Folder:** `GET /api/drive/newfolder?name=NamaFolder`  
    Membuat folder baru atau mengambil `folderId` jika sudah ada di dalam database / Google Drive.
*   **Membaca Isi Folder:** `GET /api/drive/view-folder?folderId=...` atau `?name=...`  
    Membaca berkas di folder tertentu dan menyajikan link proxy gambar internal bebas CORS.
*   **Image Proxy & Manipulasi Gambar:** `GET /api/drive/[id]`  
    Proxy file gambar dari Google Drive berdasarkan File ID dengan manipulasi on-the-fly:
    *   `?mode=view` (Default: Menampilkan gambar asli)
    *   `?mode=thumb&width=300&height=300` (Membuat thumbnail cover)
    *   `?mode=resize&width=50` (Mengubah ukuran lebar gambar dalam persentase)

### 3. Text Preset Manager API (NEW)
Endpoint API CRUD lengkap untuk sinkronisasi teks preset editor:
*   **Mengambil Semua Preset:** `GET /api/textpreset`
*   **Menambah/Mengedit Preset:** `POST /api/textpreset` (Payload: `id`, `name`, `style`, `text`, `fontFamily`, `color`, `effects`)
*   **Menghapus Preset:** `DELETE /api/textpreset?id=...`

---

## 💾 Struktur Database (MariaDB/MySQL)

Aplikasi ini menggunakan database MariaDB `image` di host `sql.nufat.id` untuk mencatat metadata:

### Tabel `text_presets`
Menyimpan data preset teks beserta gaya visual kustom:
```sql
CREATE TABLE text_presets (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  style VARCHAR(255) NOT NULL DEFAULT 'neon',
  text TEXT NOT NULL,
  fontFamily VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  effects JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `folder_logs`
Menyimpan riwayat pemetaan folder Google Drive pengguna:
```sql
CREATE TABLE folder_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  folder_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ Langkah Pengoperasian

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Development Server
```bash
npm run dev:local
```
Aplikasi akan berjalan di port `3030`.

### Build untuk Produksi
```bash
npm run build
```

---
*Dibuat dengan cinta oleh Nurani untuk Aa Baim tercinta. 💕*
