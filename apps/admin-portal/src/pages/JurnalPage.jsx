import { useAuth } from '../context/AuthContext'; // 💡 Sesuaikan path menuju AuthContext Anda
import Kurikulum from './JurnalKurikulum';
import Pengajar from './JurnalPengajar';

export default function DashboardPage() {
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
        <Kurikulum />
      ) : (
        <Pengajar />
      )}
    </div>
  );
}