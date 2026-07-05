import { useAuth } from '../context/AuthContext'; // 💡 Sesuaikan path menuju AuthContext Anda
import KurikulumJournalView from './JadwalKurikulum1';
import PengajarJournalView from './JadwalPengajar';

export default function JournalsPage() {
  // 💡 Ambil 'role' dan 'isLoading' langsung dari central AuthContext
  const { role, isLoading } = useAuth(); 

  // 🛡️ Pencegahan: Tunggu sampai session Supabase selesai loading 
  // agar tidak salah merender halaman pengajar saat status belum terverifikasi
  if (isLoading) {
    return (
      <div className="text-center py-20 text-xs font-bold text-outline animate-pulse">
        Memverifikasi otoritas akun...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-surface-container-lowest">
      {role === 'kurikulum' ? (
        <KurikulumJournalView />
      ) : (
        <PengajarJournalView />
      )}
    </div>
  );
}