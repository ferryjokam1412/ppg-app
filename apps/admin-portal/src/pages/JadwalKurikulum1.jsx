// src/pages/DashboardPage.jsx (atau file DaftarPage Anda)
import { useSearchParams } from 'react-router-dom'; // 💡 1. Tambahkan import ini
import { useAuth } from '../context/AuthContext'; 

import Silabus from './Silabus'; 
import Jadwal from './JadwalKurikulum'; 

export default function DaftarPage() {
  const { isLoading } = useAuth(); 

  // 💡 2. Ambil parameter tab langsung dari URL browser (?tab=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = searchParams.get('tab') || 'silabus'; // Default ke 'silabus' jika kosong

  // Fungsi pembantu untuk mengubah tab sekaligus memperbarui URL browser
  const handleTabChange = (targetTab) => {
    setSearchParams({ tab: targetTab });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-bold text-outline animate-pulse bg-surface-container-lowest">
        Memverifikasi item...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-surface-container-lowest animate-fadeIn flex flex-col">


      {/* 🚀 COMPONENT DISPLAY AREA */}
      <div className="flex-1 p-6">
        {activeSubTab === 'silabus' ? (
          <Silabus />
        ) : (
          <Jadwal />
        )}
      </div>

    </div>
  );
}