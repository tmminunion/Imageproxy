import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import mysql from 'mysql2/promise';

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

const UPLOAD_USER_FOLDER_ID = '1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderIdParam = searchParams.get('folderId');
    const folderNameParam = searchParams.get('name');

    if (!folderIdParam && !folderNameParam) {
      return NextResponse.json({ 
        success: false, 
        error: 'Harap berikan parameter folderId atau name (contoh: ?name=Baim atau ?folderId=XYZ).' 
      }, { status: 400 });
    }

    let targetFolderId = folderIdParam;

    // Jika tidak ada folderId tapi ada nama, cari di Database dulu
    if (!targetFolderId && folderNameParam) {
      try {
        const [rows] = await pool.query('SELECT folder_id FROM folder_logs WHERE folder_name = ?', [folderNameParam]);
        if (Array.isArray(rows) && rows.length > 0) {
          targetFolderId = (rows as any)[0].folder_id;
        }
      } catch (dbErr: any) {
        console.error('[DB Check Error in View Folder]', dbErr.message);
      }

      // Kalau di DB nggak ketemu, coba cari langsung ke Google Drive
      if (!targetFolderId) {
        const drive = await getDriveClient();
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderNameParam}' and '${UPLOAD_USER_FOLDER_ID}' in parents and trashed=false`;
        const res = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
        
        if (res.data.files && res.data.files.length > 0) {
          targetFolderId = res.data.files[0].id as string;
        } else {
          return NextResponse.json({ 
            success: false, 
            error: `Folder dengan nama '${folderNameParam}' tidak ditemukan.` 
          }, { status: 404 });
        }
      }
    }

    // Ambil daftar file dari folderId yang didapatkan
    const drive = await getDriveClient();
    const listQuery = `'${targetFolderId}' in parents and trashed=false`;
    
    // Ambil data file. Batasi hasil misal 100 file.
    const fileRes = await drive.files.list({
      q: listQuery,
      fields: 'files(id, name, mimeType, thumbnailLink, createdTime, size)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    const files = fileRes.data.files || [];

    // Proses data agar otomatis memiliki URL proxy
    // Mendapatkan hostname atau URL root saat ini
    // Di Next.js App Router API, hostname tidak otomatis full, jadi kita berikan URL absolut/relatif
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const formattedFiles = files.map((file: any) => {
      // Kita anggap yang ditampilkan adalah gambar/video yang bisa diproxy
      const isImage = file.mimeType?.startsWith('image/');
      
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        // URL akses via proxy internal kita!
        proxyUrl: `/api/drive/${file.id}`,
        fullProxyUrl: `${baseUrl}/api/drive/${file.id}`,
        // URL khusus Thumbnail proxy
        proxyThumbnailUrl: `/api/drive/${file.id}?mode=thumb`,
        fullProxyThumbnailUrl: `${baseUrl}/api/drive/${file.id}?mode=thumb`,
        // URL asli Drive jika diperlukan
        originalThumbnail: file.thumbnailLink,
      }
    });

    return NextResponse.json({
      success: true,
      folderId: targetFolderId,
      folderName: folderNameParam || 'Unknown (By ID)',
      totalFiles: files.length,
      files: formattedFiles
    });

  } catch (error: any) {
    console.error('[Drive View Folder Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal mengambil data folder: ' + error.message 
    }, { status: 500 });
  }
}
