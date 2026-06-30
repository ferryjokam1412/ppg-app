import { useState } from 'react';
import KurikulumJournalView from './KurikulumJournalView';
import PengajarJournalView from './PengajarJournalView';

export default function JournalsPage() {
  const [userRole, setUserRole] = useState('pengajar'); // Nanti ambil dari Supabase Auth

  return (
    <div className="w-full min-h-screen bg-surface-bright p-4 md:p-8">
      {/* Tombol Simulasi Role (Hapus setelah Auth terpasang) */}
      <div className="mb-6 flex gap-2">
        <button onClick={() => setUserRole('kurikulum')} className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold">Role Kurikulum</button>
        <button onClick={() => setUserRole('pengajar')} className="bg-secondary text-white px-4 py-2 rounded-lg text-xs font-bold">Role Pengajar</button>
      </div>

      {userRole === 'kurikulum' ? (
        <KurikulumJournalView />
      ) : (
        <PengajarJournalView />
      )}
    </div>
  );
}