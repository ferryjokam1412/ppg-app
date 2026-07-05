// src/components/PengajarJournalView.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient'; 
import toast from 'react-hot-toast';

export default function PengajarJournalView() {
  const [viewMode, setViewMode] = useState('today'); // 'today' atau 'monthly'
  const [selectedDate, setSelectedDate] = useState(1); // Tanggal kalender terpilih
  const [dbJadwalList, setDbJadwalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Kontrol Dropdown 3 Bulan Terbatas (Hanya untuk Tab Kalender)
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = Bulan Ini, -1 = Kemarin, 1 = Depan

  // Deteksi otomatis waktu riil hari ini (Tahun berjalan 2026)
  const todayObj = useMemo(() => new Date(), []);
  const todayDayNum = todayObj.getDate();

  // Generator nama periode bulan dinamis
  const namaBulanArray = useMemo(() => [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ], []);

  // Format string periode otomatis bulan ini (e.g., "Juni 2026")
  const currentAutoMonth = useMemo(() => {
    return `${namaBulanArray[todayObj.getMonth()]} ${todayObj.getFullYear()}`;
  }, [todayObj, namaBulanArray]);

  // Pilihan opsi dropdown terbatas untuk komponen Kalender
  const dynamicMonthsOptions = useMemo(() => {
    const mKemarin = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1);
    const mDepan = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1);
    return [
      { offset: -1, label: `${namaBulanArray[mKemarin.getMonth()]} ${mKemarin.getFullYear()} (Bulan Kemarin)` },
      { offset: 0, label: `${namaBulanArray[todayObj.getMonth()]} ${todayObj.getFullYear()} (Bulan Ini)` },
      { offset: 1, label: `${namaBulanArray[mDepan.getMonth()]} ${mDepan.getFullYear()} (Bulan Depan)` }
    ];
  }, [todayObj, namaBulanArray]);

  // Menghitung detail hari berdasarkan offset bulan aktif
  const activeMonthDetails = useMemo(() => {
    const targetMonthDate = new Date(todayObj.getFullYear(), todayObj.getMonth() + currentMonthOffset, 1);
    const totalDays = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1).getDay();
    return {
      totalDays,
      firstDayIndex,
      label: `${namaBulanArray[targetMonthDate.getMonth()]} ${targetMonthDate.getFullYear()}`
    };
  }, [todayObj, currentMonthOffset, namaBulanArray]);

  // Menentukan periode aktif yang akan ditembak ke query Supabase
  const activeQueryPeriode = useMemo(() => {
    return viewMode === 'today' ? currentAutoMonth : activeMonthDetails.label;
  }, [viewMode, currentAutoMonth, activeMonthDetails.label]);

  // ─── AMBIL DATA LIVE BERDASARKAN KOLOM PERIODE DARI SUPABASE ───
  useEffect(() => {
    const fetchJadwalKurikulum = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('jadwal_kurikulum')
          .select('*')
          .eq('periode', activeQueryPeriode);

        if (error) throw error;
        setDbJadwalList(data || []);
      } catch (err) {
        console.error(err.message);
        toast.error('Gagal menyinkronkan data kurikulum dari database Supabase.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJadwalKurikulum();
  }, [activeQueryPeriode]);

  // Ekstraksi tingkat jenjang secara dinamis dari database
  const daftarJenjang = useMemo(() => {
    const uniqueJenjang = [...new Set(dbJadwalList.map(item => item.jenjang).filter(Boolean))];
    return uniqueJenjang.length > 0 ? uniqueJenjang.sort() : ['TK', 'SD', 'SMP', 'SMA'];
  }, [dbJadwalList]);

  // Logika pembantu validasi pembagian KBM harian (Caberawit) & mingguan (Muda-mudi)
  const checkJadwalAktif = (item, dayNum) => {
    if (item.divisi === 'caberawit') {
      return item.target_hari === dayNum;
    } else if (item.divisi === 'mudamudi') {
      const targetMonthDate = new Date(todayObj.getFullYear(), todayObj.getMonth() + (viewMode === 'today' ? 0 : currentMonthOffset), dayNum);
      const y = targetMonthDate.getFullYear();
      const m = String(targetMonthDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetMonthDate.getDate()).padStart(2, '0');
      const loopDateStr = `${y}-${m}-${d}`;
      
      if (!item.tanggal_mulai || !item.tanggal_selesai) return false;
      return loopDateStr >= item.tanggal_mulai && loopDateStr <= item.tanggal_selesai;
    }
    return item.target_hari === dayNum;
  };

  // Mengelompokkan target HARI INI global berdasarkan masing-masing jenjang
  const targetHariIniGrouped = useMemo(() => {
    const grouped = {};
    daftarJenjang.forEach(j => {
      grouped[j] = dbJadwalList.find(item => checkJadwalAktif(item, todayDayNum) && item.jenjang === j) || null;
    });
    return grouped;
  }, [dbJadwalList, todayDayNum, daftarJenjang]);

  // Mengelompokkan target KALENDER berdasarkan masing-masing jenjang hasil klik tanggal
  const targetKalenderGrouped = useMemo(() => {
    const grouped = {};
    daftarJenjang.forEach(j => {
      grouped[j] = dbJadwalList.find(item => checkJadwalAktif(item, selectedDate) && item.jenjang === j) || null;
    });
    return grouped;
  }, [dbJadwalList, selectedDate, daftarJenjang]);

  // Generator Data Grid Kalender Bulanan
  const monthlyJurnalData = useMemo(() => {
    return Array.from({ length: activeMonthDetails.totalDays }, (_, i) => {
      const day = i + 1;
      const targetHariTerkait = dbJadwalList.filter(item => checkJadwalAktif(item, day));
      
      const hasAgenda = targetHariTerkait.length > 0;
      const isLibur = targetHariTerkait.some(item => item.is_libur);

      return {
        date: day,
        hasAgenda,
        isMilestone: isLibur
      };
    });
  }, [dbJadwalList, activeMonthDetails, viewMode]);

  // Helper untuk melabeli awalan tipe target secara ramah UI
  const formatTypeLabel = (type) => {
    if (type === 'ayat') return 'Ayat';
    if (type === 'hadist') return 'Hadist';
    return 'Hal';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-12">
      
      {/* HEADER MENU UTAMA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-outline-variant/50 p-5 rounded-2xl gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-primary tracking-tight">Modul Jurnal Kurikulum</h1>
          <p className="text-xs text-on-surface-variant font-medium">Pantau sebaran target harian lintas jenjang pengajar PPG.</p>
        </div>
        
        {/* Toggle Navigasi Utama */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 select-none w-full sm:w-auto">
          <button 
            type="button" onClick={() => setViewMode('today')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${viewMode === 'today' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-sm">today</span> Hari Ini
          </button>
          <button 
            type="button" onClick={() => setViewMode('monthly')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${viewMode === 'monthly' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span> Kalender Jurnal
          </button>
        </div>
      </div>

      {/* INTERFACE PANEL A: TARGET GLOBAL HARI INI */}
      {viewMode === 'today' && (
        <div className="space-y-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
            <h2 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">dashboard</span> Sebaran Target KBM Hari Ini (Semua Jenjang)
            </h2>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
              Periode {currentAutoMonth} • Hari Ke-{todayDayNum}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-xs font-bold text-outline animate-pulse">Menghubungkan ke pangkalan data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {daftarJenjang.map((jenjang) => {
                const targetData = targetHariIniGrouped[jenjang];
                
                return (
                  <div key={jenjang} className="bg-white border border-outline-variant/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                        <span className="text-xs font-black text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">layers</span> Jenjang {jenjang}
                        </span>
                        {targetData && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${targetData.divisi === 'caberawit' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {targetData.divisi === 'caberawit' ? 'Harian' : 'Mingguan'}
                          </span>
                        )}
                      </div>

                      {!targetData ? (
                        <p className="text-xs font-bold text-outline/50 italic py-6 text-center">Tidak ada plotting materi mengajar.</p>
                      ) : targetData.is_libur ? (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-900 text-xs font-semibold">
                          <p className="font-black flex items-center gap-1"><span className="material-symbols-outlined text-sm">event_busy</span> KBM LIBUR</p>
                          <p className="text-[11px] opacity-85 mt-0.5">{targetData.keterangan_libur || 'Diliburkan Pusat'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-outline">
                            {targetData.divisi === 'caberawit' ? `Target KBM: Hari ke-${targetData.target_hari}` : `Rentang Tanggal: ${targetData.tanggal_mulai} s/d ${targetData.tanggal_selesai}`}
                          </div>

                          {/* MAPPING DATA COMPILED_SESSIONS JSONB */}
                          <div className="space-y-2 pt-1">
                            {targetData.compiled_sessions?.map((sesi, idx) => (
                              <div key={idx} className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 space-y-1">
                                <p className="text-[9px] font-black bg-secondary text-on-secondary w-fit px-1.5 rounded uppercase tracking-wide">{sesi.kategori || `Sesi ${idx + 1}`}</p>
                                {sesi.materials?.map((mat, mIdx) => {
                                  const isRangeType = mat.tipe_pelacakan === 'halaman' || mat.tipe_pelacakan === 'ayat' || mat.tipe_pelacakan === 'hadist';
                                  
                                  return (
                                    <div key={mIdx} className="text-xs font-bold text-on-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pl-1 py-1 border-b border-outline-variant/10 last:border-none">
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-primary text-[10px]">▶</span> {mat.nama_materi}
                                      </span>
                                      
                                      <div className="flex items-center gap-2 self-start sm:self-auto pl-4 sm:pl-0">
                                        {/* 💡 UPDATE: Validasi range dinamis mendukung 3 opsi terpisah */}
                                        {isRangeType && (
                                          <span className="text-[10px] bg-surface-container-high text-outline px-2 py-0.5 rounded font-mono">
                                            🎯 Target: {formatTypeLabel(mat.tipe_pelacakan)} {mat.target_awal || 1} - {mat.target_akhir || 1}
                                          </span>
                                        )}
                                        
                                        {mat.tipe_pelacakan === 'persentase' ? (
                                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-mono">Capaian: {mat.capaian_terakhir || 0}%</span>
                                        ) : mat.capaian_terakhir ? (
                                          <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-mono">Idx Riil: {mat.capaian_terakhir}</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INTERFACE PANEL B: JURNAL KALENDER BULANAN */}
      {viewMode === 'monthly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start animate-scaleUp">
          
          {/* SISI KIRI: WIDGET BOX KALENDER UTAMA */}
          <div className="lg:col-span-2 bg-white border border-outline-variant/60 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/20 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-on-surface">Peta Target Bulanan Jurnal</h3>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Klik pada angka tanggal untuk membedah target semua jenjang di sisi kanan.</p>
              </div>

              {/* DROPDOWN BULAN */}
              <div className="relative w-full sm:w-auto shrink-0">
                <select
                  value={currentMonthOffset}
                  onChange={(e) => { setCurrentMonthOffset(parseInt(e.target.value, 10)); setSelectedDate(1); }}
                  className="w-full bg-surface border border-outline-variant rounded-xl py-2 pl-3 pr-10 text-xs font-black text-primary focus:outline-none appearance-none cursor-pointer"
                >
                  {dynamicMonthsOptions.map(opt => (
                    <option key={opt.offset} value={opt.offset}>{opt.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary text-lg">arrow_drop_down</span>
              </div>
            </div>

            {/* Label Hari */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-outline uppercase tracking-wider pb-1">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Hari Angka Kalender */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: activeMonthDetails.firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square bg-surface-container-low/10 rounded-xl border border-dashed border-outline-variant/10" />
              ))}

              {monthlyJurnalData.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square border rounded-2xl p-2 flex flex-col justify-between text-left transition-all relative cursor-pointer group ${
                    selectedDate === day.date
                      ? 'bg-primary border-primary text-on-primary font-black shadow-md scale-105'
                      : day.isMilestone
                      ? 'bg-red-50/60 border-red-200 text-red-900'
                      : day.hasAgenda
                      ? 'bg-green-50/40 border-green-200 text-green-900'
                      : 'bg-white border-outline-variant/40 text-on-surface'
                  }`}
                >
                  <span className={`text-xs font-black ${selectedDate === day.date ? 'text-on-primary' : 'group-hover:text-primary'}`}>{day.date}</span>
                  {day.hasAgenda && (
                    <span className={`w-1.5 h-1.5 rounded-full self-end ${selectedDate === day.date ? 'bg-white' : day.isMilestone ? 'bg-red-600' : 'bg-green-600'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* SISI KANAN: PANEL DETAIL DI SEBELAH TANGGAL */}
          <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 min-h-[400px] lg:h-full lg:sticky lg:top-6">
            <div className="space-y-4">
              <div className="border-b border-outline-variant/30 pb-2">
                <h4 className="text-[10px] font-black text-outline uppercase tracking-wider">Detail Jurnal Lintas Jenjang</h4>
                <p className="text-sm font-black text-primary mt-0.5">Tanggal {selectedDate} {activeMonthDetails.label}</p>
              </div>

              {/* Bedah Target Seluruh Jenjang Terpilih */}
              <div className="space-y-3.5 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                {daftarJenjang.map((jnj) => {
                  const targetCal = targetKalenderGrouped[jnj];

                  return (
                    <div key={jnj} className="bg-surface-container-low/40 border border-outline-variant/30 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                        <span className="text-xs font-black text-on-surface flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Jenjang {jnj}
                        </span>
                        {targetCal && (
                          <span className="text-[8px] font-black uppercase bg-surface-container-high px-1.5 py-0.5 rounded text-outline">
                            {targetCal.divisi === 'caberawit' ? 'Harian' : 'Mingguan'}
                          </span>
                        )}
                      </div>
                      
                      {!targetCal ? (
                        <p className="text-[11px] text-outline/50 italic font-medium pt-0.5">Belum ada plotting materi.</p>
                      ) : targetCal.is_libur ? (
                        <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 pt-0.5">
                          <span className="material-symbols-outlined text-xs">event_busy</span> Libur: {targetCal.keterangan_libur || 'Pusat'}
                        </p>
                      ) : (
                        <div className="space-y-2 pt-0.5">
                          {targetCal.compiled_sessions?.map((sesi, sIdx) => (
                            <div key={sIdx} className="text-[11px] font-semibold text-on-surface-variant leading-tight space-y-1">
                              <span className="font-black text-secondary text-[8px] uppercase bg-secondary-container/10 px-1.5 py-0.5 rounded tracking-wide block w-fit">
                                {sesi.kategori || 'Sesi'}
                              </span>
                              <div className="pl-1 space-y-1.5 text-on-surface font-bold">
                                {sesi.materials?.map((m, mIdx) => {
                                  const isRangeCalType = m.tipe_pelacakan === 'halaman' || m.tipe_pelacakan === 'ayat' || m.tipe_pelacakan === 'hadist';

                                  return (
                                    <div key={mIdx} className="flex flex-col gap-0.5 border-b border-outline-variant/10 last:border-none pb-1 last:pb-0">
                                      <div className="flex items-center justify-between gap-1 leading-tight">
                                        <p className="flex items-center gap-1"><span className="text-primary text-[8px]">•</span>{m.nama_materi}</p>
                                        {m.tipe_pelacakan === 'persentase' ? (
                                          <span className="text-[9px] font-normal text-green-700 bg-green-50 px-1 rounded">{m.capaian_terakhir || 0}%</span>
                                        ) : m.capaian_terakhir ? (
                                          <span className="text-[9px] font-normal text-orange-700 bg-orange-50 px-1 rounded">Idx: {m.capaian_terakhir}</span>
                                        ) : null}
                                      </div>
                                      
                                      {/* 💡 UPDATE: Rendering informasi target harian/bulanan berdasarkan pemisahan tipe pelacakan */}
                                      {isRangeCalType && (
                                        <span className="text-[9px] text-outline font-medium pl-3 block">
                                          🎯 Target: {formatTypeLabel(m.tipe_pelacakan)} {m.target_awal || 1} - {m.target_akhir || 1}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/20">
              <span className="text-[10px] text-outline font-semibold block text-center">
                Sinkronisasi kolom periode tabel pusat kurikulum.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}