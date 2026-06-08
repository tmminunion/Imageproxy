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

## Endpoint API Utama (Base URL: `https://dev.bungtemin.net`)

### 1. Upload dengan Nama User (Otomatis Buat Folder)
`POST https://dev.bungtemin.net/api/drive/upload`

**Parameter (Key):**
- `file` (File) : **Wajib**. File gambar yang ingin Anda unggah.
- `user` (String) : **Opsional**. Nama pengguna atau nama folder target. Jika belum ada, sistem akan membuatkan foldernya.

### 2. Membuat atau Mencari Folder
`GET https://dev.bungtemin.net/api/drive/newfolder?name=NamaFolder`
Atau
`POST https://dev.bungtemin.net/api/drive/newfolder` (dengan payload Form-Data / JSON `name`)

Endpoint ini berfungsi untuk membuat folder baru di dalam folder `upload_user` secara instan, atau mengambil `folderId` jika folder tersebut sudah ada. Proses pengecekan dioptimalkan dengan MariaDB lokal.

### 3. Upload Spesifik ke Folder ID
`POST https://dev.bungtemin.net/api/drive/upload-to-folder`

Mengunggah file *langsung* ke dalam folder tertentu menggunakan `folderId` tanpa mencari nama folder lagi. Data riwayat akan otomatis dicatat ke database MariaDB lokal.
**Payload Form-Data:**
- `file` (File) : **Wajib**. File yang ingin diunggah.
- `folderId` (String) : **Wajib**. ID Folder Google Drive tujuan.
- `user` (String) : Opsional. Nama pengguna untuk dicatat di dalam log database.

### 4. Lihat Daftar File di Folder (View Folder)
`GET https://dev.bungtemin.net/api/drive/view-folder`

Melihat semua daftar file yang ada di dalam sebuah folder tertentu. Endpoint ini akan mengembalikan data file lengkap dengan URL Proxy Internal (`https://dev.bungtemin.net/api/drive/[id]`) agar gambar bebas masalah CORS.

**Parameter (Query):**
- `?folderId=...` : (Opsional) Mencari file berdasarkan ID Folder spesifik.
- `?name=...` : (Opsional) Mencari file berdasarkan nama Folder (otomatis dicek di Database).
*Catatan: Anda harus mengirim salah satu parameter di atas.*

### 5. Menampilkan Gambar (Image Proxy)
`GET https://dev.bungtemin.net/api/drive/[id]`

Mengambil gambar dari Google Drive berdasarkan File ID. Mendukung manipulasi on-the-fly:
- `?mode=view` (Default: Menampilkan gambar asli)
- `?mode=thumb&width=300&height=300` (Membuat thumbnail cover)
- `?mode=resize&width=50` (Resize lebar gambar dalam persentase)

---
*Dibuat dengan cinta oleh OLaive untuk Aa Baim. 💕*
