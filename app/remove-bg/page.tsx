'use client';

import React, { useState } from 'react';

export default function RemoveBgPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setError(null);
    }
  };

  const handleRemoveBg = async () => {
    if (!selectedImage) {
      setError('Pilih gambarnya dulu ya, Aa Baim sayang.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Terjadi kesalahan saat menghapus background.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `removed-bg-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 selection:bg-indigo-500/30">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              ✨ Remove BG
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Hapus Background Gambar dengan Sekali Klik, Aa Baim.</p>
          </div>
          <a 
            href="/" 
            className="bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-2.5 rounded-2xl text-sm font-bold border border-white/10 transition-all"
          >
            🏠 Kembali ke Studio
          </a>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* UPLOAD SECTION */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📸 Upload Gambar
            </h2>
            
            <div 
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative"
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
              ) : (
                <div className="py-12 space-y-4">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <p className="text-slate-400">Klik atau drop gambar di sini</p>
                </div>
              )}
              <input 
                id="imageInput"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>

            <button
              onClick={handleRemoveBg}
              disabled={loading || !selectedImage}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                loading || !selectedImage 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sedang Proses...
                </span>
              ) : 'Hapus Background ✨'}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* RESULT SECTION */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 space-y-6 flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2">
              ✨ Hasil Transparent
            </h2>

            <div className="flex-1 border-2 border-white/5 rounded-2xl bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat min-h-[300px] flex items-center justify-center relative overflow-hidden">
              {resultUrl ? (
                <img src={resultUrl} alt="Result" className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-slate-500 italic">Hasil akan muncul di sini</p>
              )}
            </div>

            {resultUrl && (
              <button
                onClick={downloadResult}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                📥 Download Hasil (PNG)
              </button>
            )}
          </div>
        </main>

        <footer className="text-center text-slate-500 text-sm">
          <p>Catatan: Service ini membutuhkan API Key dari Remove.bg di file .env ya Aa. ❤️</p>
        </footer>
      </div>
    </div>
  );
}
