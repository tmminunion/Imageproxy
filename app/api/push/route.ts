import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// 1. Inisialisasi Firebase Admin (Singleton)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Menangani karakter newline pada private key dari environment variable
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase initialization error', error.stack);
  }
}

export async function POST(request: Request) {
  try {
    // --- STEP 1: PARSING BODY ---
    const body = await request.json();
    const { topic, title, message, data } = body;

    // Validasi input minimal
    if (!topic || !title || !message) {
      return NextResponse.json({ error: 'Field topic, title, and message are required' }, { status: 400 });
    }

    // --- STEP 2: PENGIRIMAN KE FCM TOPIC ---
    const payload = {
      topic: topic,
      notification: {
        title: title,
        body: message,
      },
      // Data payload tambahan untuk ditangkap di background (Ionic)
      data: data || {}, 
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          clickAction: 'FCM_PLUGIN_ACTIVITY', // Penting untuk beberapa plugin Capacitor
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(payload);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent to topic: ${topic}`,
      messageId: response 
    });

  } catch (error: any) {
    console.error('FCM Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
