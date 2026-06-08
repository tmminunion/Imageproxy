import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import mysql from 'mysql2/promise';

const UPLOAD_USER_FOLDER_ID = '1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u';

// Setup database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql.nufat.id',
  user: process.env.DB_USER || 'nufat',
  password: process.env.DB_PASSWORD || 'nufat17a',
  database: process.env.DB_NAME || 'image',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createOrGetFolder(req: NextRequest) {
  try {
    let name = '';

    // 1. Coba ambil dari Query Parameter (?name=...)
    name = req.nextUrl.searchParams.get('name') || '';

    // 2. Coba ambil dari Body (JSON atau FormData)
    if (!name && req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await req.json();
          name = body.name;
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await req.formData();
          name = formData.get('name') as string;
        }
      } catch (e) {
        // Abaikan error body parsing
      }
    }

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Parameter nama folder harus diisi, Aa! (contoh: /api/drive/newfolder?name=Baim)' 
      }, { status: 400 });
    }

    // TAHAP 1: Cek di Database MariaDB
    try {
      const [rows] = await pool.query('SELECT folder_id FROM folder_logs WHERE folder_name = ?', [name]);
      if (Array.isArray(rows) && rows.length > 0) {
        // Jika ada di DB, langsung kembalikan ID tanpa hit API Google Drive
        const existingFolderId = (rows as any)[0].folder_id;
        console.log(`Folder '${name}' ditemukan di Database -> ID: ${existingFolderId}`);
        return NextResponse.json({
          success: true,
          message: 'Folder sudah ada di Database.',
          folderId: existingFolderId,
          folderName: name
        });
      }
    } catch (dbErr: any) {
      console.error('[DB Check Error]', dbErr.message);
      // Lanjutkan ke Google Drive jika query database error
    }

    // TAHAP 2: Jika tidak ada di Database, akses Google Drive API
    const drive = await getDriveClient();

    // Cek apakah folder sudah ada di Google Drive (Mungkin dibuat manual tapi blm masuk DB)
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${UPLOAD_USER_FOLDER_ID}' in parents and trashed=false`;
    
    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    let folderId = '';
    let message = '';

    if (res.data.files && res.data.files.length > 0) {
      folderId = res.data.files[0].id as string;
      message = 'Folder ditemukan di Drive, disinkronkan ke Database.';
    } else {
      // Jika belum ada di Drive, buat folder baru
      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [UPLOAD_USER_FOLDER_ID],
      };

      const createRes = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, name',
      });
      folderId = createRes.data.id as string;
      message = 'Berhasil membuat folder baru di Drive dan dicatat di Database!';
    }

    // TAHAP 3: Simpan Folder ID yang baru ditemukan/dibuat ke Database
    try {
      await pool.query(
        'INSERT IGNORE INTO folder_logs (folder_name, folder_id) VALUES (?, ?)',
        [name, folderId]
      );
      console.log(`Log folder disimpan: ${name} -> ID: ${folderId}`);
    } catch (dbInsertErr: any) {
      console.error('[DB Insert Error]', dbInsertErr.message);
    }

    return NextResponse.json({
      success: true,
      message: message,
      folderId: folderId,
      folderName: name
    });

  } catch (error: any) {
    console.error('[Drive New Folder Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal memproses folder: ' + error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return createOrGetFolder(req);
}

export async function POST(req: NextRequest) {
  return createOrGetFolder(req);
}
