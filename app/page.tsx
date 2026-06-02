'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabase';

export default function AdminDashboard() {
  const [imageCount, setImageCount] = useState<number | string>('...');
  const [lastPing, setLastPing] = useState<string>('Belum dimulai');
  const [serverStatus, setServerStatus] = useState<string>('Checking...');

  const fetchStats = async () => {
    try {
      setServerStatus('Checking...');
      console.log('📡 [Supabase Ping] Connecting to:', supabase.supabaseUrl);
      
      const { count, error } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Supabase API Error:', error);
        setServerStatus('API Error');
        return;
      }
      
      setImageCount(count || 0);
      setLastPing(new Date().toLocaleTimeString());
      setServerStatus('Online');
    } catch (err: any) {
      console.error('❌ Browser Connection Error:', err.message);
      setServerStatus('Offline/Blocked');
      if (err.message.includes('fetch')) {
        console.warn('💡 Hint: Your browser might be blocking the connection to Supabase or you are offline.');
      }
    }
  };

  useEffect(() => {
    // Jalankan sekali saat load
    fetchStats();

    // Jalankan setiap 5 menit agar Supabase tidak tidur (mode sleep)
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-slate-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          🚀 Bungtemin Apps Admin
          <span className="text-xs font-normal bg-indigo-500 text-white px-2 py-0.5 rounded-full">v1.0.0</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Statistik */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Gambar</p>
            <h2 className="text-4xl font-black mt-2">{imageCount}</h2>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Keep-Alive Ping</p>
            <h2 className="text-xl font-bold mt-2 text-indigo-600">{lastPing}</h2>
            <p className="text-[10px] text-slate-300 mt-1">Berjalan setiap 5 menit</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Status Database</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full ${serverStatus === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <h2 className={`text-2xl font-bold ${serverStatus === 'Online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {serverStatus}
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4">Informasi Sistem</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Provider Database</span>
              <span className="font-mono text-indigo-500 font-semibold">Supabase (Realtime)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Service Mode</span>
              <span className="text-emerald-500 font-semibold">Public Access (No JWT)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Instance Status</span>
              <span className="text-slate-400 italic">Always Awake Mode Active</span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-300 text-xs mt-10">
          Dibuat dengan ❤️ oleh OLaive untuk Aa Baim
        </p>
      </div>
    </div>
  );
}
