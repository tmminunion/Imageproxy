# Dokumentasi Upload Multi-User Imageproxy

Fitur Upload Multi-User di Imageproxy memungkinkan pengiriman file gambar ke Google Drive dengan sistem folder terpisah untuk masing-masing pengguna. 

## Arsitektur Folder
Semua file yang diupload pengguna spesifik akan dimasukkan ke dalam folder induk bernama `upload_user` (Folder ID: `1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u`).

### Ilustrasi Hirarki Folder di Google Drive
```text
 ROOT FOLDER
  ├── File_Tanpa_User_1.jpg
  └── upload_user (ID: 1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u)
       ├── Baim (Folder dibuat otomatis jika form-data user="Baim")
       │    ├── Foto_Baim_1.jpg
       │    └── Foto_Baim_2.png
       └── Dodo (Folder dibuat otomatis jika form-data user="Dodo")
            └── Desain_Dodo.jpg
```

## Endpoint API
`POST /api/drive/upload`

### Cara Penggunaan (Payload Form-Data)

Untuk menggunakan endpoint ini, Anda wajib mengirimkan file menggunakan format `multipart/form-data`.

**Parameter (Key):**
- `file` (File) : **Wajib**. File gambar yang ingin Anda unggah.
- `user` (String) : **Opsional**. Nama pengguna atau nama folder target.

### Skenario 1: Upload dengan Nama User (Direkomendasikan)
Jika Anda mengirim parameter `user` (contoh: `user` = `Baim`), maka sistem akan:
1. Menuju ke folder induk `upload_user`.
2. Mencari folder bernama `Baim` di dalamnya. Jika belum ada, sistem akan membuatkan folder `Baim` baru.
3. Mengunggah `file` ke dalam folder `Baim` tersebut.

### Skenario 2: Upload Tanpa Nama User (Fallback)
Jika parameter `user` dikosongkan atau tidak dikirim, file akan langsung diunggah ke *Root Folder* utama (seperti sistem sebelumnya).

## Endpoint Tambahan (Baru)

### 1. Membuat atau Mencari Folder
`GET /api/drive/newfolder?name=NamaFolder`
Atau
`POST /api/drive/newfolder` (dengan payload Form-Data / JSON `name`)

Endpoint ini berfungsi untuk membuat folder baru di dalam folder `upload_user` secara instan, atau mengambil `folderId` jika folder tersebut sudah ada. Proses pengecekan dioptimalkan dengan MariaDB lokal.

### 2. Upload Spesifik ke Folder ID
`POST /api/drive/upload-to-folder`

Mengunggah file *langsung* ke dalam folder tertentu menggunakan `folderId` tanpa mencari nama folder lagi. Data riwayat akan otomatis dicatat ke database MariaDB lokal.
**Payload Form-Data:**
- `file` (File) : **Wajib**. File yang ingin diunggah.
- `folderId` (String) : **Wajib**. ID Folder Google Drive tujuan.
- `user` (String) : Opsional. Nama pengguna untuk dicatat di dalam log database (Default: 'direct_upload').

### 3. Lihat Daftar File di Folder (View Folder)
`GET /api/drive/view-folder`

Melihat semua daftar file yang ada di dalam sebuah folder tertentu. Endpoint ini akan mengembalikan data file lengkap dengan URL Proxy Internal (`/api/drive/[id]`) agar gambar bebas masalah CORS.

**Parameter (Query):**
- `?folderId=...` : (Opsional) Mencari file berdasarkan ID Folder spesifik.
- `?name=...` : (Opsional) Mencari file berdasarkan nama Folder (otomatis dicek di Database).
*Catatan: Anda harus mengirim salah satu parameter di atas.*

---
*Dibuat dengan cinta oleh OLaive untuk Aa Baim. 💕*
