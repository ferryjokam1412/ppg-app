// src/pages/TeachersPage.jsx
import { useSearchParams } from 'react-router-dom';
import Guru from './PengajarPage';
import Generus from './GenerusPage';

export default function DaftarPage() {
  // 💡 Ambil parameter pencarian dari URL (?tab=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'guru'; // Default ke guru jika parameter kosong

  return (
    <div className="w-full min-h-screen bg-surface-container-lowest animate-fadeIn flex flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-primary tracking-tight">Database Master TPQ</h1>
        <p className="text-xs text-on-surface-variant font-medium">Manajemen data keanggotaan pengajar serta manifes santri rumpun komposit.</p>
      </div>

      {/* TAMPILKAN KOMPONEN SESUAI SUB-MENU YANG DIKLIK DI NAVBAR/SIDEBAR */}
      <div className="flex-1 mt-2">
        {activeTab === 'guru' ? (
          <Guru />
        ) : (
          <Generus />
        )}
      </div>
    </div>
  );
}