import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { type, prompt } = await req.json();

    if (!type || !prompt) {
      return NextResponse.json({ error: 'Parameter "type" (svg atau preset) dan "prompt" wajib ada, Aa.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak ditemukan di file .env ya, Aa.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (type === 'svg') {
      const systemInstruction = `You are a professional web designer and expert SVG developer. 
Generate a beautiful, premium, and clean SVG code based on the user's request.
Requirements:
1. Output ONLY the raw SVG code.
2. DO NOT wrap the output in markdown code blocks like \`\`\`xml or \`\`\`svg.
3. No descriptions, explanations, or extra text.
4. Ensure the SVG is valid, responsive, uses a viewBox, and matches a high-quality modern design aesthetic.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let svgCode = response.text || '';
      // Bersihkan jika model tetap membungkusnya dengan blok kode markdown
      svgCode = svgCode.replace(/```(xml|svg)?/g, '').trim();

      return NextResponse.json({ success: true, result: svgCode });
    } else if (type === 'preset') {
      const systemInstruction = `You are a UI designer expert. Generate a beautiful typography design preset based on the user's prompt.
You must respond ONLY with a valid JSON object matching the following structure.
DO NOT wrap the response in markdown blocks. Output raw JSON.

JSON Structure:
{
  "name": "A descriptive name for the preset",
  "style": "One of these style IDs: neon, double-neon, 3d, chrome, hologram, curved, glitch, glassmorphism, claymorphism, funny, brutalist, sunset, cosmic, neo-mint, terracotta, nordic",
  "text": "The prompt text or a fitting word for the theme",
  "fontFamily": "One of these fonts: Orbitron, Bebas Neue, Pacifico, Cinzel, Press Start 2P, Anton, Permanent Marker, Montserrat, Inter",
  "color": "Hex color code for the main theme color",
  "effects": {
    "fillType": "solid" or "gradient",
    "gradient": {
      "type": "linear",
      "angle": 45,
      "stops": [
        { "offset": 0, "color": "Hex color" },
        { "offset": 100, "color": "Hex color" }
      ]
    },
    "stroke": {
      "color": "Hex color",
      "width": 1.5
    },
    "shadows": [
      { "x": 1, "y": 1, "blur": 5, "color": "Hex color or rgba" }
    ],
    "letterSpacing": 2,
    "textTransform": "uppercase"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
        }
      });

      const presetJson = JSON.parse(response.text || '{}');
      return NextResponse.json({ success: true, result: presetJson });
    } else {
      return NextResponse.json({ error: 'Tipe generator tidak valid. Gunakan "svg" atau "preset".' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[AI Generate Error]', error.message);
    if (error.message.includes('API key expired') || error.message.includes('API_KEY_INVALID') || error.message.includes('key expired')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kunci API Gemini (GEMINI_API_KEY) di file .env kedaluwarsa atau tidak valid, Aa Baim sayang. 🥺 Silakan perbarui dengan kunci yang aktif ya.' 
      }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
