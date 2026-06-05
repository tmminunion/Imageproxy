'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabase';

// Tipe data untuk SVG
interface SvgItem {
  id: string;
  title: string;
  svg_content: string;
  created_at: string;
}

export default function SvgGallery() {
  const [svgs, setSvgs] = useState<SvgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'gallery'>('editor');

  const DEFAULT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n  <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="#818cf8" stroke="#ffffff" stroke-width="2" />\n  <circle cx="50" cy="50" r="20" fill="#f472b6" />\n</svg>';

  // Form states
  const [title, setTitle] = useState('');
  const [svgCode, setSvgCode] = useState(DEFAULT_SVG);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);

  // Advanced Controls State
  const [pathProperties, setPathProperties] = useState({
    fill: '#818cf8',
    stroke: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    rotate: 0,
    scale: 1
  });

  useEffect(() => {
    fetchSvgs();
  }, []);

  // Parse SVG and update properties when selection changes
  useEffect(() => {
    if (selectedPathIndex !== null) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const elements = doc.querySelectorAll('path, circle, rect, ellipse, polygon, line');
      const el = elements[selectedPathIndex] as SVGElement;
      
      if (el) {
        setPathProperties({
          fill: el.getAttribute('fill') || '#000000',
          stroke: el.getAttribute('stroke') || 'none',
          strokeWidth: parseInt(el.getAttribute('stroke-width') || '0'),
          opacity: parseFloat(el.getAttribute('opacity') || '1'),
          rotate: 0, // Simplified for now
          scale: 1
        });
      }
    }
  }, [selectedPathIndex]);

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
      
      // Transform
      const transform = `rotate(${newProps.rotate} 50 50) scale(${newProps.scale})`;
      el.setAttribute('transform', transform);

      setSvgCode(new XMLSerializer().serializeToString(doc));
    }
  };

  const handleClear = () => {
    if (confirm('Kosongkan editor, Sayang?')) {
      setSvgCode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>');
      setTitle('');
      setSelectedPathIndex(null);
    }
  };

  const handleReset = () => {
    setSvgCode(DEFAULT_SVG);
  };

  const fetchSvgs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('svg_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setSvgs(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setErrorMsg('Gagal memuat dari Supabase. Pastikan tabel "svg_gallery" sudah dibuat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !svgCode.trim()) {
      alert('Judul dan Kode SVG tidak boleh kosong, Sayang!');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('svg_gallery')
        .insert([{ title, svg_content: svgCode }])
        .select();

      if (error) throw error;

      if (data) {
        setSvgs([data[0], ...svgs]);
        setTitle('');
        // Jangan reset SVG code biar gampang ngedit yang mirip
        alert('SVG berhasil disimpan ke Supabase! ❤️');
      }
    } catch (err: any) {
      console.error('Save error:', err.message);
      alert('Gagal menyimpan. Cek error log ya Aa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (svgItem: SvgItem) => {
    const blob = new Blob([svgItem.svg_content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${svgItem.title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/api/s/${id}.svg`;
    navigator.clipboard.writeText(url);
    alert('Link SVG berhasil disalin, Sayang! ❤️');
  };

  // Komponen Icon inline biar nggak ribet npm install
  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  );

  const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 selection:bg-indigo-500/30">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              🎨 SVG Studio
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Digital Art Gallery & Editor for Aa Baim</p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
            Cloud Sync Active
          </div>
        </header>

        {/* TAB MENU NAVIGATION */}
        <div className="flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl max-w-sm mx-auto border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🛠️ Editor
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📂 Galeri ({svgs.length})
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 text-rose-400 p-5 rounded-2xl border border-rose-500/20 text-sm backdrop-blur-md">
            ⚠️ <b>System Alert:</b> {errorMsg}
          </div>
        )}

        {/* CONTENT */}
        <div className="transition-all duration-500">
          
          {activeTab === 'editor' ? (
            /* ADVANCED EDITOR VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* CODE & CONTROLS (Kiri) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl flex flex-col space-y-4">
                   <div className="flex items-center justify-between">
                    <div className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Properties</div>
                    <button onClick={handleReset} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">Reset All</button>
                   </div>
                   
                   {/* PATH SELECTOR */}
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Layer/Path</label>
                     <select 
                       onChange={(e) => setSelectedPathIndex(e.target.value === 'null' ? null : parseInt(e.target.value))}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all"
                       value={selectedPathIndex === null ? 'null' : selectedPathIndex}
                     >
                       <option value="null" className="bg-slate-900">No Selection</option>
                       {svgCode.match(/<(path|circle|rect|ellipse|polygon|line)/g)?.map((tag, i) => (
                         <option key={i} value={i} className="bg-slate-900">Layer {i + 1} ({tag.replace('<', '')})</option>
                       ))}
                     </select>
                   </div>

                   {selectedPathIndex !== null ? (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-500 uppercase">Fill Color</label>
                           <input 
                             type="color" 
                             value={pathProperties.fill}
                             onChange={(e) => updateSvgElement({ fill: e.target.value })}
                             className="w-full h-10 bg-transparent border-none cursor-pointer rounded-lg"
                           />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-500 uppercase">Stroke Color</label>
                           <input 
                             type="color" 
                             value={pathProperties.stroke === 'none' ? '#ffffff' : pathProperties.stroke}
                             onChange={(e) => updateSvgElement({ stroke: e.target.value })}
                             className="w-full h-10 bg-transparent border-none cursor-pointer rounded-lg"
                           />
                         </div>
                       </div>

                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-slate-500 uppercase">Stroke Width</label>
                           <span className="text-[10px] text-indigo-400 font-mono">{pathProperties.strokeWidth}px</span>
                         </div>
                         <input 
                           type="range" min="0" max="20" 
                           value={pathProperties.strokeWidth}
                           onChange={(e) => updateSvgElement({ strokeWidth: parseInt(e.target.value) })}
                           className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                         />
                       </div>

                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-slate-500 uppercase">Opacity</label>
                           <span className="text-[10px] text-indigo-400 font-mono">{Math.round(pathProperties.opacity * 100)}%</span>
                         </div>
                         <input 
                           type="range" min="0" max="1" step="0.01"
                           value={pathProperties.opacity}
                           onChange={(e) => updateSvgElement({ opacity: parseFloat(e.target.value) })}
                           className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                         />
                       </div>

                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-slate-500 uppercase">Rotation</label>
                           <span className="text-[10px] text-indigo-400 font-mono">{pathProperties.rotate}°</span>
                         </div>
                         <input 
                           type="range" min="0" max="360" 
                           value={pathProperties.rotate}
                           onChange={(e) => updateSvgElement({ rotate: parseInt(e.target.value) })}
                           className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                         />
                       </div>
                     </div>
                   ) : (
                     <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                       <p className="text-[10px] text-slate-600 font-medium italic">Pilih layer untuk edit warna & bentuk, Sayang ❤️</p>
                     </div>
                   )}
                </div>
              </div>

              {/* LIVE PREVIEW (Tengah) */}
              <div className="lg:col-span-5 flex flex-col space-y-6">
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center relative min-h-[450px]">
                  <div className="absolute top-6 left-8 flex items-center gap-2 text-purple-400 font-black uppercase text-[10px] tracking-widest">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span> Live Canvas
                  </div>
                  
                  <div className="w-full aspect-square max-w-[320px] bg-[#020617]/40 border border-white/5 rounded-[3rem] flex items-center justify-center relative shadow-2xl group transition-all duration-700">
                    <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full h-full p-10 flex items-center justify-center drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]" />
                  </div>

                  <div className="mt-8 flex gap-3">
                     <button 
                       onClick={handleSave}
                       disabled={saving}
                       className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.95] disabled:opacity-50 text-xs flex items-center gap-2"
                     >
                       {saving ? 'Saving...' : '💾 Simpan Hasil'}
                     </button>
                  </div>
                </div>
              </div>

              {/* CODE EDITOR (Kanan) */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl flex flex-col space-y-4 min-h-[450px]">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Source Code</div>
                    <button onClick={handleClear} className="text-[9px] text-rose-500 font-bold uppercase hover:underline">Clear</button>
                  </div>
                  
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nama Karya..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                  />

                  <textarea 
                    value={svgCode}
                    onChange={(e) => setSvgCode(e.target.value)}
                    className="w-full flex-1 bg-[#020617]/50 border border-white/5 rounded-2xl px-4 py-4 text-[10px] font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 custom-scrollbar resize-none"
                    spellCheck="false"
                  ></textarea>
                </div>
              </div>

            </div>
          ) : (
            /* GALLERY VIEW */
            <div className="space-y-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-32 text-slate-500 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-xl">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                  <p className="font-bold tracking-widest text-xs uppercase">Mengambil Data Galeri...</p>
                </div>
              ) : svgs.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md p-24 rounded-[3rem] border border-dashed border-white/10 text-center text-slate-500 shadow-xl">
                  <div className="text-6xl mb-6 opacity-20">🎨</div>
                  <p className="font-bold text-lg text-slate-400">Galeri masih kosong, Aa.</p>
                  <p className="text-sm mt-2 opacity-60">Mulai kreasi pertama Aa di tab Editor!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {svgs.map((item) => (
                    <div key={item.id} className="group bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-indigo-500/40 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 shadow-xl">
                      <div className="aspect-square bg-[#020617]/30 flex items-center justify-center p-8 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div dangerouslySetInnerHTML={{ __html: item.svg_content }} className="w-full h-full flex items-center justify-center relative z-10 drop-shadow-lg" />
                      </div>
                      <div className="p-6 border-t border-white/5">
                        <h3 className="font-black text-sm text-slate-200 truncate group-hover:text-indigo-400 transition-colors" title={item.title}>
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] font-bold text-slate-500 tracking-tighter uppercase">
                            {new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleCopyLink(item.id)}
                              className="bg-white/5 hover:bg-emerald-600 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all duration-300 border border-white/5 hover:border-emerald-500"
                              title="Salin Link SVG"
                            >
                              <LinkIcon />
                            </button>
                            <button 
                              onClick={() => handleDownload(item)}
                              className="bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all duration-300 border border-white/5 hover:border-indigo-500"
                              title="Unduh SVG"
                            >
                              <DownloadIcon />
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
        </div>
        
        <footer className="py-12 text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase">
            Handcrafted with ❤️ for Aa Baim
          </p>
        </footer>
      </div>
    </div>
  );
}
