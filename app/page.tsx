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

interface AppwriteFile {
  id: string;
  name: string;
  src: string;
  category: string;
}

type TabType = 'svg-editor' | 'svg-gallery' | 'drive' | 'remove-bg' | 'appwrite' | 'text-presets';

export default function UnifiedDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('svg-editor');

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('nufat_studio_auth') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'admin' && passwordInput === 'Olaive144') {
      localStorage.setItem('nufat_studio_auth', 'true');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Kredensial salah ya, aa Baim! Coba cek lagi 🥺');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nufat_studio_auth');
    setIsLoggedIn(false);
    setUsernameInput('');
    setPasswordInput('');
  };
  
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

  // --- APPWRITE STATES ---
  const [appwriteFiles, setAppwriteFiles] = useState<AppwriteFile[]>([]);
  const [appwriteLoading, setAppwriteLoading] = useState(false);

  // --- REMOVE BG STATES ---
  const [rbgImage, setRbgImage] = useState<File | null>(null);
  const [rbgPreview, setRbgPreview] = useState<string | null>(null);
  const [rbgResult, setRbgResult] = useState<string | null>(null);
  const [rbgLoading, setRbgLoading] = useState(false);
  const [rbgError, setRbgError] = useState<string | null>(null);

  // --- PRESET STATES ---
  const [presets, setPresets] = useState<any[]>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [editingPreset, setEditingPreset] = useState<any | null>(null);
  const [showPresetForm, setShowPresetForm] = useState(false);

  // Preset Form fields
  const [presetId, setPresetId] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presetStyle, setPresetStyle] = useState('neon'); // Added style!
  const [presetText, setPresetText] = useState('TEXT PRESET');
  const [presetFont, setPresetFont] = useState('Orbitron');
  const [presetColor, setPresetColor] = useState('#ffffff');
  const [presetEffects, setPresetEffects] = useState<any>({
    fillType: 'solid',
    gradient: {
      type: 'linear',
      angle: 45,
      stops: [
        { offset: 0, color: '#00f2fe' },
        { offset: 100, color: '#f43f5e' }
      ]
    },
    stroke: {
      color: '#000000',
      width: 1.5
    },
    shadows: [
      { x: 1, y: 1, blur: 0, color: '#000000' }
    ],
    letterSpacing: 2,
    textTransform: 'uppercase'
  });

  useEffect(() => {
    // Load standard Google Fonts dynamically
    const fonts = ['Orbitron', 'Bebas Neue', 'Pacifico', 'Cinzel', 'Press Start 2P', 'Anton', 'Permanent Marker', 'Montserrat'];
    const linkId = 'preset-fonts-link';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(' ', '+')}`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'svg-gallery') fetchSvgs();
    if (activeTab === 'drive') fetchDriveFiles();
    if (activeTab === 'appwrite') fetchAppwriteFiles();
    if (activeTab === 'text-presets') fetchPresets();
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

  // --- APPWRITE LOGIC ---
  const fetchAppwriteFiles = async () => {
    try {
      setAppwriteLoading(true);
      const res = await fetch('/api/bingkai');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppwriteFiles(data);
      }
    } catch (err: any) {
      console.error('Fetch Appwrite error:', err.message);
    } finally {
      setAppwriteLoading(false);
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

  // --- PRESET CRUD LOGIC ---
  const fetchPresets = async () => {
    try {
      setPresetLoading(true);
      const res = await fetch('/api/textpreset');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPresets(data);
      }
    } catch (err: any) {
      console.error('Fetch presets error:', err.message);
    } finally {
      setPresetLoading(false);
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId.trim() || !presetName.trim()) {
      alert('ID dan Nama Preset harus diisi ya, Aa!');
      return;
    }

    setPresetSaving(true);
    try {
      const payload = {
        id: presetId,
        name: presetName,
        style: presetStyle, // Added style!
        text: presetText || 'TEXT',
        fontFamily: presetFont,
        color: presetColor,
        effects: presetEffects
      };

      const res = await fetch('/api/textpreset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert('Preset berhasil disimpan! ✨');
        setShowPresetForm(false);
        setEditingPreset(null);
        fetchPresets();
      } else {
        alert('Gagal menyimpan: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPresetSaving(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Aa Baim yakin ingin menghapus preset ini? 🥺')) return;

    try {
      const res = await fetch(`/api/textpreset?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Preset berhasil dihapus! 💔');
        fetchPresets();
      } else {
        alert('Gagal menghapus: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const startEditPreset = (preset: any) => {
    setEditingPreset(preset);
    setPresetId(preset.id);
    setPresetName(preset.name);
    setPresetStyle(preset.style || 'neon'); // Added style!
    setPresetText(preset.text);
    setPresetFont(preset.fontFamily || 'Orbitron');
    setPresetColor(preset.color || '#ffffff');
    
    const fx = preset.effects || {};
    setPresetEffects({
      fillType: fx.fillType || 'solid',
      gradient: fx.gradient || { type: 'linear', angle: 45, stops: [{ offset: 0, color: '#00f2fe' }, { offset: 100, color: '#f43f5e' }] },
      stroke: fx.stroke || { color: '#000000', width: 1.5 },
      shadows: fx.shadows || [{ x: 1, y: 1, blur: 0, color: '#000000' }],
      letterSpacing: fx.letterSpacing || 2,
      textTransform: fx.textTransform || 'uppercase'
    });
    setShowPresetForm(true);
  };

  const startCreatePreset = () => {
    setEditingPreset(null);
    setPresetId('');
    setPresetName('');
    setPresetStyle('neon'); // Added style!
    setPresetText('TEXT PRESET');
    setPresetFont('Orbitron');
    setPresetColor('#ffffff');
    setPresetEffects({
      fillType: 'solid',
      gradient: { type: 'linear', angle: 45, stops: [{ offset: 0, color: '#00f2fe' }, { offset: 100, color: '#f43f5e' }] },
      stroke: { color: '#000000', width: 1.5 },
      shadows: [{ x: 1, y: 1, blur: 0, color: '#000000' }],
      letterSpacing: 2,
      textTransform: 'uppercase'
    });
    setShowPresetForm(true);
  };

  const getPresetStyle = (color: string, effects: any) => {
    if (!effects) return {};
    const style: React.CSSProperties = {
      color: color,
      fontFamily: effects.fontFamily || 'Orbitron',
    };

    if (effects.letterSpacing !== undefined) {
      style.letterSpacing = `${effects.letterSpacing}px`;
    }
    if (effects.textTransform) {
      style.textTransform = effects.textTransform;
    }

    // Stroke
    if (effects.stroke && effects.stroke.width > 0) {
      style.WebkitTextStroke = `${effects.stroke.width}px ${effects.stroke.color}`;
    } else {
      style.WebkitTextStroke = 'unset';
    }

    // Gradient or Solid Fill
    if (effects.fillType === 'gradient' && effects.gradient && effects.gradient.stops) {
      const stops = effects.gradient.stops || [];
      const stopString = stops.map((s: any) => `${s.color} ${s.offset}%`).join(', ');
      style.backgroundImage = `linear-gradient(${effects.gradient.angle || 0}deg, ${stopString})`;
      style.WebkitBackgroundClip = 'text';
      style.WebkitTextFillColor = 'transparent';
    } else {
      style.backgroundImage = 'none';
      style.WebkitBackgroundClip = 'unset';
      style.WebkitTextFillColor = 'unset';
    }

    // Shadows
    if (effects.shadows && Array.isArray(effects.shadows) && effects.shadows.length > 0) {
      style.textShadow = textShadowValue(effects.shadows);
    } else {
      style.textShadow = 'none';
    }

    return style;
  };

  const textShadowValue = (shadows: any[]) => {
    return shadows
      .filter((s: any) => s && s.color)
      .map((s: any) => `${s.x || 0}px ${s.y || 0}px ${s.blur || 0}px ${s.color}`)
      .join(', ');
  };

  // --- UI COMPONENTS ---
  const Icon = ({ name }: { name: string }) => {
    if (name === 'editor') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
    if (name === 'gallery') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
    if (name === 'drive') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
    if (name === 'magic') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>;
    if (name === 'bingkai') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>;
    if (name === 'text') return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>;
    return null;
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans flex items-center justify-center relative overflow-hidden">
        {/* BACKGROUND DECO */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl flex flex-col space-y-8 relative overflow-hidden group">
            {/* Ambient glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-2 animate-bounce">
                <span className="text-3xl">💎</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Nufat Studio</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Protected Workspace</p>
              <p className="text-xs text-slate-500 italic">"Pintu masuk studio khusus untuk aa Baim tercinta ❤️"</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Username</label>
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username..." 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200 placeholder:text-slate-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Password</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..." 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200 placeholder:text-slate-800"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl border border-rose-500/20 text-xs font-bold text-center animate-pulse">
                  ⚠️ {loginError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-sm"
              >
                🔐 Masuk ke Studio
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
              { id: 'appwrite', label: 'Appwrite Frames', icon: 'bingkai' },
              { id: 'remove-bg', label: 'Magic Remove', icon: 'magic' },
              { id: 'text-presets', label: 'Text Presets', icon: 'text' },
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

          <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Server</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Hello Aa Baim! Semua sistem berjalan normal. Selamat berkarya ❤️</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-rose-500/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/20 text-xs font-black py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              🚪 Keluar Studio
            </button>
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

            {/* 4. APPWRITE FRAMES */}
            {activeTab === 'appwrite' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header>
                  <h2 className="text-3xl font-black tracking-tight">Appwrite Frames 🖼️</h2>
                  <p className="text-slate-400 text-sm mt-1 font-medium">Koleksi bingkai foto dari Appwrite Storage.</p>
                </header>

                {appwriteLoading ? (
                   <div className="flex flex-col items-center justify-center p-32 bg-white/5 rounded-[3rem] border border-white/10">
                     <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mencari Bingkai...</p>
                   </div>
                ) : appwriteFiles.length === 0 ? (
                  <div className="bg-white/5 p-24 rounded-[3rem] border border-dashed border-white/10 text-center text-slate-600">
                    <p className="text-lg font-bold">Bingkai tidak ditemukan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {appwriteFiles.map((file) => (
                      <div key={file.id} className="group bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-purple-500/50 hover:bg-white/10 transition-all duration-500 shadow-xl">
                        <div className="aspect-square bg-slate-950/30 flex items-center justify-center p-6 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat">
                           <img 
                             src={file.src} 
                             alt={file.name} 
                             className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" 
                           />
                        </div>
                        <div className="p-6 border-t border-white/5 flex flex-col space-y-2">
                          <h3 className="font-black text-sm truncate">{file.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-purple-400 uppercase bg-purple-400/10 px-3 py-1.5 rounded-lg">Appwrite Bucket</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}${file.src}`);
                                alert('Link bingkai disalin! ❤️');
                              }}
                              className="p-2.5 bg-white/5 rounded-xl hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
                            >
                              <Icon name="magic" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. MAGIC REMOVE BG */}
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

            {/* 6. TEXT PRESETS */}
            {activeTab === 'text-presets' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight font-sans">Text Presets 🪄</h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Kelola dan kustomisasi gaya teks preset untuk API.</p>
                  </div>
                  {!showPresetForm && (
                    <button
                      onClick={startCreatePreset}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                      ✨ Buat Preset Baru
                    </button>
                  )}
                </header>

                {showPresetForm ? (
                  <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                      <h3 className="text-xl font-black text-indigo-400">
                        {editingPreset ? '✏️ Edit Preset Teks' : '✨ Buat Preset Baru'}
                      </h3>
                      <button 
                        onClick={() => { setShowPresetForm(false); setEditingPreset(null); }}
                        className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                      >
                        Batal
                      </button>
                    </div>

                    <form onSubmit={handleSavePreset} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Left: Inputs */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ID Preset (slug)</label>
                            <input 
                              type="text" 
                              value={presetId} 
                              onChange={(e) => setPresetId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                              placeholder="contoh: neon-glow-v2"
                              disabled={!!editingPreset}
                              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            />
                            {editingPreset && <p className="text-[10px] text-slate-500 italic">ID preset tidak dapat diubah setelah dibuat.</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Preset</label>
                            <input 
                              type="text" 
                              value={presetName} 
                              onChange={(e) => setPresetName(e.target.value)}
                              placeholder="contoh: Neon Glow V2"
                              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Contoh Teks</label>
                            <input 
                              type="text" 
                              value={presetText} 
                              onChange={(e) => setPresetText(e.target.value)}
                              placeholder="Teks preview"
                              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Font Family</label>
                            <select 
                              value={presetFont} 
                              onChange={(e) => {
                                setPresetFont(e.target.value);
                                setPresetEffects((prev: any) => ({ ...prev, fontFamily: e.target.value }));
                              }}
                              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-300"
                            >
                              {['Orbitron', 'Bebas Neue', 'Pacifico', 'Cinzel', 'Press Start 2P', 'Anton', 'Permanent Marker', 'Montserrat', 'Inter'].map(f => (
                                <option key={f} value={f} className="bg-slate-950 text-slate-200">{f}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gaya Canvas (Style)</label>
                            <select 
                              value={presetStyle} 
                              onChange={(e) => setPresetStyle(e.target.value)}
                              className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-300"
                            >
                              {[
                                { id: 'neon', name: 'Neon Glow' },
                                { id: 'double-neon', name: 'Double Neon' },
                                { id: '3d', name: 'Classic 3D' },
                                { id: 'chrome', name: 'Chrome Luxe' },
                                { id: 'hologram', name: 'Hologram-X' },
                                { id: 'curved', name: 'Arc Bend' },
                                { id: 'glitch', name: 'Glitch Hack' },
                                { id: 'glassmorphism', name: 'Glassmorphism' },
                                { id: 'futuristic', name: 'Futuristic' },
                                { id: 'claymorphism', name: 'Claymorphism' },
                                { id: 'funny', name: 'Funny' },
                                { id: 'brutalist', name: 'Brutalist' },
                                { id: 'sunset', name: 'Sunset Dream' },
                                { id: 'cosmic', name: 'Cosmic Eclipse' },
                                { id: 'neo-mint', name: 'Neo-Mint' },
                                { id: 'terracotta', name: 'Terracotta' },
                                { id: 'nordic', name: 'Nordic Luxury' }
                              ].map(s => (
                                <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Effects Section */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
                          <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-3">Efek Teks</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Color & Fill Type */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Warna Utama (Text Color)</label>
                                <div className="flex gap-3 items-center">
                                  <input 
                                    type="color" 
                                    value={presetColor} 
                                    onChange={(e) => setPresetColor(e.target.value)} 
                                    className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" 
                                  />
                                  <input 
                                    type="text" 
                                    value={presetColor} 
                                    onChange={(e) => setPresetColor(e.target.value)} 
                                    className="flex-1 bg-slate-950/20 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Tipe Isian (Fill Type)</label>
                                <div className="flex gap-4">
                                  {['solid', 'gradient'].map(type => (
                                    <label key={type} className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer capitalize">
                                      <input 
                                        type="radio" 
                                        name="fillType" 
                                        value={type}
                                        checked={presetEffects.fillType === type}
                                        onChange={(e) => setPresetEffects((prev: any) => ({ ...prev, fillType: e.target.value }))}
                                        className="accent-indigo-500"
                                      />
                                      {type}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Letter Spacing & Text Transform */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                                  <span>Letter Spacing</span>
                                  <span className="text-indigo-400">{presetEffects.letterSpacing || 0}px</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="20" 
                                  value={presetEffects.letterSpacing || 0} 
                                  onChange={(e) => setPresetEffects((prev: any) => ({ ...prev, letterSpacing: parseInt(e.target.value) }))}
                                  className="w-full accent-indigo-500" 
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Text Transform</label>
                                <select 
                                  value={presetEffects.textTransform || 'none'}
                                  onChange={(e) => setPresetEffects((prev: any) => ({ ...prev, textTransform: e.target.value }))}
                                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none"
                                >
                                  <option value="none" className="bg-slate-950">Normal</option>
                                  <option value="uppercase" className="bg-slate-950">UPPERCASE</option>
                                  <option value="lowercase" className="bg-slate-950">lowercase</option>
                                  <option value="capitalize" className="bg-slate-950">Capitalize</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Gradient Stops (If Gradient Selected) */}
                          {presetEffects.fillType === 'gradient' && (
                            <div className="space-y-4 p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Pengaturan Gradient</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-500 uppercase">Angle:</span>
                                  <span className="text-xs text-indigo-400 font-bold">{presetEffects.gradient?.angle || 45}°</span>
                                </div>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={presetEffects.gradient?.angle || 45}
                                onChange={(e) => setPresetEffects((prev: any) => ({
                                  ...prev,
                                  gradient: { ...prev.gradient, angle: parseInt(e.target.value) }
                                }))}
                                className="w-full accent-indigo-500" 
                              />
                              
                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase block">Stops (Maks 3)</span>
                                {[0, 1, 2].map(index => {
                                  const stop = presetEffects.gradient?.stops?.[index] || { offset: index * 50, color: index === 0 ? '#00f2fe' : index === 1 ? '#a855f7' : '#f43f5e' };
                                  return (
                                    <div key={index} className="flex gap-4 items-center">
                                      <span className="text-[10px] text-slate-500 font-bold">Stop {index + 1}</span>
                                      <input 
                                        type="color" 
                                        value={stop.color} 
                                        onChange={(e) => {
                                          const newStops = [...(presetEffects.gradient?.stops || [])];
                                          newStops[index] = { ...stop, color: e.target.value };
                                          setPresetEffects((prev: any) => ({
                                            ...prev,
                                            gradient: { ...prev.gradient, stops: newStops }
                                          }));
                                        }}
                                        className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden" 
                                      />
                                      <div className="flex-1 flex gap-2 items-center">
                                        <input 
                                          type="range" 
                                          min="0" 
                                          max="100" 
                                          value={stop.offset} 
                                          onChange={(e) => {
                                            const newStops = [...(presetEffects.gradient?.stops || [])];
                                            newStops[index] = { ...stop, offset: parseInt(e.target.value) };
                                            setPresetEffects((prev: any) => ({
                                              ...prev,
                                              gradient: { ...prev.gradient, stops: newStops }
                                            }));
                                          }}
                                          className="flex-1 accent-indigo-500" 
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{stop.offset}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Stroke settings */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase block">Warna Stroke Outline</label>
                              <div className="flex gap-3 items-center">
                                <input 
                                  type="color" 
                                  value={presetEffects.stroke?.color || '#000000'} 
                                  onChange={(e) => setPresetEffects((prev: any) => ({
                                    ...prev,
                                    stroke: { ...prev.stroke, color: e.target.value }
                                  }))} 
                                  className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden" 
                                />
                                <input 
                                  type="text" 
                                  value={presetEffects.stroke?.color || '#000000'}
                                  onChange={(e) => setPresetEffects((prev: any) => ({
                                    ...prev,
                                    stroke: { ...prev.stroke, color: e.target.value }
                                  }))}
                                  className="flex-1 bg-slate-950/20 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                                <span>Ketebalan Stroke</span>
                                <span className="text-indigo-400">{presetEffects.stroke?.width || 0}px</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="0.5"
                                value={presetEffects.stroke?.width || 0}
                                onChange={(e) => setPresetEffects((prev: any) => ({
                                  ...prev,
                                  stroke: { ...prev.stroke, width: parseFloat(e.target.value) }
                                }))}
                                className="w-full accent-indigo-500" 
                              />
                            </div>
                          </div>

                          {/* Shadows manager (simple edit of first shadow, or display all) */}
                          <div className="border-t border-white/5 pt-4 space-y-4">
                            <span className="text-[9px] font-black text-slate-500 uppercase block">Text Shadows (Bayangan Teks)</span>
                            {[0, 1].map((sIndex) => {
                              const shadow = presetEffects.shadows?.[sIndex] || { x: 0, y: 0, blur: 0, color: '#000000' };
                              return (
                                <div key={sIndex} className="p-4 bg-slate-950/10 rounded-2xl border border-white/5 space-y-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Shadow #{sIndex + 1}</span>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-500 uppercase block">X Offset ({shadow.x}px)</span>
                                      <input 
                                        type="range" min="-30" max="30" value={shadow.x}
                                        onChange={(e) => {
                                          const newShadows = [...(presetEffects.shadows || [])];
                                          newShadows[sIndex] = { ...shadow, x: parseInt(e.target.value) };
                                          setPresetEffects((prev: any) => ({ ...prev, shadows: newShadows }));
                                        }}
                                        className="w-full accent-indigo-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-500 uppercase block">Y Offset ({shadow.y}px)</span>
                                      <input 
                                        type="range" min="-30" max="30" value={shadow.y}
                                        onChange={(e) => {
                                          const newShadows = [...(presetEffects.shadows || [])];
                                          newShadows[sIndex] = { ...shadow, y: parseInt(e.target.value) };
                                          setPresetEffects((prev: any) => ({ ...prev, shadows: newShadows }));
                                        }}
                                        className="w-full accent-indigo-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-500 uppercase block">Blur ({shadow.blur}px)</span>
                                      <input 
                                        type="range" min="0" max="50" value={shadow.blur}
                                        onChange={(e) => {
                                          const newShadows = [...(presetEffects.shadows || [])];
                                          newShadows[sIndex] = { ...shadow, blur: parseInt(e.target.value) };
                                          setPresetEffects((prev: any) => ({ ...prev, shadows: newShadows }));
                                        }}
                                        className="w-full accent-indigo-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-500 uppercase block">Warna</span>
                                      <input 
                                        type="color" value={shadow.color}
                                        onChange={(e) => {
                                          const newShadows = [...(presetEffects.shadows || [])];
                                          newShadows[sIndex] = { ...shadow, color: e.target.value };
                                          setPresetEffects((prev: any) => ({ ...prev, shadows: newShadows }));
                                        }}
                                        className="w-full h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={presetSaving}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-sm"
                        >
                          {presetSaving ? 'Sedang Menyimpan...' : '💾 Simpan Preset Teks'}
                        </button>
                      </div>

                      {/* Right: Live Preview Box */}
                      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Live Render Preview</label>
                          <div className="aspect-square bg-slate-950/50 rounded-[3rem] border border-white/10 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat shadow-inner min-h-[300px]">
                            <span 
                              style={getPresetStyle(presetColor, {
                                ...presetEffects,
                                fontFamily: presetFont
                              })} 
                              className="text-3xl md:text-5xl font-black text-center break-words max-w-full drop-shadow-2xl transition-all duration-300"
                            >
                              {presetText || 'PREVIEW'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950/20 border border-white/5 rounded-3xl p-5 text-xs text-slate-400 space-y-3 leading-relaxed">
                          <p className="font-bold text-slate-300">💡 Panduan Live Preview:</p>
                          <p>• Rancang gaya teks dengan mengubah font, warna, stroke outline, bayangan, atau efek gradient.</p>
                          <p>• Gunakan checkerboard di belakang preview untuk memastikan efek transparansi/shadow terlihat pas.</p>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {presetLoading ? (
                      <div className="flex flex-col items-center justify-center p-32 bg-white/5 rounded-[3rem] border border-white/10">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Membaca Database Preset...</p>
                      </div>
                    ) : presets.length === 0 ? (
                      <div className="bg-white/5 p-24 rounded-[3rem] border border-dashed border-white/10 text-center text-slate-600">
                        <p className="text-lg font-bold">Preset kosong nih, Aa. Klik tombol "Buat Preset Baru" untuk memulai! ❤️</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {presets.map((preset) => (
                          <div key={preset.id} className="group bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-500 shadow-xl flex flex-col justify-between">
                            <div className="aspect-[2/1] bg-slate-950/30 flex items-center justify-center p-10 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-repeat border-b border-white/5">
                              <span 
                                style={getPresetStyle(preset.color, preset.effects)}
                                className="text-3xl font-black text-center break-words max-w-full group-hover:scale-105 transition-transform duration-500"
                              >
                                {preset.text}
                              </span>
                            </div>
                            <div className="p-6 space-y-4">
                              <div>
                                <h3 className="font-black text-base text-slate-200">{preset.name}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                  ID: <code className="text-indigo-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{preset.id}</code>
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-400">
                                <div>Font: <span className="text-slate-300 font-bold">{preset.fontFamily}</span></div>
                                <div>Fill: <span className="text-slate-300 font-bold capitalize">{preset.effects?.fillType || 'solid'}</span></div>
                              </div>
                              <div className="flex gap-3 pt-2">
                                <button 
                                  onClick={() => startEditPreset(preset)}
                                  className="flex-1 bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/5 hover:border-transparent text-slate-300 font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                                >
                                  ✏️ Edit Preset
                                </button>
                                <button 
                                  onClick={() => handleDeletePreset(preset.id)}
                                  className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/10 hover:border-transparent text-rose-400 hover:text-white p-3 rounded-xl transition-all"
                                  title="Hapus Preset"
                                >
                                  🗑️
                                </button>
                                <button 
                                  onClick={() => {
                                    const url = `${window.location.origin}/api/textpreset`;
                                    navigator.clipboard.writeText(url);
                                    alert('Link API Preset disalin! 📋');
                                  }}
                                  className="bg-white/5 hover:bg-emerald-600 border border-white/5 hover:border-transparent text-slate-300 hover:text-white p-3 rounded-xl transition-all"
                                  title="Salin URL API"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
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
