import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Bungtemin Apps Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Statistik */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total User</p>
          <h2 className="text-3xl font-bold">1,234</h2>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Gambar Tersimpan</p>
          <h2 className="text-3xl font-bold">567</h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Status Server</p>
          <h2 className="text-3xl font-bold text-green-500">Online</h2>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Log Aktivitas Terakhir</h3>
        <p className="text-sm text-gray-400 italic">Menunggu data dari Supabase...</p>
      </div>
    </div>
  );
}
