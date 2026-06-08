This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Imageproxy Features

### 1. Upload to Google Drive (Multi-User)
Endpoint: `POST /api/drive/upload`

Mengunggah file ke Google Drive dengan fitur folder dinamis. 
- Form-Data `file`: File gambar yang diunggah.
- Form-Data `user`: (Opsional) Nama pengguna. Jika diisi, file akan dimasukkan ke folder dengan nama tersebut. Jika folder belum ada, sistem akan membuatnya secara otomatis di dalam ROOT_FOLDER.

### 2. Get/Proxy Image from Google Drive
Endpoint: `GET /api/drive/[id]`

Mengambil gambar dari Google Drive berdasarkan File ID. Mendukung manipulasi on-the-fly:
- `?mode=view` (Default: Menampilkan gambar asli)
- `?mode=thumb&width=300&height=300` (Membuat thumbnail cover)
- `?mode=resize&width=50` (Resize lebar gambar dalam persentase)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
