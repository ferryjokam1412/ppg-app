// src/pages/admin-portal/KurikulumJournalGlobalView.jsx
import { useState, useEffect, useMemo } from 'react';
import { kurikulumGlobalService } from '../services/kurikulumGlobalService';
import toast from 'react-hot-toast';

// 💡 HELPER: Cetak tanggal riil ke format standar database YYYY-MM-DD
const getFormattedDate = (dateObject) => {
  const y = dateObject.getFullYear();
  const m = String(dateObject.getMonth() + 1).padStart(2, '0');
  const d = String(dateObject.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const JENJANG_OPTIONS = ['Semua Jenjang', 'PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Pra Remaja', 'Remaja', 'Pra Nikah'];

export default function KurikulumJournalGlobalView({ onBack }) {
  // ─── 1. STATE MANAGEMENT CONTROL ───
  const [journalLogs, setJournalLogs] = useState([]);
  const [tpqList, setTpqList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter Operasional
  const [filterTpq, setFilterTpq] = useState('all');
  const [filterJenjang, setFilterJenjang] = useState('Semua Jenjang');

  // 9. STATE RENTANG WAKTU FILTER LOG JURNAL
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Kurangi 7 hari untuk seminggu ke belakang
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format aman: YYYY-MM-DD
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); // Hari ini
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format aman: YYYY-MM-DD
  });

  // State Detail Modal Popup
  const [selectedDetails, setSelectedDetails] = useState(null);

  // ─── 2. AMBIL DATA VIA SERVICE LAYER + CLIENT MAPPING ───
  const loadGlobalJournalData = async () => {
    // Pengaman tambahan: Jika user mengosongkan input kalender, jangan tembak kueri ke Supabase
    if (!startDate || !endDate) {
      return; 
    }

    setIsLoading(true);
    try {
      const [journals, tpqs, allClasses] = await Promise.all([
        kurikulumGlobalService.getGlobalJournals(startDate, endDate),
        kurikulumGlobalService.getTpqList(),
        kurikulumGlobalService.getAllMasterKelas()
      ]);

      const mappedJournals = (journals || []).map(log => {
        const matchingClass = allClasses.find(c => 
          c.nama_kelas === log.kelas && 
          String(c.tpq_id) === String(log.tpq_id)
        );
        return {
          ...log,
          jenjang_list: matchingClass ? matchingClass.jenjang_list : []
        };
      });

      setJournalLogs(mappedJournals);
      setTpqList(tpqs);
    } catch (err) {
      console.error('Error loading global journal system:', err.message);
      toast.error('Gagal menyinkronkan data kueri dari server pusat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalJournalData();
  }, [startDate, endDate]);

  // Lock scroll background saat modal detail terbuka
  useEffect(() => {
    document.body.style.overflow = selectedDetails ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedDetails]);

  // ─── 3. LOGIKA FILTER HIBRIDA AKURAT ───
  const filteredJournals = useMemo(() => {
    return journalLogs.filter(log => {
      const matchTpq = filterTpq === 'all' || String(log.tpq_id) === String(filterTpq);
      const listJenjangRiel = log.jenjang_list || [];
      const matchJenjang = filterJenjang === 'Semua Jenjang' || listJenjangRiel.includes(filterJenjang);
      return matchTpq && matchJenjang;
    });
  }, [journalLogs, filterTpq, filterJenjang]);

  const metrics = useMemo(() => {
    if (filteredJournals.length === 0) return { avgHadir: 0, totalKelas: 0 };
    const totalHadir = filteredJournals.reduce((acc, curr) => acc + (curr.hadir_pct || 0), 0);
    return {
      avgHadir: Math.round(totalHadir / filteredJournals.length),
      totalKelas: filteredJournals.length
    };
  }, [filteredJournals]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16">
      
      {/* AREA HEADER */}
      <div className="bg-white border border-outline-variant/60 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Audit Jurnal KBM Global</h1>
          <p className="text-xs text-on-surface-variant font-medium">Hak Akses Kurikulum Pusat: Periksa sebaran materi, target ketercapaian, dan manifes absensi santri.</p>
        </div>
        {onBack && (
          <button type="button" onClick={onBack} className="self-start md:self-auto px-4 py-2 border border-outline-variant text-xs font-bold rounded-xl hover:bg-surface-container-low cursor-pointer transition-colors">Kembali</button>
        )}
      </div>

      {/* METRICS DASHBOARD CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-primary/5 border border-primary/10 rounded-3xl p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-outline block">Rata Presensi Kehadiran</span>
            <span className="text-xl font-black text-primary font-mono">{metrics.avgHadir}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-3 sm:pt-0 sm:pl-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-2xl">co_present</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-outline block">Total Laporan KBM Terkirim</span>
            <span className="text-xl font-black text-secondary font-mono">{metrics.totalKelas} Jurnal</span>
          </div>
        </div>
        <div className="text-xs font-bold text-on-surface-variant flex items-center justify-start sm:justify-end border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-3 sm:pt-0 sm:pl-4">
          <span className="bg-white/80 border px-3 py-1.5 rounded-xl text-[11px]">⚡ Sinkronisasi Multi-Branch Aktif</span>
        </div>
      </div>

      {/* CONTROL PANEL FILTERS */}
      <div className="bg-white border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
        <p className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
          <span className="material-symbols-outlined text-sm">tune</span> Filter Parameter Monitoring
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold font-mono">
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-outline uppercase font-sans">Mulai Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 h-10 focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-outline uppercase font-sans">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 h-10 focus:outline-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-outline uppercase font-sans">Cabang TPQ</label>
            <select value={filterTpq} onChange={(e) => setFilterTpq(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-2 h-10 focus:outline-none font-sans font-bold text-xs cursor-pointer">
              <option value="all">🌍 Semua TPQ Cabang</option>
              {tpqList.map(t => (
                <option key={t.id} value={t.id}>🏛 {t.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-outline uppercase font-sans">Kategori Jenjang</label>
            <select value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-2 h-10 focus:outline-none font-sans font-bold text-xs cursor-pointer">
              {JENJANG_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* RENDER UTAMA LIST LOG JURNAL */}
      {isLoading ? (
        <div className="text-center py-20 text-xs font-bold text-outline animate-pulse">Menghubungkan pusat data log jurnal Supabase...</div>
      ) : filteredJournals.length === 0 ? (
        <div className="text-center py-16 bg-white border border-outline-variant/40 rounded-3xl shadow-xs text-xs text-on-surface-variant font-bold">
          📭 Tidak ditemukan arsip jurnal pengajaran yang sesuai dengan kriteria filter aktif.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredJournals.map((log) => (
            <div 
              key={log.id} 
              onClick={() => setSelectedDetails(log)} 
              className="border border-outline-variant/50 rounded-2xl p-4 bg-white hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer shadow-3xs group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] bg-surface-container-high px-2.5 py-0.5 rounded-md font-mono font-bold text-outline">📅 {log.tanggal}</span>
                  <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-0.5 rounded-md">🏛 {log.tpq?.nama || `TPQ ID: ${log.tpq_id}`}</span>
                  <span className="text-xs font-black text-secondary bg-secondary/5 px-2.5 py-0.5 rounded-md">👥 {log.kelas}</span>
                  
                  {log.jenjang_list?.map(badge => (
                    <span key={badge} className="text-[9px] font-black bg-orange-50 text-orange-800 border border-orange-200/60 px-2 py-0.5 rounded-md font-sans uppercase tracking-tight shadow-3xs">
                      {badge}
                    </span>
                  ))}
                  {(!log.jenjang_list || log.jenjang_list.length === 0) && (
                    <span className="text-[9px] font-medium bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md italic">
                      Umum / Tanpa Jenjang
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-black text-on-surface">
                  Guru Pengajar: <span className="font-semibold text-on-surface-variant">{log.pengajar}</span>
                </p>

                <div className="text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-xl border border-dashed border-outline-variant/40 whitespace-pre-line line-clamp-3">
                  {log.detail || 'Tidak ada rincian laporan materi.'}
                </div>

                {log.jam_mulai && (
                  <p className="text-[11px] font-mono text-outline font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs font-bold">schedule</span> Durasi Belajar: {log.jam_mulai} - {log.jam_selesai}
                  </p>
                )}
              </div>

              <div className="flex md:flex-col gap-2 shrink-0 self-start md:self-center">
                <div className="px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-center min-w-[75px]">
                  <span className="text-[8px] uppercase block font-black text-green-700/70 tracking-wider">Hadir Santri</span>
                  <span className="text-sm font-black font-mono">{log.hadir_pct}%</span>
                </div>
                <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-center min-w-[75px]">
                  <span className="text-[8px] uppercase block font-black text-blue-700/70 tracking-wider">Kurikulum</span>
                  <span className="text-sm font-black font-mono">{log.capaian_pct || 100}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL DETAIL MANIFES */}
      {selectedDetails && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[85vh] overflow-hidden">
            
            <div className="bg-secondary text-on-secondary px-4 py-3.5 flex justify-between items-center shrink-0">
              <span className="text-sm font-black flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">verified_user</span> Audit Jurnal KBM Cabang
              </span>
              <button type="button" onClick={() => setSelectedDetails(null)} className="material-symbols-outlined text-base cursor-pointer hover:scale-110 transition-transform">close</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs font-semibold scrollbar-none pb-8">
              
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high/60 p-3 rounded-xl text-center font-mono">
                <div className="border-r border-outline-variant/40">
                  <p className="text-[9px] text-outline font-bold uppercase">Kehadiran Kelas</p>
                  <p className="text-base font-black text-green-700">{selectedDetails.hadir_pct}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-outline font-bold uppercase">Skala Capaian</p>
                  <p className="text-base font-black text-blue-700">{selectedDetails.capaian_pct || 100}%</p>
                </div>
              </div>

              <div className="space-y-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 text-on-surface">
                <p>🏢 <span className="font-bold">TPQ Pengirim:</span> {selectedDetails.tpq?.nama || `ID Cabang ${selectedDetails.tpq_id}`}</p>
                <p>📅 <span className="font-bold">Tanggal Kegiatan:</span> {selectedDetails.tanggal}</p>
                <p>🏛 <span className="font-bold">Kelompok Rombel:</span> {selectedDetails.kelas}</p>
                
                <div className="flex flex-wrap gap-1 py-1 items-center">
                  <span className="text-[9px] font-medium text-outline">Cakupan Jenjang Rombel:</span>
                  {selectedDetails.jenjang_list?.map(badge => (
                    <span key={badge} className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-md font-black uppercase">{badge}</span>
                  ))}
                </div>

                <p>🧔 <span className="font-bold">Guru Pengajar:</span> {selectedDetails.pengajar}</p>
                {selectedDetails.jam_mulai && <p>⏱ <span className="font-bold">Waktu Operasional:</span> {selectedDetails.jam_mulai} - {selectedDetails.jam_selesai}</p>}
                
                <div className="mt-2.5 pt-2.5 border-t border-dashed border-outline-variant/40">
                  <span className="text-[9px] uppercase font-black text-outline block mb-1">Rangkuman KBM & Informasi Capaian Kurikulum:</span>
                  <p className="text-on-surface-variant font-medium leading-relaxed bg-white p-3 rounded-xl border whitespace-pre-line">{selectedDetails.detail || 'Tidak ada deskripsi tambahan.'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-outline uppercase font-black pl-1 tracking-wider">Manifes Presensi Santri Lapangan</p>
                <div className="max-h-40 overflow-y-auto divide-y border border-outline-variant/40 rounded-xl px-3 bg-white scrollbar-none">
                  {Array.isArray(selectedDetails.absensi) && selectedDetails.absensi.length > 0 ? (
                    selectedDetails.absensi.map((abs, sIdx) => (
                      <div key={sIdx} className="py-2 flex justify-between items-center">
                        <span className="font-bold text-on-surface truncate max-w-[70%]">{sIdx + 1}. {abs.name}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          abs.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                          abs.status === 'Izin' ? 'bg-orange-100 text-orange-800' :
                          abs.status === 'Sakit' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {abs.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-3 text-center italic text-outline/60 text-[11px]">Sistem tidak mendeteksi log manifes absensi individu.</p>
                  )}
                </div>
              </div>

              <button type="button" onClick={() => setSelectedDetails(null)} className="w-full h-10 bg-secondary text-on-secondary font-black rounded-xl cursor-pointer shadow-md mt-2">Selesai Memeriksa</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}