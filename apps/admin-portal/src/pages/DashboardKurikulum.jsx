// src/pages/pengajar-portal/DashboardKurikulum.jsx
import { useState, useEffect, useMemo } from 'react';
import { curriculumDashboardService } from '../services/curriculumDashboardService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardKurikulum({ classesList = [], setPageActive }) {
  const { tpqId, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totalSantri: 0, totalPengajar: 0, totalRombel: 0, jurnalHariIni: [] });

  const adminName = useMemo(() => {
    return user?.user_metadata?.nama_lengkap || 'Tim Kurikulum';
  }, [user]);

  const loadDashboardAnalytics = async () => {
    if (!tpqId) return;
    setIsLoading(true);
    try {
      const data = await curriculumDashboardService.getCurriculumDashboardSummary(tpqId);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui matriks pusat kurikulum.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardAnalytics();
  }, [tpqId]);

  // Hitung persentase kepatuhan setoran laporan KBM dari seluruh pengajar hari ini
  const submissionRate = useMemo(() => {
    const total = classesList.length || analytics.totalRombel;
    if (total === 0) return 0;
    return Math.round((analytics.jurnalHariIni.length / total) * 100);
  }, [analytics, classesList]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16 text-xs font-semibold text-on-surface-variant">
      
      {/* 1. MANAGEMENT HEADER BANNER */}
      <div className="bg-secondary text-on-secondary p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between min-h-[130px]">
        <div className="absolute -right-6 -bottom-6 text-on-secondary opacity-10 font-black pointer-events-none select-none">
          <span className="material-symbols-outlined text-[150px]">analytics</span>
        </div>
        
        <div className="space-y-1 z-10">
          <span className="text-[10px] uppercase font-black tracking-widest text-secondary-container/80 bg-white/10 px-2 py-0.5 rounded-md">Control Panel Pusat</span>
          <h2 className="text-xl font-black tracking-tight pt-1">Ahlan Wa Sahlan, {adminName}</h2>
          <p className="text-[11px] font-medium opacity-85">Sistem Monitoring Terpadu: Pantau kualitas kurikulum dan administrasi pengajar cabang harian.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-outline animate-pulse">Menghitung agregasi radar operasional...</div>
      ) : (
        <>
          {/* 2. CORE MASTER DATA STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-outline-variant/60 p-4 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-lg">groups</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Total Santri</span><span className="text-base font-black text-on-surface font-mono">{analytics.totalSantri} Anak</span></div>
            </div>
            <div className="bg-white border border-outline-variant/60 p-4 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-lg">person_title</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Guru Pengampu</span><span className="text-base font-black text-orange-700 font-mono">{analytics.totalPengajar} Ustadz</span></div>
            </div>
            <div className="bg-white border border-outline-variant/60 p-4 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-lg">schema</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Rombel Aktif</span><span className="text-base font-black text-blue-700 font-mono">{analytics.totalRombel} Kelas</span></div>
            </div>
            <div className="bg-white border border-outline-variant/60 p-4 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-lg">task_alt</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Kepatuhan Jurnal</span><span className="text-base font-black text-green-700 font-mono">{submissionRate}% Setor</span></div>
            </div>
          </div>

          {/* 3. GRID HUB SHORTCUT ADMINISTRATIF */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-black text-outline tracking-wider pl-1">Pusat Kendali Sistem</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              
              <button onClick={() => setPageActive('database-santri')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">child_care</span></div>
                <span className="font-black text-on-surface tracking-tight block">Master Santri</span>
              </button>

              <button onClick={() => setPageActive('database-pengajar')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">badge</span></div>
                <span className="font-black text-on-surface tracking-tight block">Data Pengajar</span>
              </button>

              <button onClick={() => setPageActive('silabus')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">menu_book</span></div>
                <span className="font-black text-on-surface tracking-tight block">Bank Silabus</span>
              </button>

              <button onClick={() => setPageActive('audit-jurnal')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">rate_review</span></div>
                <span className="font-black text-on-surface tracking-tight block">Audit Jurnal</span>
              </button>

              <button onClick={() => setPageActive('jadwal-plot')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">calendar_apps</span></div>
                <span className="font-black text-on-surface tracking-tight block">Plot Jadwal</span>
              </button>

              <button onClick={() => setPageActive('input-berita')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">newspaper</span></div>
                <span className="font-black text-on-surface tracking-tight block">Berita Kegiatan</span>
              </button>

              <button onClick={() => setPageActive('report-bulanan')} className="p-4 bg-white border border-outline-variant/50 rounded-2xl shadow-3xs hover:border-secondary transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-xl">insert_chart</span></div>
                <span className="font-black text-on-surface tracking-tight block">Rekap Bulanan</span>
              </button>

              <button onClick={loadDashboardAnalytics} className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-3xs flex flex-col items-center justify-center gap-2 cursor-pointer text-outline hover:text-on-surface transition-colors">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-3xs"><span className="material-symbols-outlined text-xl">refresh</span></div>
                <span className="font-black tracking-tight block">Segarkan Data</span>
              </button>

            </div>
          </div>

          {/* 4. RADAR LIVE MONITORING SETORAN JURNAL GURU HARI INI */}
          <div className="bg-white border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-on-surface">Radar Kepatuhan Mengajar Hari Ini</h3>
              <p className="text-[11px] text-outline font-medium mt-0.5">Memantau secara langsung rombel mana saja yang telah mengunci absensi dan materi sore ini.</p>
            </div>

            <div className="divide-y divide-outline-variant/20 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
              {classesList.map((cls) => {
                // Cari data kecocokan apakah rombel ini sudah menyetor jurnal
                const jurnalTerkait = analytics.jurnalHariIni.find(j => j.kelas === cls.nama_kelas);

                return (
                  <div key={cls.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-0.5 max-w-[65%]">
                      <p className="text-sm font-black text-on-surface">{cls.nama_kelas} <span className="text-[10px] text-outline font-normal">({cls.divisi})</span></p>
                      <p className="text-[11px] font-medium text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {jurnalTerkait ? `Ustadz/ah: ${jurnalTerkait.pengajar}` : 'Belum Ada Guru Pengampu'}
                      </p>
                    </div>

                    <div>
                      {jurnalTerkait ? (
                        <div className="text-right space-y-1">
                          <span className="px-2 py-0.5 bg-green-50 text-green-800 border border-green-200 text-[9px] font-black rounded font-mono">DONE</span>
                          <span className="text-[10px] text-outline font-bold font-mono block">Capaian: {jurnalTerkait.capaian_pct}%</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 text-[9px] font-black rounded flex items-center gap-0.5 animate-pulse">
                          <span className="material-symbols-outlined text-xs">warning</span> MISSING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {classesList.length === 0 && (
                <p className="text-center py-8 text-outline italic font-medium">Tidak ditemukan data konfigurasi rombel harian cabang.</p>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}