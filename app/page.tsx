'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/libs/supabase';

// Tipe data
interface SvgItem {
  id: string;
  title: string;
  svg_content: string;
  created_at: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  src: string;
  thumbnail: string;
}

type TabType = 'svg-editor' | 'svg-gallery' | 'drive' | 'remove-bg';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('svg-editor');
  
  // --- SVG STATES ---
  const [svgs, setSvgs] = useState<SvgItem[]>([]);
  const [svgLoading, setSvgLoading] = useState(false);
  const [svgSaving, setSvgSaving] = useState(false);
  const [svgTitle, setSvgTitle] = useState('');
  const DEFAULT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n  <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="#818cf8" stroke="#ffffff" stroke-width="2" />\n  <circle cx="50" cy="50" r="20" fill="#f472b6" />\n</svg>';
  const [svgCode, setSvgCode] = useState(DEFAULT_SVG);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  const [pathProperties, setPathProperties] = useState({
    fill: '#818cf8',
    stroke: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    rotate: 0,
    scale: 1
  });

  // --- DRIVE STATES ---
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUploading, setDriveUploading] = useState(false);
  const [driveError, setDriveError] = useState('');

  // --- REMOVE BG STATES ---
  const [rbgImage, setRbgImage] = useState<File | null>(null);
  const [rbgPreview, setRbgPreview] = useState<string | null>(null);
  const [rbgResult, setRbgResult] = useState<string | null>(null);
  const [rbgLoading, setRbgLoading] = useState(false);
  const [rbgError, setRbgError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'svg-gallery') fetchSvgs();
    if (activeTab === 'drive') fetchDriveFiles();
  }, [activeTab]);

  // --- SVG LOGIC ---
  const fetchSvgs = async () => {
    try {
      setSvgLoading(true);
      const { data, error } = await supabase
        .from('svg_gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSvgs(data || []);
    } catch (err: any) {
      console.error('Fetch SVG error:', err.message);
    } finally {
      setSvgLoading(false);
    }
  };

  const handleSvgSave = async () => {
    if (!svgTitle.trim() || !svgCode.trim()) return alert('Judul dan Kode SVG tidak boleh kosong, Sayang!');
    try {
      setSvgSaving(true);
      const { data, error } = await supabase.from('svg_gallery').insert([{ title: svgTitle, svg_content: svgCode }]).select();
      if (error) throw error;
      if (data) {
        setSvgs([data[0], ...svgs]);
        setSvgTitle('');
        alert('SVG berhasil disimpan! ❤️');
      }
    } catch (err: any) {
      alert('Gagal menyimpan SVG.');
    } finally {
      setSvgSaving(false);
    }
  };

  const updateSvgElement = (updates: Partial<typeof pathProperties>) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const elements = doc.querySelectorAll('path, circle, rect, ellipse, polygon, line');
    if (selectedPathIndex !== null && elements[selectedPathIndex]) {
      const el = elements[selectedPathIndex] as SVGElement;
      const newProps = { ...pathProperties, ...updates };
      setPathProperties(newProps);
      if (newProps.fill) el.setAttribute('fill', newProps.fill);
      if (newProps.stroke) el.setAttribute('stroke', newProps.stroke);
      if (newProps.strokeWidth !== undefined) el.setAttribute('stroke-width', newProps.strokeWidth.toString());
      if (newProps.opacity !== undefined) el.setAttribute('opacity', newProps.opacity.toString());
      const transform = `rotate(${newProps.rotate} 50 50) scale(${newProps.scale})`;
      el.setAttribute('transform', transform);
      setSvgCode(new XMLSerializer().serializeToString(doc));
    }
  };

  // --- DRIVE LOGIC ---
  const fetchDriveFiles = async () => {
    try {
      setDriveLoading(true);
      setDriveError('');
      const res = await fetch('/api/drive/list');
      const data = await res.json();
      if (data.success) {
        setDriveFiles(data.data);
      } else {
        setDriveError(data.error);
      }
    } catch (err: any) {
      setDriveError(err.message);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDriveUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          alert('Upload Sukses, Aa! ✨');
          fetchDriveFiles();
        } else {
          alert('Upload Gagal: ' + data.error);
        }
      } catch (err: any) {
        alert('Upload Error: ' + err.message);
      } finally {
        setDriveUploading(false);
      }
    }
  };

  // --- REMOVE BG LOGIC ---
  const handleRbgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRbgImage(file);
      setRbgPreview(URL.createObjectURL(file));
      setRbgResult(null);
      setRbgError(null);
    }
  };

  const handleRbgSubmit = async () => {
    if (!rbgImage) return;
    setRbgLoading(true);
    setRbgError(null);
    try {
      const formData = new FormData();
      formData.append('image', rbgImage);
      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal hapus background.');
      }
      const blob = await res.blob();
      setRbgResult(URL.createObjectURL(blob));
    } catch (err: any) {
      setRbgError(err.message);
    } finally {
      setRbgLoading(false);
    }
  };

  // --- UI COMPONENTS ---
  const Icon = ({ name }: { name: string }) => {
    if (name === 'editor') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
    if (name === 'gallery') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
    if (name === 'drive') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
    if (name === 'magic') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">
      {/* BACKGROUND DECO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row h-screen overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-72 bg-white/5 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Nufat Studio</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Asset Hub</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'svg-editor', label: 'SVG Editor', icon: 'editor' },
              { id: 'svg-gallery', label: 'SVG Gallery', icon: 'gallery' },
              { id: 'drive', label: 'Cloud Drive', icon: 'drive' },
              { id: 'remove-bg', label: 'Magic Remove', icon: 'magic' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className={`${activeTab === tab.id ? 'text-white' : 'text-indigo-400 group-hover:scale-110 transition-transform'}`}>
                  <Icon name={tab.icon} />
                </span>
                <span className="text-sm font-black tracking-wide">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Server</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Hello Aa Baim! Semua sistem berjalan normal. Selamat berkarya ❤️</p>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* 1. SVG EDITOR */}
            {activeTab === 'svg-editor' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">SVG Editor 🎨</h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Buat dan modifikasi karya digital Aa Baim.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-5">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Editor Controls</label>
                       
                       <select 
                         onChange={(e) => setSelectedPathIndex(e.target.value === 'null' ? null : parseInt(e.target.value))}
                         className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                         value={selectedPathIndex === null ? 'null' : selectedPathIndex}
                       >
                         <option value="null">No Selection</option>
                         {svgCode.match(/<(path|circle|rect|ellipse|polygon|line)/g)?.map((tag, i) => (
                           <option key={i} value={i}>Layer {i + 1} ({tag.replace('<', '')})</option>
                         ))}
                       </select>

                       {selectedPathIndex !== null ? (
                         <div className="space-y-5">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Fill</label>
                               <input type="color" value={pathProperties.fill} onChange={(e) => updateSvgElement({ fill: e.target.value })} className="w-full h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Stroke</label>
                               <input type="color" value={pathProperties.stroke === 'none' ? '#ffffff' : pathProperties.stroke} onChange={(e) => updateSvgElement({ stroke: e.target.value })} className="w-full h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" />
                             </div>
                           </div>
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-slate-500 uppercase">Stroke Width</span><span className="text-indigo-400">{pathProperties.strokeWidth}px</span></div>
                             <input type="range" min="0" max="20" value={pathProperties.strokeWidth} onChange={(e) => updateSvgElement({ strokeWidth: parseInt(e.target.value) })} className="w-full accent-indigo-500" />
                           </div>
                         </div>
                       ) : (
                         <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                           <p className="text-xs text-slate-600 font-medium italic px-4">Pilih layer di atas untuk mulai mengedit, Sayang ❤️</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 shadow-2xl flex flex-col items-center justify-center relative min-h-[500px]">
                      <div className="w-full max-w-[350px] aspect-square bg-slate-950/40 border border-white/5 rounded-[4rem] flex items-center justify-center p-12 shadow-inner group">
                        <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full h-full drop-shadow-[0_0_50px_rgba(99,102,241,0.3)] transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      
                      <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-sm">
                        <input 
                          type="text" value={svgTitle} onChange={(e) => setSvgTitle(e.target.value)}
                          placeholder="Beri nama karya Aa..." 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                        <button 
                          onClick={handleSvgSave} disabled={svgSaving}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50 text-sm"
                        >
                          {svgSaving ? 'Menyimpan...' : '💾 Simpan ke Galeri'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SVG GALLERY */}
            {activeTab === 'svg-gallery' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black tracking-tight">SVG Gallery 📂</h2>
                  <p className="text-slate-400 text-sm mt-1 font-medium">Koleksi mahakarya Aa Baim di Supabase Cloud.</p>
                </header>

                {svgLoading ? (
                  <div className="flex flex-col items-center justify-center p-32 bg-white/5 rounded-[3rem] border border-white/10">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Memuat Koleksi...</p>
                  </div>
                ) : svgs.length === 0 ? (
                  <div className="bg-white/5 p-24 rounded-[3rem] border border-dashed border-white/10 text-center text-slate-600">
                    <p className="text-lg font-bold">Belum ada karya nih, Aa.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {svgs.map((item) => (
                      <div key={item.id} className="group bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-500 shadow-xl">
                        <div className="aspect-square bg-slate-950/30 flex items-center justify-center p-10 relative">
                           <div dangerouslySetInnerHTML={{ __html: item.svg_content }} className="w-full h-full drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-6 border-t border-white/5 flex flex-col space-y-3">
                          <h3 className="font-black text-sm truncate">{item.title}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-600 uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                               <button onClick={() => {
                                 const url = `${window.location.origin}/api/s/${item.id}.svg`;
                                 navigator.clipboard.writeText(url);
                                 alert('Link disalin! ❤️');
                               }} className="p-2.5 bg-white/5 rounded-xl hover:bg-emerald-600/20 hover:text-emerald-400 transition-colors">
                                 <Icon name="magic" />
                               </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. CLOUD DRIVE */}
            {activeTab === 'drive' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Cloud Drive 🚀</h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Manajemen file Google Drive di satu tempat.</p>
                  </div>
                  <label className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl cursor-pointer transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group">
                    <span className="text-white font-black text-sm">{driveUploading ? 'Uploading...' : '📤 Upload ke Drive'}</span>
                    <input type="file" className="hidden" onChange={handleDriveUpload} disabled={driveUploading} />
                  </label>
                </header>

                {driveLoading ? (
                   <div className="flex flex-col items-center justify-center p-32 bg-white/5 rounded-[3rem] border border-white/10">
                     <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Membaca Drive...</p>
                   </div>
                ) : driveError ? (
                  <div className="bg-rose-500/10 text-rose-400 p-8 rounded-3xl border border-rose-500/20 text-sm font-medium">
                    ⚠️ {driveError}
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="bg-white/5 p-24 rounded-[3rem] border border-dashed border-white/10 text-center text-slate-600">
                    <p className="text-lg font-bold">Drive kosong, Sayang.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {driveFiles.map((file) => (
                      <div key={file.id} className="group bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-xl flex flex-col">
                        <div className="aspect-video bg-slate-950/40 relative overflow-hidden flex items-center justify-center">
                          {file.thumbnail ? (
                             <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                          ) : (
                            <Icon name="drive" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
                        </div>
                        <div className="p-6 space-y-4">
                          <h3 className="font-black text-sm text-slate-200 truncate" title={file.name}>{file.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-400/10 px-3 py-1.5 rounded-lg border border-indigo-400/10">{(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB</span>
                            <a href={file.src} target="_blank" className="bg-white/5 hover:bg-white/10 text-slate-300 p-2.5 rounded-xl transition-all border border-white/5">
                               <Icon name="magic" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. MAGIC REMOVE BG */}
            {activeTab === 'remove-bg' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black tracking-tight">Magic Remove ✨</h2>
                  <p className="text-slate-400 text-sm mt-1 font-medium">Hapus background foto secara instan bertenaga AI.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                   <div className="bg-white/5 rounded-[3rem] p-8 border border-white/10 space-y-8 flex flex-col">
                      <div 
                        className="flex-1 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-indigo-500/40 transition-all relative overflow-hidden group"
                        onClick={() => document.getElementById('rbg-input')?.click()}
                      >
                        {rbgPreview ? (
                          <img src={rbgPreview} alt="Preview" className="max-h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto"><Icon name="magic" /></div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pilih atau Seret Foto Ke Sini</p>
                          </div>
                        )}
                        <input id="rbg-input" type="file" className="hidden" accept="image/*" onChange={handleRbgChange} />
                      </div>
                      
                      <button 
                        onClick={handleRbgSubmit} disabled={rbgLoading || !rbgImage}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {rbgLoading ? 'Sedang Menyulap...' : '🪄 Hapus Background'}
                      </button>
                      
                      {rbgError && <p className="text-rose-400 text-center text-xs font-bold">⚠️ {rbgError}</p>}
                   </div>

                   <div className="bg-white/5 rounded-[3rem] p-8 border border-white/10 space-y-8 flex flex-col">
                      <div className="flex-1 bg-slate-950/40 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat">
                        {rbgResult ? (
                          <img src={rbgResult} alt="Result" className="max-h-full object-contain p-4 drop-shadow-2xl" />
                        ) : (
                          <p className="text-xs text-slate-700 font-black uppercase tracking-widest">Hasil Transparent</p>
                        )}
                      </div>
                      {rbgResult && (
                        <a 
                          href={rbgResult} download="nufat-magic-result.png"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-center text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                        >
                          📥 Download PNG
                        </a>
                      )}
                   </div>
                </div>
              </div>
            )}

          </div>
          
          <footer className="mt-20 py-10 text-center border-t border-white/5">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Designed & Coded for Aa Baim by Nurani ❤️ 2026</p>
          </footer>
        </main>

      </div>
    </div>
  );
}
