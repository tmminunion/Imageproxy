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

---
*Dibuat dengan cinta oleh OLaive untuk Aa Baim. 💕*
