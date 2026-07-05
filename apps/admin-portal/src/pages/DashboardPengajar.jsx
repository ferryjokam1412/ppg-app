// src/pages/pengajar-portal/DashboardPengajar.jsx
import { useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardPengajar({ classesList = [], setPageActive }) {
  const { tpqId, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalSantri: 0, jurnalHariIniCount: 0, allJurnalHariIni: [] });

  // Ambil nama asli user dari metadata auth atau profile terikat
  const teacherName = useMemo(() => {
    return user?.user_metadata?.nama_lengkap || user?.email?.split('@')[0] || 'Pengajar';
  }, [user]);

  // Kalender penanggalan dinamis real-time sistem
  const formattedDate = useMemo(() => {
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('id-ID', opsi);
  }, []);

  // Ucapan salam kontekstual otomatis berdasarkan jam handphone
  const dynamicGreeting = useMemo(() => {
    const jam = new Date().getHours();
    if (jam < 11) return 'Selamat Pagi ☀️';
    if (jam < 15) return 'Selamat Siang 🌤️';
    if (jam < 19) return 'Selamat Sore 🌅';
    return 'Selamat Malam 🌙';
  }, []);

  const loadDashboardData = async () => {
    if (!tpqId) return;
    setIsLoading(true);
    try {
      const data = await dashboardService.getTeacherDashboardSummary(tpqId, teacherName);
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status beranda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [tpqId, teacherName]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16 text-xs font-semibold text-on-surface-variant">
      
      {/* 1. WELCOME BANNER PANEL */}
      <div className="bg-primary text-on-primary p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[130px]">
        {/* Ornamen latar belakang elegan */}
        <div className="absolute -right-6 -bottom-6 text-on-primary opacity-10 font-black pointer-events-none select-none">
          <span className="material-symbols-outlined text-[150px]">menu_book</span>
        </div>
        
        <div className="space-y-1 z-10">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary-container/80 bg-white/10 px-2 py-0.5 rounded-md">{dynamicGreeting}</span>
          <h2 className="text-xl font-black tracking-tight pt-1">Ustadz/ah {teacherName}</h2>
          <p className="text-[11px] font-medium opacity-85">Semoga setiap lelah dalam mengajar Al-Qur'an bernilai pahala berlipat ganda.</p>
        </div>

        <div className="text-[10px] font-mono font-bold bg-black/10 w-fit px-3 py-1 rounded-xl mt-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">calendar_today</span> {formattedDate}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-outline animate-pulse">Menyelaraskan dashboard harian...</div>
      ) : (
        <>
          {/* 2. QUICK FLASH STATS CARDS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-outline-variant/60 p-3 rounded-2xl text-center shadow-3xs space-y-1">
              <span className="text-[9px] uppercase font-black text-outline block">Santri TPQ</span>
              <span className="text-lg font-black text-primary font-mono block">{stats.totalSantri}</span>
              <span className="text-[8px] font-medium text-outline block">Anak Aktif</span>
            </div>
            
            <div className="bg-white border border-outline-variant/60 p-3 rounded-2xl text-center shadow-3xs space-y-1">
              <span className="text-[9px] uppercase font-black text-outline block">Jurnal Anda</span>
              <span className="text-lg font-black text-green-700 font-mono block">{stats.jurnalHariIniCount}</span>
              <span className="text-[8px] font-medium text-outline block">Terbit Hari Ini</span>
            </div>

            <div className="bg-white border border-outline-variant/60 p-3 rounded-2xl text-center shadow-3xs space-y-1">
              <span className="text-[9px] uppercase font-black text-outline block">Total Rombel</span>
              <span className="text-lg font-black text-secondary font-mono block">{classesList.length}</span>
              <span className="text-[8px] font-medium text-outline block">Kelompok Rumpun</span>
            </div>
          </div>

          {/* 3. QUICK TOUCH SHORTCUT ACTIONS */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-black text-outline tracking-wider pl-1">Akses Pintas Cepat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Shortcut 1: Portal KBM */}
              <button 
                type="button"
                onClick={() => setPageActive('kelas')} // Mengubah navigasi induk ke halaman Jurnal Kelas
                className="p-4 bg-white border border-outline-variant/60 rounded-2xl text-left flex items-center justify-between gap-3 shadow-3xs hover:border-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface text-sm">Isi Jurnal Kelas</h4>
                    <p className="text-[10px] text-outline font-medium">Input absensi & target capaian harian</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>

              {/* Shortcut 2: Jadwal Kurikulum */}
              <button 
                type="button"
                onClick={() => setPageActive('jadwal')}
                className="p-4 bg-white border border-outline-variant/60 rounded-2xl text-left flex items-center justify-between gap-3 shadow-3xs hover:border-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-xl">calendar_month</span>
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface text-sm">Jadwal Kurikulum</h4>
                    <p className="text-[10px] text-outline font-medium">Lihat plot materi acuan pusat harian</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>

              {/* Shortcut 3: Laporan Bulanan */}
              <button 
                type="button"
                onClick={() => setPageActive('report-bulanan')}
                className="p-4 bg-white border border-outline-variant/60 rounded-2xl text-left flex items-center justify-between gap-3 shadow-3xs hover:border-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100/60 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">insert_chart</span>
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface text-sm">Laporan Bulanan</h4>
                    <p className="text-[10px] text-outline font-medium">Unduh dokumen & statistik rekap kelas</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>

            </div>
          </div>

          {/* 4. LIVE TRACKING AGENDA HARI INI */}
          <div className="bg-white border border-outline-variant/60 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
              <h3 className="text-sm font-black text-on-surface">Manifest Rombel Hari Ini</h3>
              <button onClick={loadDashboardData} className="text-primary hover:underline text-[11px] font-black flex items-center gap-0.5 cursor-pointer">
                <span className="material-symbols-outlined text-xs">refresh</span> Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none pr-0.5">
              {classesList.map((cls) => {
                // Periksa apakah rombel kelas ini sudah memiliki input jurnal hari ini
                const sudahDiisi = stats.allJurnalHariIni.some(j => j.kelas === cls.nama_kelas);

                return (
                  <div key={cls.id} className="p-3 border border-outline-variant/40 bg-surface-container-low/30 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-on-surface">{cls.nama_kelas}</p>
                      <p className="text-[10px] text-outline font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span> 
                        {cls.jam_mulai || '15:30'} - {cls.jam_selesai || '17:00'}
                      </p>
                    </div>
                    
                    {/* INDIKATOR STATUS SETORAN JURNAL */}
                    <div>
                      {sudahDiisi ? (
                        <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-800 text-[10px] font-black rounded-lg flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs font-bold">check_circle</span> Terbit
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-black rounded-lg flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs font-bold">pending</span> Belum Isi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {classesList.length === 0 && (
                <p className="text-center py-6 text-outline italic font-medium">Belum ada rombel dikonfigurasi pada cabang ini.</p>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}