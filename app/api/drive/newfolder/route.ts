import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';

const UPLOAD_USER_FOLDER_ID = '1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u';

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

    const drive = await getDriveClient();

    // Cek apakah folder sudah ada di dalam UPLOAD_USER_FOLDER_ID
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${UPLOAD_USER_FOLDER_ID}' in parents and trashed=false`;
    
    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    // Kalau folder sudah ada, return ID-nya
    if (res.data.files && res.data.files.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Folder sudah ada sebelumnya.',
        folderId: res.data.files[0].id,
        folderName: res.data.files[0].name
      });
    }

    // Jika belum ada, buat folder baru
    const folderMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [UPLOAD_USER_FOLDER_ID],
    };

    const createRes = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat folder baru!',
      folderId: createRes.data.id,
      folderName: createRes.data.name
    });

  } catch (error: any) {
    console.error('[Drive New Folder Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal membuat folder di Drive: ' + error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return createOrGetFolder(req);
}

export async function POST(req: NextRequest) {
  return createOrGetFolder(req);
}
