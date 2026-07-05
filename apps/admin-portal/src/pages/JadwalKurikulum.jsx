// src/pages/admin-portal/KurikulumJournalView.jsx
import { useState, useEffect, useMemo } from 'react';
import { kurikulumService } from '../services/kurikulumService'; 
import toast from 'react-hot-toast';

export default function KurikulumJournalView({ onBack }) {
  // ─── 1. GRUP DEKLARASI STATE ───
  const [activeDivision, setActiveDivision] = useState('caberawit');
  const [selectedLevel, setSelectedLevel] = useState('Kelas 1');
  
  // Database Buffer States
  const [savedTargetsList, setSavedTargetsList] = useState([]);
  const [masterMaterials, setMasterMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Engine
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState(null);
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [modalMode, setModalMode] = useState('materi');
  const [focusedField, setFocusedField] = useState({ sessionId: null, matIdx: null });

  // State Rentang Tanggal (Muda-Mudi)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Struktur State Form Multi-Sesi Terstandarisasi Baru
  const [sessions, setSessions] = useState([
    { id: 1, kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }
  ]);

  // ─── 2. GRUP MEMO GENERATOR & UTILITIES ───
  const currentAutoMonth = useMemo(() => {
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const sekarang = new Date();
    return `${namaBulan[sekarang.getMonth()]} ${sekarang.getFullYear()}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentAutoMonth);

  const dynamicMonthsList = useMemo(() => {
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const list = [];
    const sekarang = new Date();

    for (let i = -2; i <= 2; i++) {
      const masaDepan = new Date(sekarang.getFullYear(), sekarang.getMonth() + i, 1);
      list.push(`${namaBulan[masaDepan.getMonth()]} ${masaDepan.getFullYear()}`);
    }
    return list;
  }, []);

  const levelsCaberawit = ['PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const levelsMudaMudi = ['Pra Remaja', 'Remaja', 'Pra Nikah'];

  const monthMap = useMemo(() => ({
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  }), []);

  const calendarDays = useMemo(() => {
    const [monthName, yearStr] = selectedMonth.split(' ');
    const year = parseInt(yearStr, 10) || 2026;
    const monthIndex = monthMap[monthName] ?? 5;
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) cells.push(day);
    return cells;
  }, [selectedMonth, monthMap]);

  const getDayName = (day) => {
    if (!day) return '';
    const [monthName, yearStr] = selectedMonth.split(' ');
    const year = parseInt(yearStr, 10) || 2026;
    const monthIndex = monthMap[monthName] ?? 5;
    const dateObj = new Date(year, monthIndex, day);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dateObj.getDay()];
  };

  const indexedCaberawitTargets = useMemo(() => {
    const map = {};
    savedTargetsList.forEach(item => {
      if (item.target_hari) map[`day-${item.target_hari}`] = item;
    });
    return map;
  }, [savedTargetsList]);

  // ─── 3. GRUP LIFECYCLE EFFECT (API FETCHING) ───
  const loadInitialDatabasePayload = async () => {
    setIsPageLoading(true);
    try {
      const [targets, masterList, kategoriList] = await Promise.all([
        kurikulumService.getSavedTargets(activeDivision, selectedLevel, selectedMonth),
        kurikulumService.getMasterMaterials(),
        kurikulumService.getKategoriList() 
      ]);
      setSavedTargetsList(targets);
      setMasterMaterials(masterList);
      setCategories(kategoriList);
    } catch (err) {
      console.error(err.message);
      toast.error("Gagal sinkronisasi pangkalan data Supabase.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadInitialDatabasePayload();
  }, [activeDivision, selectedLevel, selectedMonth]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.dispatchEvent(new CustomEvent('hide-bottom-nav', { detail: true }));
    } else {
      document.body.style.overflow = 'unset';
      window.dispatchEvent(new CustomEvent('hide-bottom-nav', { detail: false }));
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.dispatchEvent(new CustomEvent('hide-bottom-nav', { detail: false }));
    };
  }, [isModalOpen]);

  // ─── 4. LOGIKA MANIPULASI FORM DATA ───
  const addSession = () => setSessions([...sessions, { id: Date.now(), kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }]);
  const removeSession = (id) => sessions.length > 1 && setSessions(sessions.filter(s => s.id !== id));
  const handleCategoryChange = (id, val) => setSessions(sessions.map(s => s.id === id ? { ...s, kategori: val } : s));
  const addMaterialField = (sId) => setSessions(sessions.map(s => s.id === sId ? { ...s, materials: [...s.materials, { materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] } : s));
  const removeMaterialField = (sId, mIdx) => setSessions(sessions.map(s => s.id === sId && s.materials.length > 1 ? { ...s, materials: s.materials.filter((_, idx) => idx !== mIdx) } : s));
  
  const handleMaterialTextChange = (sId, mIdx, val) => {
    setSessions(sessions.map(s => {
      if (s.id === sId) {
        const updated = [...s.materials];
        updated[mIdx] = { ...updated[mIdx], materi_id: '', nama_materi: val };
        return { ...s, materials: updated };
      }
      return s;
    }));
  };

  // 💡 UPDATE: Mengakomodasi nilai tipe baru 'halaman', 'ayat', atau 'hadist' secara spesifik
  const handleMaterialTypeChange = (sId, mIdx, val) => {
    setSessions(sessions.map(s => {
      if (s.id === sId) {
        const updated = [...s.materials];
        updated[mIdx] = { 
          ...updated[mIdx], 
          tipe_pelacakan: val,
          target_awal: 1,
          target_akhir: (val === 'halaman' || val === 'ayat' || val === 'hadist') ? 1 : 100
        };
        return { ...s, materials: updated };
      }
      return s;
    }));
  };

  const handleMaterialNumChange = (sId, mIdx, field, val) => {
    setSessions(sessions.map(s => {
      if (s.id === sId) {
        const updated = [...s.materials];
        updated[mIdx] = { ...updated[mIdx], [field]: parseInt(val, 10) || 0 };
        return { ...s, materials: updated };
      }
      return s;
    }));
  };

  const handleSelectSuggestedMaterial = (sId, mIdx, selectedItem) => {
    setSessions(sessions.map(s => {
      if (s.id === sId) {
        const updated = [...s.materials];
        updated[mIdx] = { 
          materi_id: selectedItem.id, 
          nama_materi: selectedItem.nama_materi,
          tipe_pelacakan: selectedItem.tipe_pelacakan || 'halaman',
          target_awal: selectedItem.halaman_mulai || 1,
          target_akhir: selectedItem.halaman_selesai || 1
        };
        return { ...s, materials: updated };
      }
      return s;
    }));
    setFocusedField({ sessionId: null, matIdx: null });
  };

  // ─── 5. TIMERS & OPERASIONAL OPEN CLOSE MODAL ───
  const handleCaberawitDateTap = (day) => {
    if (!day) return;
    setClickedDate(day);
    const existing = indexedCaberawitTargets[`day-${day}`];
    if (existing) {
      setActiveTargetId(existing.id);
      if (existing.is_libur) {
        setModalMode('libur');
        setSessions([{ id: Date.now(), kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }]);
      } else {
        setModalMode('materi');
        setSessions(existing.compiled_sessions);
      }
    } else {
      setActiveTargetId(null);
      setModalMode('materi');
      setSessions([{ id: Date.now(), kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }]);
    }
    setFocusedField({ sessionId: null, matIdx: null });
    setIsModalOpen(true);
  };

  const handleOpenMudaMudiNewRangeModal = () => {
    setActiveTargetId(null); setStartDate(''); setEndDate(''); setModalMode('materi');
    setSessions([{ id: Date.now(), kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }]);
    setFocusedField({ sessionId: null, matIdx: null });
    setIsModalOpen(true);
  };

  const handleEditMudaMudiRangeModal = (targetItem) => {
    setActiveTargetId(targetItem.id);
    setStartDate(targetItem.tanggal_mulai || '');
    setEndDate(targetItem.tanggal_selesai || '');
    if (targetItem.is_libur) {
      setModalMode('libur');
      setSessions([{ id: Date.now(), kategori: '', materials: [{ materi_id: '', nama_materi: '', tipe_pelacakan: 'halaman', target_awal: 1, target_akhir: 1 }] }]);
    } else {
      setModalMode('materi');
      setSessions(targetItem.compiled_sessions);
    }
    setFocusedField({ sessionId: null, matIdx: null });
    setIsModalOpen(true);
  };

  const handleSaveJadwalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Sedang memproses & menerbitkan target kurikulum...");

    const isLiburActive = modalMode === 'libur';

    try {
      let finalCompiledSessions = [];

      if (!isLiburActive) {
        finalCompiledSessions = await Promise.all(sessions.map(async (session) => {
          const resolvedMaterials = await Promise.all(session.materials.map(async (mat) => {
            let finalMatId = mat.materi_id;
            const isRangeType = mat.tipe_pelacakan === 'halaman' || mat.tipe_pelacakan === 'ayat' || mat.tipe_pelacakan === 'hadist';
            
            if (!finalMatId) {
              const newMasterRow = await kurikulumService.insertMasterMaterial({
                kategori: session.kategori,
                nama_materi: mat.nama_materi.trim(),
                jenjang: selectedLevel,
                tipe_pelacakan: mat.tipe_pelacakan,
                halaman_mulai: isRangeType ? (mat.target_awal || 1) : 1,
                halaman_selesai: isRangeType ? (mat.target_akhir || 100) : 100
              });
              finalMatId = newMasterRow.id;
            }

            return { 
              materi_id: finalMatId, 
              nama_materi: mat.nama_materi,
              tipe_pelacakan: mat.tipe_pelacakan,
              target_awal: isRangeType ? parseInt(mat.target_awal, 10) || 1 : 1,
              target_akhir: isRangeType ? parseInt(mat.target_akhir, 10) || 100 : 100
            };
          }));

          return {
            id: session.id,
            kategori: session.kategori,
            materials: resolvedMaterials
          };
        }));
      }

      // 1. 🌟 BERSIHKAN: Jangan inisialisasi properti 'id' dengan null di sini
      const payload = {
        divisi: activeDivision,
        jenjang: selectedLevel,
        periode: selectedMonth,
        target_hari: activeDivision === 'caberawit' ? clickedDate : null,
        tanggal_mulai: activeDivision === 'mudamudi' ? startDate : null,
        tanggal_selesai: activeDivision === 'mudamudi' ? endDate : null,
        is_libur: isLiburActive,
        keterangan_libur: null,
        compiled_sessions: finalCompiledSessions
      };

      let targetIdToUse = activeTargetId;
      
      if (!targetIdToUse) {
        if (activeDivision === 'caberawit') {
          // 2. 🌟 PERBAIKI: Gunakan loose equality (==) untuk mengantisipasi perbedaan tipe data String vs Number
          const duplicateCheck = savedTargetsList.find(item => item.target_hari == clickedDate);
          if (duplicateCheck) targetIdToUse = duplicateCheck.id;
        } else if (activeDivision === 'mudamudi') {
          const duplicateCheck = savedTargetsList.find(item => 
            item.tanggal_mulai === startDate && item.tanggal_selesai === endDate
          );
          if (duplicateCheck) targetIdToUse = duplicateCheck.id;
        }
      }

      // 3. 🌟 HANYA MASUKKAN ID jika targetIdToUse bernilai valid (untuk UPDATE/UPSERT)
      if (targetIdToUse) {
        payload.id = targetIdToUse;
      }

      await kurikulumService.upsertTargetKurikulum(payload);
      toast.success(isLiburActive ? "Hari libur dikunci!" : "Target kurikulum berhasil diterbitkan!", { id: toastId });
      setIsModalOpen(false);
      loadInitialDatabasePayload(); 
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengeksekusi transaksi data.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 relative">
      
      {/* HEADER CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Command Center Kurikulum</h1>
          <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Kelola target pembelajaran generus secara terpusat.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="bg-white border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
          >
            {dynamicMonthsList.map((bulan) => (
              <option key={bulan} value={bulan}>{bulan}</option>
            ))}
          </select>
          {onBack && (
            <button type="button" onClick={onBack} className="px-4 py-2 border border-outline-variant text-xs font-bold rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">Kembali</button>
          )}
        </div>
      </div>

      {/* DIVISI NAVIGATION */}
      <div className="grid grid-cols-2 p-1.5 bg-surface-container-high rounded-2xl max-w-md select-none">
        <button type="button" onClick={() => { setActiveDivision('caberawit'); setSelectedLevel('Kelas 1'); setIsModalOpen(false); }} className={`py-2.5 text-center text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeDivision === 'caberawit' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-sm">child_care</span> Caberawit (PAUD - SD 6)
        </button>
        <button type="button" onClick={() => { setActiveDivision('mudamudi'); setSelectedLevel('Pra Remaja'); setIsModalOpen(false); }} className={`py-2.5 text-center text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeDivision === 'mudamudi' ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-sm">groups</span> Muda-Mudi (Remaja)
        </button>
      </div>

      {/* SUB-JENJANG FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {(activeDivision === 'caberawit' ? levelsCaberawit : levelsMudaMudi).map((lvl) => {
          const isLvlActive = selectedLevel === lvl;
          return (
            <button key={lvl} type="button" onClick={() => setSelectedLevel(lvl)} className={`whitespace-nowrap px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isLvlActive ? activeDivision === 'caberawit' ? 'border-primary bg-primary/10 text-primary font-black scale-105' : 'border-secondary bg-secondary/10 text-secondary font-black scale-105' : 'border-outline-variant/60 text-on-surface-variant bg-white hover:border-primary'}`}>
              {lvl}
            </button>
          );
        })}
      </div>

      {/* VIEW UTAMA */}
      {isPageLoading ? (
        <div className="text-center py-16 text-xs font-bold text-outline animate-pulse">Menghubungkan kueri data Supabase...</div>
      ) : (
        <>
          {/* INTERFACE A: GRID KALENDER CABERAWIT */}
          {activeDivision === 'caberawit' && (
            <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">calendar_month</span> Grid Riil Bulanan: {selectedLevel}</h3>
                <span className="text-[10px] bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-md font-bold">Tap Tanggal Untuk Input Target</span>
              </div>
              <div className="w-full">
                <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-black text-outline uppercase tracking-wider">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="bg-surface-container-lowest/40 rounded-xl border border-dashed border-outline-variant/20 h-20"></div>;
                    
                    const targetData = indexedCaberawitTargets[`day-${day}`];
                    const hasData = !!targetData;
                    const isLibur = hasData && targetData.is_libur;
                    const totalSesi = hasData ? targetData.compiled_sessions.length : 0;

                    return (
                      <button 
                        key={`day-${day}`} type="button" onClick={() => handleCaberawitDateTap(day)} 
                        className={`h-20 border rounded-xl p-2 flex flex-col justify-between text-left transition-all relative group cursor-pointer ${
                          isLibur ? 'border-red-500 bg-red-50/40 shadow-sm' 
                          : hasData ? 'border-green-500 bg-green-50/30 shadow-sm' : 'bg-white border-outline-variant/60 hover:border-primary hover:shadow-sm'
                        }`}
                      >
                        <span className={`text-xs font-black ${isLibur ? 'text-red-700' : hasData ? 'text-green-700' : 'text-on-surface'}`}>{day}</span>
                        {isLibur ? (
                          <div className="w-full text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tight text-center">Libur</div>
                        ) : hasData ? (
                          <span className="text-[9px] font-black bg-green-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tight scale-95 origin-left">{totalSesi} Sesi</span>
                        ) : (
                          <div className="w-full space-y-0.5 pointer-events-none opacity-20">
                            <div className="w-full h-1 bg-outline rounded-sm"></div>
                            <div className="w-full h-1 bg-outline rounded-sm"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INTERFACE B: TIMELINE RENTANG KUSTOM MUDA-MUDI */}
          {activeDivision === 'mudamudi' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center ml-1 select-none">
                <h3 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">date_range</span> Target Rentang Waktu: {selectedLevel}</h3>
                <button type="button" onClick={handleOpenMudaMudiNewRangeModal} className="bg-secondary text-on-secondary font-black text-xs px-4 py-2 rounded-xl shadow-sm hover:bg-secondary-container flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-sm font-bold">add</span> Buat Rentang Tanggal
                </button>
              </div>

              {savedTargetsList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-outline-variant/40 shadow-sm font-bold text-xs text-on-surface-variant">❌ Belum ada target rentang waktu yang dibuat.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedTargetsList.map((item) => (
                    <button 
                      key={item.id} type="button" onClick={() => handleEditMudaMudiRangeModal(item)}
                      className={`rounded-2xl p-5 shadow-sm text-left transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer border ${item.is_libur ? 'border-red-500 bg-red-50/10' : 'border-green-500 bg-green-50/10'}`}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-full"></div>
                      <div>
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${item.is_libur ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                          {item.is_libur ? 'Status: Hari Libur' : `${item.compiled_sessions.length} Kategori Materi`}
                        </span>
                        <h4 className={`text-base font-black mt-2 flex items-center gap-1 ${item.is_libur ? 'text-red-800' : 'text-green-800'}`}>
                          <span className="material-symbols-outlined text-lg">calendar_today</span> {item.tanggal_mulai} s/d {item.tanggal_selesai}
                        </h4>
                      </div>
                      <div className="w-full border-t border-outline-variant/30 mt-4 pt-3 flex justify-between items-center text-[10px] text-outline font-bold">
                        <span>Modifikasi target rentang</span>
                        <span className="material-symbols-outlined text-sm text-outline font-black">edit</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SHEET MODAL ENGINE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-outline-variant/60 shadow-2xl flex flex-col transform transition-all animate-scaleUp mb-0 max-h-[85vh] sm:max-h-[88vh]">
            
            {/* Header Modal */}
            <div className="bg-primary text-on-primary px-4 py-2.5 flex justify-between items-center sticky top-0 z-10 shrink-0">
              <div>
                <span className="text-[9px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedLevel}</span>
                <h4 className="text-sm font-black mt-0.5">
                  {activeDivision === 'caberawit' ? `${getDayName(clickedDate)}, ${clickedDate} ${selectedMonth}` : 'Atur Target Kustom'}
                </h4>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 bg-surface-container-high p-1 mx-4 mt-3 rounded-xl select-none shrink-0 text-xs font-bold">
              <button type="button" onClick={() => setModalMode('materi')} className={`py-1.5 text-center rounded-lg cursor-pointer transition-all ${modalMode === 'materi' ? 'bg-white text-primary font-black shadow-sm' : 'text-on-surface-variant'}`}>📝 Sesi Belajar</button>
              <button type="button" onClick={() => setModalMode('libur')} className={`py-1.5 text-center rounded-lg cursor-pointer transition-all ${modalMode === 'libur' ? 'bg-red-600 text-white font-black shadow-sm' : 'text-on-surface-variant'}`}>🚨 Tandai Libur</button>
            </div>

            {/* Form Input Container */}
            <form onSubmit={handleSaveJadwalSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs font-semibold scrollbar-none">
              
              {/* RENTANG TANGGAL (MUDA-MUDI) */}
              {activeDivision === 'mudamudi' && (
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 space-y-2.5">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-xs">date_range</span> Batas Rentang Waktu</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase text-outline font-bold">Tanggal Mulai</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 bg-white border border-outline-variant rounded-lg px-2 font-bold text-xs" required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase text-outline font-bold">Tanggal Selesai</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-9 bg-white border border-outline-variant rounded-lg px-2 font-bold text-xs" required />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB MODE LIBUR */}
              {modalMode === 'libur' ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center space-y-2 animate-fadeIn py-6">
                  <span className="material-symbols-outlined text-red-600 text-3xl">disabled_by_default</span>
                  <h5 className="text-sm font-black text-red-900 uppercase tracking-wide">Konfirmasi Kunci Hari Libur</h5>
                  <p className="text-xs text-red-700/80 leading-relaxed px-2">Menandai hari libur akan otomatis mengosongkan target materi pembelajaran dan menonaktifkan form absen jurnal pengajar pada tanggal/rentang ini.</p>
                </div>
              ) : (
                /* TAB MODE INPUT MATERI SESI */
                <>
                  <div className="space-y-4">
                    {sessions.map((session, sIdx) => (
                      <div key={session.id || sIdx} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 space-y-3 relative">
                        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">Target Pembelajaran #Sesi {sIdx + 1}</span>
                          {sessions.length > 1 && (
                            <button type="button" onClick={() => removeSession(session.id)} className="text-red-600 hover:text-red-800 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"><span className="material-symbols-outlined text-xs font-black">delete</span> Hapus Sesi</button>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-black text-outline">Kategori Penyampaian</label>
                          <select value={session.kategori} onChange={(e) => handleCategoryChange(session.id, e.target.value)} className="w-full h-8.5 bg-white border border-outline-variant rounded-lg px-2 font-bold text-xs focus:outline-none focus:border-primary cursor-pointer" required>
                            <option value="">-- Pilih Kategori Sesi --</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
                            ))}
                          </select>
                        </div>

                        {/* LIST INPUT MULTI-MATERI */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] uppercase font-black text-outline">Daftar Rincian Target Materi</label>
                            <button type="button" onClick={() => addMaterialField(session.id)} className="text-[10px] font-black text-secondary hover:underline flex items-center gap-0.5 cursor-pointer"><span className="material-symbols-outlined text-xs font-black">add</span> Tambah Materi</button>
                          </div>

                          {session.materials.map((material, mIdx) => {
                            const currentQuery = (material.nama_materi || '').toLowerCase().trim();
                            const suggestions = masterMaterials.filter(item => 
                              item.kategori === session.kategori && 
                              item.jenjang === selectedLevel && 
                              (item.nama_materi || '').toLowerCase().includes(currentQuery)
                            );

                            const isFieldFocused = focusedField.sessionId === session.id && focusedField.matIdx === mIdx;
                            const showDropdown = isFieldFocused && currentQuery.length > 0;
                            
                            // 💡 UPDATE: Menyertakan tipe 'hadist' ke dalam rumpun jenis pelacakan model range numerik
                            const isRangeType = material.tipe_pelacakan === 'halaman' || material.tipe_pelacakan === 'ayat' || material.tipe_pelacakan === 'hadist';

                            return (
                              <div key={mIdx} className="relative p-2.5 bg-white border border-outline-variant/60 rounded-xl space-y-2 animate-fadeIn shadow-2xs">
                                <div className="flex gap-2 items-center">
                                  <span className="text-[10px] text-outline font-mono w-4 shrink-0 text-center">{mIdx + 1}.</span>
                                  
                                  {/* 💡 UPDATE: Menambahkan opsi pelacakan "Hadist" terpisah secara eksplisit */}
                                  <select 
                                    value={material.tipe_pelacakan || 'halaman'}
                                    onChange={(e) => handleMaterialTypeChange(session.id, mIdx, e.target.value)}
                                    className="bg-surface-container-high border border-outline-variant rounded-md px-1 py-1 text-[9px] font-black text-primary focus:outline-none cursor-pointer select-none"
                                  >
                                    <option value="halaman">📖 Halaman</option>
                                    <option value="ayat">🔢 Ayat</option>
                                    <option value="hadist">📜 Hadist</option>
                                    <option value="persentase">％ Persen</option>
                                  </select>

                                  <div className="flex-1 relative">
                                    <input 
                                      type="text" 
                                      value={material.nama_materi} 
                                      onFocus={() => setFocusedField({ sessionId: session.id, matIdx: mIdx })}
                                      onBlur={() => setTimeout(() => setFocusedField({ sessionId: null, matIdx: null }), 200)}
                                      onChange={(e) => handleMaterialTextChange(session.id, mIdx, e.target.value)} 
                                      className={`w-full h-8 bg-white border rounded-md px-2.5 font-bold text-xs focus:outline-none transition-colors ${material.materi_id ? 'border-green-500 bg-green-50/10 text-green-900' : 'border-outline-variant'}`} 
                                      placeholder={session.kategori ? `Ketik nama bahasan kurikulum...` : "Pilih kategori dahulu..."}
                                      disabled={!session.kategori}
                                      required 
                                    />
                                    {material.materi_id && (
                                      <span className="material-symbols-outlined text-xs text-green-600 absolute right-2 top-2.5 font-black pointer-events-none">verified</span>
                                    )}
                                  </div>
                                  {session.materials.length > 1 && (
                                    <button type="button" onClick={() => removeMaterialField(session.id, mIdx)} className="text-outline hover:text-red-600 p-1 cursor-pointer"><span className="material-symbols-outlined text-sm font-black">close</span></button>
                                  )}
                                </div>

                                {/* 💡 UPDATE: Label dinamis pintar mengikuti tipe 'ayat', 'hadist', atau 'halaman' */}
                                {isRangeType && (
                                  <div className="flex items-center gap-3 pl-6 pt-0.5 animate-fadeIn">
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <label className="text-[9px] uppercase text-outline shrink-0 font-black">
                                        {material.tipe_pelacakan === 'ayat' ? 'Ayat Awal:' : material.tipe_pelacakan === 'hadist' ? 'Hadist Awal:' : 'Hal Awal:'}
                                      </label>
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={material.target_awal || ''} 
                                        onChange={(e) => handleMaterialNumChange(session.id, mIdx, 'target_awal', e.target.value)}
                                        className="w-full h-7 bg-surface-container-lowest border border-outline-variant rounded-md px-2 text-xs font-mono font-black focus:outline-none focus:border-primary" 
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <label className="text-[9px] uppercase text-outline shrink-0 font-black">
                                        {material.tipe_pelacakan === 'ayat' ? 'Ayat Akhir:' : material.tipe_pelacakan === 'hadist' ? 'Hadist Akhir:' : 'Hal Akhir:'}
                                      </label>
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={material.target_akhir || ''} 
                                        onChange={(e) => handleMaterialNumChange(session.id, mIdx, 'target_akhir', e.target.value)}
                                        className="w-full h-7 bg-surface-container-lowest border border-outline-variant rounded-md px-2 text-xs font-mono font-black focus:outline-none focus:border-primary" 
                                        required
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* FLOATING DROPDOWN SUGGESTIONS DI DALAM CARD ROW */}
                                {showDropdown && (
                                  <div className="absolute left-6 right-0 bg-white border border-outline-variant shadow-xl rounded-xl z-30 max-h-40 overflow-y-auto mt-1 divide-y divide-outline-variant/40 animate-scaleUp">
                                    {suggestions.length > 0 ? (
                                      suggestions.map((item) => (
                                        <button
                                          key={item.id}
                                          type="button"
                                          onMouseDown={() => handleSelectSuggestedMaterial(session.id, mIdx, item)}
                                          className="w-full px-3 py-2 text-left hover:bg-primary/5 font-bold text-xs text-on-surface flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex flex-col">
                                            <span>{item.nama_materi}</span>
                                            <span className="text-[9px] text-outline font-medium">Jenjang: {item.jenjang} • Tipe: <span className="uppercase text-primary font-black font-mono text-[8px]">{item.tipe_pelacakan}</span> ({item.halaman_mulai}-{item.halaman_selesai})</span>
                                          </div>
                                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black tracking-wide">SILABUS</span>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2.5 text-outline text-[11px] font-semibold flex flex-col gap-1">
                                        <p>✨ "{material.nama_materi}" belum terdaftar di silabus {selectedLevel}.</p>
                                        <span className="text-[9px] text-primary font-black uppercase tracking-wider">⚡ OTOMATIS DIDATA KE MASTER JENJANG SAAT DI-SIMPAN</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={addSession} className="w-full py-2.5 border border-dashed border-primary text-primary hover:bg-primary/5 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm font-bold">add_circle</span> Tambah Sesi Pembelajaran Baru</button>
                </>
              )}

              {/* ACTION FOOTER BUTTONS */}
              <div className="pt-2.5 flex gap-2 border-t border-outline-variant/20 mt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/4 h-9 border border-outline-variant text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-low cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 h-9 rounded-xl font-black shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${modalMode === 'libur' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
                  <span className="material-symbols-outlined text-sm">cloud_done</span> 
                  {isSubmitting ? "Memproses..." : modalMode === 'libur' ? "Kunci Hari Libur" : "Terbitkan Semua Target"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}