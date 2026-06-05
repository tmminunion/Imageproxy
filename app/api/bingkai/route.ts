import { NextResponse } from 'next/server';
import axios from 'axios';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69c968e300202231f91d';
const APPWRITE_BUCKET_ID = '6a21f5aa00234850f8e6';

export async function GET() {
  try {
    const url = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files`;
    
    const response = await axios.get(url, {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID
      }
    });

    const files = response.data.files || [];
    
    const mapped = files
      .filter((file: any) => file.mimeType && file.mimeType.includes('image'))
      .map((file: any) => ({
        id: `aw_${file.$id}`,
        name: (file.name || '').split('.')[0] || 'Appwrite Frame',
        src: `/api/bingkai/${file.$id}`, // Updated to current project path
        category: 'Appwrite',
        type: 'url'
      }));

    return NextResponse.json(mapped, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    });
  } catch (err: any) {
    console.error('[Proxy Appwrite List Error]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
