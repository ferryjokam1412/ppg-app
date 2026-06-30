// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import SummaryCard from '../components/ui/SummaryCard';
import toast from 'react-hot-toast';
// 1. IMPORT SUPABASE CLIENT AGAR BISA MENGGUNAKAN REALTIME LISTENER
import { supabase } from '../utils/supabaseClient';

export default function DashboardPage() {
  const { tpqId, namaUser } = useAuth();
  
  // ─── LOGIKA & STATE ───
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeStudents: 0, completedJournals: 0, activeTeachers: 0 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!tpqId) return;

    // Fungsi utama mengambil data dari service
    const loadDashboardData = async () => {
      try {
        // Memanggil Layer Services
        const [metrics, rawActivities] = await Promise.all([
          dashboardService.getMetrics(tpqId),
          dashboardService.getRecentActivities(tpqId)
        ]);

        setStats(metrics);

        // Mapping data aktivitas riil dari database
        if (rawActivities && rawActivities.length > 0) {
          const mappedLogs = rawActivities.map(jurnal => ({
            id: jurnal.id,
            icon: 'edit_document',
            color: 'secondary',
            title: 'Sesi Mengajar Selesai',
            desc: `Berhasil menginput materi "${jurnal.kurikulum?.judul_materi || 'Kajian'}" pada ${jurnal.sesi}.`,
            time: new Date(jurnal.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          }));
          setActivities(mappedLogs);
        } else {
          // Default fallback jika data jurnal masih kosong
          setActivities([
            { id: 1, icon: 'person_add', color: 'primary', title: 'Santri Baru Terdaftar', desc: 'Sistem mencatat penambahan santri ke dalam basis data TPQ Anda.', time: 'Baru saja' },
            { id: 2, icon: 'edit_document', color: 'secondary', title: 'Sinkronisasi Jurnal Selesai', desc: 'Seluruh rekapitulasi data mengajar siap dipantau.', time: 'Hari ini' }
          ]);
        }
      } catch (err) {
        console.error('Error:', err.message);
        toast.error('Gagal mengambil data terbaru.');
      } finally {
        setLoading(false);
      }
    };

    // Jalankan pengambilan data pertama kali saat dashboard dimuat
    loadDashboardData();

    // 2. AKTIFKAN FITUR SUPABASE REALTIME LISTENER
    // Saluran khusus untuk mendengarkan perubahan baris data murni milik tpq_id Anda
    const dashboardRealtimeChannel = supabase
      .channel(`db-dashboard-tpq-${tpqId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'santri', filter: `tpq_id=eq.${tpqId}` },
        (payload) => {
          console.log('Terdeteksi perubahan data santri secara live!', payload);
          loadDashboardData(); // Otomatis hitung ulang metrik bento grid
          toast.success('Total santri diperbarui secara live!', { id: 'rt-santri' });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jurnal_harian', filter: `tpq_id=eq.${tpqId}` },
        (payload) => {
          console.log('Terdeteksi perubahan jurnal harian secara live!', payload);
          loadDashboardData(); // Otomatis re-fetch aktivitas terbaru
        }
      )
      .subscribe();

    // Bersihkan channel listener saat pengguna berpindah menu/unmount halaman
    return () => {
      supabase.removeChannel(dashboardRealtimeChannel);
    };
    
  }, [tpqId]);


  // ─── TAMPILAN UI UTAMA ───
  return (
    <>
      {/* 1. Dashboard Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <h2 className="font-headline-lg-mobile text-3xl md:font-headline-lg md:text-4xl text-primary mb-2 font-bold leading-tight">
            Ringkasan TPQ
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            Selamat datang kembali, <span className="font-bold text-on-surface">{namaUser}</span>. Berikut rekapitulasi performa lembaga Anda.
          </p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-container transition-colors duration-200 shadow-sm cursor-pointer border border-primary/20">
          <span className="material-symbols-outlined text-sm">download</span>
          Export Report
        </button>
      </div>

      {/* 2. Bento Grid 3 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
        <SummaryCard 
          icon="group" 
          color="primary" 
          title="Santri Aktif" 
          value={loading ? '...' : stats.activeStudents.toLocaleString('id-ID')} 
          trend={0} 
        />
        <SummaryCard 
          icon="menu_book" 
          color="secondary" 
          title="Jurnal Terlaksana" 
          value={loading ? '...' : stats.completedJournals.toLocaleString('id-ID')} 
          trend={0} 
        />
        <SummaryCard 
          icon="school" 
          color="tint" 
          title="Tenaga Pengajar" 
          value={loading ? '...' : stats.activeTeachers.toLocaleString('id-ID')} 
          trend={0} 
        />
      </div>

      {/* 3. Detailed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <LocalRecentActivity activities={activities} />
        <LocalTargetCapaian />
      </div>
    </>
  );
}

// ─── SUB UI 1: AKTIVITAS TERBARU (LOKAL) ───
function LocalRecentActivity({ activities }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant ambient-shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant bg-tertiary flex justify-between items-center select-none">
        <h3 className="font-headline-md text-2xl text-on-tertiary font-semibold">Aktivitas Terbaru</h3>
        <button className="text-secondary-fixed text-sm font-semibold hover:underline cursor-pointer">Lihat Semua</button>
      </div>
      <ul className="flex flex-col">
        {activities.map(activity => (
          <li key={activity.id} className="px-6 py-4 border-b border-outline-variant flex items-start gap-4 hover:bg-surface-container-low transition-colors">
            <div className={`w-10 h-10 rounded-full bg-${activity.color}-container text-on-${activity.color}-container flex items-center justify-center shrink-0 shadow-sm`}>
              <span className="material-symbols-outlined text-xl">{activity.icon}</span>
            </div>
            <div className="flex-grow">
              <p className="font-body-md text-sm text-on-background font-bold">{activity.title}</p>
              <p className="font-body-md text-sm text-on-surface-variant mt-1 leading-relaxed">{activity.desc}</p>
              <p className="text-xs text-outline mt-2 font-medium">{activity.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── SUB UI 2: TARGET CAPAIAN & SLOGAN (LOKAL) ───
function LocalTargetCapaian() {
  const targets = [
    { label: 'Ketuntasan Kurikulum Pembelajaran', value: 75, color: 'secondary' },
    { label: 'Grafik Kehadiran Santri Pekan Ini', value: 92, color: 'secondary' }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-xl border border-outline-variant ambient-shadow">
        <h3 className="font-headline-md text-2xl text-primary mb-4 font-semibold">Target Capaian</h3>
        {targets.map(prog => (
          <div key={prog.label} className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-2 text-sm leading-relaxed">
              <span className="font-body-md text-on-surface-variant font-medium">{prog.label}</span>
              <span className="font-body-md text-on-background font-bold">{prog.value}%</span>
            </div>
            <div className="w-full bg-primary-fixed-dim h-2 rounded-full overflow-hidden">
              <div className={`bg-${prog.color}-fixed h-full rounded-full`} style={{ width: `${prog.value}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary p-6 rounded-xl ambient-shadow text-on-primary flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-4xl mb-4 text-secondary-fixed fill-icon">workspace_premium</span>
        <h3 className="font-headline-md text-2xl mb-2 font-semibold leading-tight">Be the Teacher of the World</h3>
        <p className="font-body-md text-sm text-primary-fixed mb-6 leading-relaxed max-w-xs mx-auto">Tinjau instruksi panduan mengajar untuk menjaga kualitas pencapaian santri.</p>
        <button className="w-full bg-white text-primary font-label-md text-sm py-3 rounded-xl hover:bg-surface-variant transition-colors cursor-pointer font-bold border border-white/20 shadow-sm">
          Lihat Panduan Kurikulum
        </button>
      </div>
    </div>
  );
}