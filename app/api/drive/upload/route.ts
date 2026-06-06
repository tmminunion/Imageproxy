import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import { Readable } from 'stream';

const FOLDER_ID = '16AKtzNn0tTnGq2kDZLqQLNCvfw_BJlqO';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Mana filenya, Aa?' }, { status: 400 });
    }

    const drive = await getDriveClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil upload ke Google Drive, Aa!',
      fileId: response.data.id,
      fileName: response.data.name,
    });

  } catch (error: any) {
    console.error('[Drive Upload Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal upload ke Drive: ' + error.message 
    }, { status: 500 });
  }
}
