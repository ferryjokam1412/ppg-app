// src/pages/pengajar-portal/JournalFormModal.jsx
import { useState, useMemo, useEffect } from 'react';
import { jurnalKelasService } from '../services/jurnalKelasService';
import toast from 'react-hot-toast';

export default function JournalFormModal({
  isOpen,
  onClose,
  tpqId,
  classesList,
  studentsList,
  pengajarList,
  selectedClassForJournal,
  setSelectedClassForJournal,
  currentAutoMonth,
  todayDayNum,
  syncLogHistoriJurnal,
  calculateDuration
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jadwalHariIni, setJadwalHariIni] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [capaianMateriState, setCapaianMateriState] = useState({});
  const [catatanKelas, setCatatanKelas] = useState('');
  const [journalFormJamMulai, setJournalFormJamMulai] = useState('15:30');
  const [journalFormJamSelesai, setJournalFormJamSelesai] = useState('17:00');
  const [selectedPengajars, setSelectedPengajars] = useState([]);
  const [materialCheckedState, setMaterialCheckedState] = useState({});
  const [materiMandiriList, setMateriMandiriList] = useState([]);

  const santriForAbsensi = useMemo(() => studentsList.filter(s => s.classId === selectedClassForJournal), [studentsList, selectedClassForJournal]);

  // 💡 KOREKSI 1: Inisialisasi absensi hanya berjalan jika data santri tersedia & tidak menghapus state materi lain
  useEffect(() => {
    if (isOpen && santriForAbsensi.length > 0) {
      const initAbsen = {};
      santriForAbsensi.forEach(s => { initAbsen[s.id] = 'H'; });
      setAttendanceState(initAbsen);
    }
  }, [selectedClassForJournal, isOpen, santriForAbsensi]);

  // 💡 KOREKSI 2: Pembersihan form hanya dipicu sekali saat modal dibuka/ganti kelas secara aman
  useEffect(() => {
    if (isOpen) {
      setMaterialCheckedState({});
      setCapaianMateriState({});
      setMateriMandiriList([]);
      setCatatanKelas('');
    }
  }, [selectedClassForJournal, isOpen]);

  const liveAttendancePercentage = useMemo(() => {
    const total = Object.keys(attendanceState).length;
    if (total === 0) return 0;
    return Math.round((Object.values(attendanceState).filter(v => v === 'H').length / total) * 100);
  }, [attendanceState]);

  useEffect(() => {
    const loadJadwalKurikulumSesuaiKelas = async () => {
      if (!isOpen || !selectedClassForJournal) return;
      
      const kelasTerpilih = classesList.find(c => c.id === selectedClassForJournal);
      if (!kelasTerpilih || !kelasTerpilih.jenjang_list || kelasTerpilih.jenjang_list.length === 0) {
        setJadwalHariIni([]);
        return;
      }

      try {
        const rows = await jurnalKelasService.getJadwalHariIni(currentAutoMonth, todayDayNum, kelasTerpilih.divisi, kelasTerpilih.jenjang_list);
        const aggregatedMap = {};

        (rows || []).forEach(row => {
          const sessions = Array.isArray(row.compiled_sessions)
            ? row.compiled_sessions
            : (typeof row.compiled_sessions === 'string' ? JSON.parse(row.compiled_sessions) : []);

          sessions.forEach(sess => {
            const key = sess.kategori || 'UMUM';
            if (!aggregatedMap[key]) {
              aggregatedMap[key] = { kategori: key, materials: [] };
            }
            if (Array.isArray(sess.materials)) {
              aggregatedMap[key].materials.push(...sess.materials);
            }
          });
        });

        setJadwalHariIni(Object.values(aggregatedMap));
      } catch (err) {
        console.error('Gagal memproses pengelompokan silabus:', err);
      }
    };

    loadJadwalKurikulumSesuaiKelas();
  }, [selectedClassForJournal, isOpen, currentAutoMonth, todayDayNum, classesList]);

  const handleTogglePengajarCheckbox = (namaGuru) => {
    if (selectedPengajars.includes(namaGuru)) {
      setSelectedPengajars(prev => prev.filter(p => p !== namaGuru));
    } else {
      setSelectedPengajars(prev => [...prev, namaGuru]);
    }
  };

  const handleAddMateriMandiri = () => {
    setMateriMandiriList(prev => [
      ...prev,
      { id: Date.now() + Math.random(), nama_materi: '', tipe_pelacakan: 'halaman', capaian_awal: 1, capaian_akhir: 1, capaian_pct: 0, is_checked: false }
    ]);
  };

  const handleUpdateMateriMandiri = (id, field, value) => {
    setMateriMandiriList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveMateriMandiri = (id) => {
    setMateriMandiriList(prev => prev.filter(item => item.id !== id));
  };

  const handleSyncJournalTimeWithClass = () => {
    const targetClass = classesList.find(c => c.id === selectedClassForJournal);
    if (targetClass && targetClass.jam_mulai && targetClass.jam_selesai) {
      setJournalFormJamMulai(targetClass.jam_mulai);
      setJournalFormJamSelesai(targetClass.jam_selesai);
      toast.success('Jam berhasil disesuaikan dengan jadwal rombel kelas!');
    } else {
      toast.error('Rombel kelas ini belum memiliki konfigurasi jam operasional.');
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (selectedPengajars.length === 0 || !tpqId) {
      toast.error('Wajib memilih minimal satu guru pengampu harian!');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Sedang menerbitkan laporan KBM...");

    let totalMateriHariIni = 0;
    let totalPersentaseSum = 0;
    const silabusRowsTmp = [];

    try {
      // === KOREKSI 3: KALKULASI ULANG DAN PARSING DIRECT VALUE ANTI-LAG ===
      jadwalHariIni.forEach(sess => {
        sess.materials?.forEach(mat => {
          totalMateriHariIni++;
          const isRangeType = ['halaman', 'ayat', 'hadist'].includes(mat.tipe_pelacakan);
          
          if (isRangeType) {
            const awalRaw = capaianMateriState[`${mat.materi_id}_awal`];
            const akhirRaw = capaianMateriState[`${mat.materi_id}_akhir`];

            const awal = awalRaw !== undefined && awalRaw !== '' ? parseInt(awalRaw, 10) : (mat.target_awal ?? 1);
            const akhir = akhirRaw !== undefined && akhirRaw !== '' ? parseInt(akhirRaw, 10) : (mat.target_akhir ?? 1);

            const targetSpan = Math.max(1, (mat.target_akhir - mat.target_awal) + 1);
            const capaianSpan = Math.max(0, (akhir - awal) + 1);
            const rangePct = Math.min(100, Math.round((capaianSpan / targetSpan) * 100));
            
            totalPersentaseSum += rangePct;

            silabusRowsTmp.push({
              tpq_id: tpqId,
              kelas_id: selectedClassForJournal,
              materi_id: mat.materi_id,
              nama_materi: mat.nama_materi,
              kategori: sess.kategori,
              tipe_pelacakan: mat.tipe_pelacakan,
              capaian_awal: awal,
              capaian_akhir: akhir
            });
          } else {
            const isChecked = !!materialCheckedState[mat.materi_id];
            const nilaiCapaian = isChecked ? (parseInt(capaianMateriState[mat.materi_id], 10) || 0) : 0;
            
            totalPersentaseSum += nilaiCapaian;

            if (isChecked) {
              silabusRowsTmp.push({
                tpq_id: tpqId,
                kelas_id: selectedClassForJournal,
                materi_id: mat.materi_id,
                nama_materi: mat.nama_materi,
                kategori: sess.kategori,
                tipe_pelacakan: mat.tipe_pelacakan,
                capaian_pct: nilaiCapaian
              });
            }
          }
        });
      });

      const totalKalkulasiCapaian = totalMateriHariIni > 0 
        ? Math.round(totalPersentaseSum / totalMateriHariIni) 
        : 100;

      // KOREKSI 4: Kalkulasi murni kehadiran langsung dari daftar murid aktif saat klik kirim
      const totalSantri = santriForAbsensi.length;
      let totalHadirCount = 0;
      santriForAbsensi.forEach(s => {
        if ((attendanceState[s.id] || 'H') === 'H') totalHadirCount++;
      });
      const finalHadirPct = totalSantri > 0 ? Math.round((totalHadirCount / totalSantri) * 100) : 0;

      const rekapMandiri = materiMandiriList.map(m => {
        return m.tipe_pelacakan === 'persentase'
          ? `- [Mandiri] ${m.nama_materi}: ${m.is_checked ? m.capaian_pct : 0}% selesai`
          : `- [Mandiri] ${m.nama_materi}: target ${m.tipe_pelacakan} (${m.capaian_awal} s/d ${m.capaian_akhir})`;
      }).join('\n');

      const gabunganCatatan = rekapMandiri ? `${catatanKelas.trim()}\n\n*MATERI MANDIRI TAMBAHAN*:\n${rekapMandiri}` : catatanKelas.trim();

      const jurnalPayload = {
        tpq_id: tpqId,
        tanggal: new Date().toISOString().split('T')[0],
        pengajar: selectedPengajars.join(', '),
        kelas: classesList.find(c => c.id === selectedClassForJournal)?.nama_kelas || '',
        hadir_pct: finalHadirPct, // Menggunakan kalkulasi presisi anti 0%
        capaian_pct: totalKalkulasiCapaian, // Menggunakan kalkulasi rata-rata murni
        jam_mulai: journalFormJamMulai,
        jam_selesai: journalFormJamSelesai,
        detail: gabunganCatatan,
        absensi: [] 
      };

      const newJurnal = await jurnalKelasService.insertJurnalKelas(jurnalPayload);
      const insertedJurnalId = newJurnal.id;

      // 2. BULK INSERT DATA ABSENSI
      const absensiRows = santriForAbsensi.map(s => {
        const statusCode = attendanceState[s.id] || 'H'; 
        let statusLabel = 'Alfa';
        if (statusCode === 'H') statusLabel = 'Hadir';
        if (statusCode === 'I') statusLabel = 'Izin';
        if (statusCode === 'S') statusLabel = 'Sakit';
        return { jurnal_id: insertedJurnalId, santri_id: s.id, status: statusLabel };
      });

      if (absensiRows.length > 0) {
        await jurnalKelasService.insertBulkAbsensiSantri(absensiRows);
      }

      // 3. BULK INSERT DATA CAPAIAN SILABUS
      if (silabusRowsTmp.length > 0) {
        const finalSilabusRows = silabusRowsTmp.map(r => ({ ...r, jurnal_id: insertedJurnalId }));
        await jurnalKelasService.insertBulkCapaianSilabus(finalSilabusRows);
      }

      toast.success('Seluruh data Jurnal KBM, Absensi, dan Capaian berhasil disimpan!', { id: toastId });
      onClose();
      syncLogHistoriJurnal();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan berkas laporan.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-surface-container-lowest flex flex-col animate-fadeIn md:p-4 sm:bg-black/40 sm:backdrop-blur-xs sm:items-center sm:justify-center">
      <div className="bg-white w-full h-full md:h-auto md:max-w-3xl md:rounded-3xl shadow-2xl flex flex-col transform transition-all animate-scaleUp overflow-hidden max-h-[95vh]">
        <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0 font-black sticky top-0 z-10"><span className="text-sm font-black flex items-center gap-2"><span className="material-symbols-outlined text-base">edit_note</span> Form Penerbitan Jurnal Kelas</span><button type="button" onClick={onClose} className="material-symbols-outlined text-base cursor-pointer">close</button></div>
        <form onSubmit={handleJournalSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs font-semibold scrollbar-none">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AREA MULTI-SELECT GURU PENGAJAR */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black text-outline">Pengajar Pengampu Harian</label>
              <div className="border border-outline-variant/60 rounded-xl p-2 bg-white max-h-28 overflow-y-auto grid grid-cols-1 gap-1.5 scrollbar-none">
                {pengajarList.map(p => {
                  const isChecked = selectedPengajars.includes(p.nama);
                  return (
                    <label key={p.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${isChecked ? 'bg-primary/5 border-primary text-primary font-black' : 'bg-surface-container-low/40'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleTogglePengajarCheckbox(p.nama)} className="accent-primary w-3.5 h-3.5" />
                      <span>{p.nama}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* PILIH ROMBEL KELAS TERINTEGRASI INFORMASI JENJANG */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black text-outline">Rombel Kelompok Belajar</label>
              <select value={selectedClassForJournal} onChange={(e) => setSelectedClassForJournal(e.target.value)} className="h-10 bg-white border border-outline-variant/60 rounded-xl px-2.5 font-bold outline-none focus:border-primary w-full">
                {classesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nama_kelas} ({c.jenjang_list?.join(', ') || 'Semua Jenjang'})
                  </option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2 bg-primary/5 p-2 rounded-xl text-center">
                <div><span className="text-[9px] text-outline block font-bold">PREVIEW ABSEN</span><span className="text-xs font-black text-primary font-mono">{liveAttendancePercentage}%</span></div>
                <div><span className="text-[9px] text-outline block font-bold">PRESENSI KBM</span><span className="text-xs font-black text-secondary font-mono">100% Ready</span></div>
              </div>
            </div>
          </div>

          {/* INPUT TIME PELAKSANAAN KBM */}
          <div className="bg-surface-container-low p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 w-24">
                <label className="text-[10px] uppercase font-black text-outline">Jam Mulai KBM</label>
                <input type="time" value={journalFormJamMulai} onChange={(e) => setJournalFormJamMulai(e.target.value)} className="h-8 border rounded-lg px-2 bg-white font-mono font-bold text-center outline-none focus:border-primary" required />
              </div>
              <span className="text-outline font-bold mt-4">s/d</span>
              <div className="flex flex-col gap-1 w-24">
                <label className="text-[10px] uppercase font-black text-outline">Jam Selesai KBM</label>
                <input type="time" value={journalFormJamSelesai} onChange={(e) => setJournalFormJamSelesai(e.target.value)} className="h-8 border rounded-lg px-2 bg-white font-mono font-bold text-center outline-none focus:border-primary" required />
              </div>
              <div className="flex flex-col gap-1 pl-2">
                <span className="text-[9px] text-outline font-medium block">Total Durasi:</span>
                <span className="font-mono font-black text-secondary">{calculateDuration(journalFormJamMulai, journalFormJamSelesai)}</span>
              </div>
            </div>
            
            <button type="button" onClick={handleSyncJournalTimeWithClass} className="h-9 border border-secondary text-secondary hover:bg-secondary/5 px-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-sm">schedule_send</span> Sesuai Jadwal Rombel
            </button>
          </div>

          {/* AREA UTAMA PRESENSI & MATERI (GRID RESPOSIF ASLI) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
            
            {/* SEKSI PRESENSI MANIFES */}
            <div className="lg:col-span-2 border rounded-2xl p-3.5 space-y-3"><span className="text-[10px] font-black text-primary uppercase tracking-wider block border-b pb-1">Presensi Santri</span>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 scrollbar-none">
                {santriForAbsensi.map((s, idx) => (
                  <div key={s.id} className="p-2 bg-surface-container-low/50 border rounded-xl space-y-1"><p className="font-black text-on-surface truncate">{idx + 1}. {s.name || s.nama_lengkap}</p>
                    <div className="grid grid-cols-4 gap-1 text-[9px] font-black text-center">{['H', 'I', 'S', 'A'].map((st) => (<button key={st} type="button" onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: st }))} className={`py-0.5 rounded border transition-all ${attendanceState[s.id] === st ? 'bg-primary text-on-primary border-transparent font-bold' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}`}>{st === 'H' ? 'Hadir' : st === 'I' ? 'Izin' : st === 'S' ? 'Sakit' : 'Alfa'}</button>))}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* SEKSI CAPAIAN TARGET SILABUS (KURIKULUM HARI INI) */}
            <div className="lg:col-span-3 border rounded-2xl p-3.5 space-y-4"><span className="text-[10px] font-black text-secondary uppercase tracking-wider block border-b pb-1">Target Plot Silabus Kurikulum</span>
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 scrollbar-none">
                {jadwalHariIni.length === 0 ? <p className="text-center py-6 italic text-outline">Tidak ada target kurikulum ter-plot harian.</p> : (
                  jadwalHariIni.map((sess, sIdx) => (
                    <div key={sIdx} className="bg-surface-container-low p-3 rounded-xl space-y-2.5">
                      <span className="text-[9px] font-black bg-secondary text-on-secondary px-1.5 rounded uppercase block w-fit">{sess.kategori}</span>
                      
                      {sess.materials?.map(mat => {
                        const isMatChecked = !!materialCheckedState[mat.materi_id];
                        const isRangeType = ['halaman', 'ayat', 'hadist'].includes(mat.tipe_pelacakan);

                        return (
                          <div key={mat.materi_id} className="bg-white p-3 rounded-xl border space-y-2.5 shadow-2xs">
                            <h5 className="font-black text-on-surface text-xs">{mat.nama_materi}</h5>
                            
                            {isRangeType ? (
                              <div className="space-y-2 bg-surface-container-low/30 p-2 rounded-lg border">
                                <p className="text-[10px] font-black text-primary uppercase">
                                  Pelacakan: {mat.tipe_pelacakan === 'ayat' ? '🔢 Ayat Al-Qur\'an' : mat.tipe_pelacakan === 'hadist' ? '📜 Nomor Hadist' : '📖 Halaman Buku/Kitab'}
                                </p>
                                {/* 💡 KOREKSI 5: Menggunakan Controlled Component Fallback aman anti-reset target */}
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div>
                                    <span className="text-outline font-medium block mb-0.5">Mulai ({mat.tipe_pelacakan})</span>
                                    <input 
                                      type="number" 
                                      value={capaianMateriState[`${mat.materi_id}_awal`] !== undefined ? capaianMateriState[`${mat.materi_id}_awal`] : (mat.target_awal ?? '')} 
                                      placeholder="Awal" 
                                      onChange={(e) => setCapaianMateriState(prev => ({ ...prev, [`${mat.materi_id}_awal`]: e.target.value }))} 
                                      className="w-full h-8 border rounded-lg px-2 font-mono font-black text-center bg-white" 
                                    />
                                  </div>
                                  <div>
                                    <span className="text-outline font-medium block mb-0.5">Sampai ({mat.tipe_pelacakan})</span>
                                    <input 
                                      type="number" 
                                      value={capaianMateriState[`${mat.materi_id}_akhir`] !== undefined ? capaianMateriState[`${mat.materi_id}_akhir`] : (mat.target_akhir ?? '')} 
                                      placeholder="Akhir" 
                                      onChange={(e) => setCapaianMateriState(prev => ({ ...prev, [`${mat.materi_id}_akhir`]: e.target.value }))} 
                                      className="w-full h-8 border rounded-lg px-2 font-mono font-black text-center bg-white" 
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 bg-surface-container-low/40 p-2.5 rounded-lg border">
                                <input type="checkbox" checked={isMatChecked} onChange={(e) => setMaterialCheckedState(prev => ({ ...prev, [mat.materi_id]: e.target.checked }))} className="accent-primary w-4 h-4 cursor-pointer" />
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="number" min="0" max="100" placeholder="0" disabled={!isMatChecked} value={capaianMateriState[mat.materi_id] || ''} onChange={(e) => setCapaianMateriState(prev => ({ ...prev, [mat.materi_id]: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) }))} className="w-16 h-8 border rounded-lg px-2 font-mono font-black text-center disabled:bg-surface-container-highest disabled:opacity-50 bg-white" />
                                  <span className="text-[11px] font-black text-on-surface-variant">% Target Selesai Diajarkan</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* AREA KONTROL PENAMBAHAN MATERI MANDIRI */}
              <div className="border border-dashed border-outline-variant rounded-2xl p-3 bg-surface-container-low/20 space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">auto_awesome</span> Materi Mandiri Tambahan</span>
                  <button type="button" onClick={handleAddMateriMandiri} className="h-7 bg-primary text-on-primary text-[10px] font-black px-2.5 rounded-lg flex items-center gap-0.5 cursor-pointer shadow-2xs"><span className="material-symbols-outlined text-xs">add</span> Tambah Materi</button>
                </div>

                {materiMandiriList.length === 0 ? (
                  <p className="text-[10px] text-outline text-center py-2 italic font-medium">Tidak ada materi kustom tambahan hari ini.</p>
                ) : (
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-0.5 scrollbar-none">
                    {materiMandiriList.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-xl border border-outline-variant/50 space-y-2.5 shadow-3xs relative group">
                        <button type="button" onClick={() => handleRemoveMateriMandiri(item.id)} className="absolute top-2 right-2 text-outline hover:text-red-600 material-symbols-outlined text-sm cursor-pointer transition-colors">delete</button>
                        
                        <div className="w-[90%] flex flex-col gap-0.5">
                          <label className="text-[9px] uppercase font-black text-outline">Nama Bahasan Mandiri</label>
                          <input type="text" placeholder="Masukkan nama judul pembahasan kustom..." value={item.nama_materi} onChange={(e) => handleUpdateMateriMandiri(item.id, 'nama_materi', e.target.value)} className="h-8 border rounded-lg px-2 font-bold bg-white text-xs outline-none focus:border-primary" required />
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-[10px]">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] uppercase font-black text-outline">Metode Pelacakan</label>
                            <select value={item.tipe_pelacakan} onChange={(e) => handleUpdateMateriMandiri(item.id, 'tipe_pelacakan', e.target.value)} className="h-8 border rounded-lg bg-white px-1.5 font-bold outline-none cursor-pointer">
                              <option value="halaman">📖 Halaman Buku/Kitab</option>
                              <option value="ayat">🔢 Ayat Al-Qur'an</option>
                              <option value="hadist">📜 Nomor Hadist</option>
                              <option value="persentase">％ Persentase (%)</option>
                            </select>
                          </div>
                        </div>

                        {item.tipe_pelacakan === 'persentase' ? (
                          <div className="flex items-center gap-2 bg-surface-container-low/40 p-2 rounded-lg border">
                            <input type="checkbox" checked={item.is_checked} onChange={(e) => handleUpdateMateriMandiri(item.id, 'is_checked', e.target.checked)} className="accent-primary w-4 h-4 cursor-pointer" />
                            <input type="number" min="0" max="100" placeholder="0" disabled={!item.is_checked} value={item.capaian_pct || ''} onChange={(e) => handleUpdateMateriMandiri(item.id, 'capaian_pct', Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))} className="w-14 h-7 border rounded px-1.5 font-mono font-black text-center disabled:opacity-50" />
                            <span className="text-outline font-bold text-[10px]">% Berhasil Disampaikan</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 bg-surface-container-low/40 p-2 rounded-lg border text-[10px]">
                            <div>
                              <span className="text-outline font-medium block mb-0.5">Awal ({item.tipe_pelacakan})</span>
                              <input type="number" value={item.capaian_awal} onChange={(e) => handleUpdateMateriMandiri(item.id, 'capaian_awal', parseInt(e.target.value, 10) || 1)} className="w-full h-7 border rounded px-2 font-mono font-black text-center bg-white" />
                            </div>
                            <div>
                              <span className="text-outline font-medium block mb-0.5">Akhir ({item.tipe_pelacakan})</span>
                              <input type="number" value={item.capaian_akhir} onChange={(e) => handleUpdateMateriMandiri(item.id, 'capaian_akhir', parseInt(e.target.value, 10) || 1)} className="w-full h-7 border rounded px-2 font-mono font-black text-center bg-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-2xl border"><label className="text-[10px] uppercase font-black text-outline tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">rate_review</span> Catatan / Laporan Kejadian Kelas</label>
            <textarea value={catatanKelas} onChange={(e) => setCatatanKelas(e.target.value)} className="w-full min-h-[85px] bg-white border rounded-xl p-3 outline-none focus:border-primary" placeholder="Tulis kendala atau rekapitulasi KBM mengajar..." required />
          </div>
          
          <div className="pt-3 border-t flex gap-2 justify-end"><button type="button" onClick={onClose} className="px-5 h-10 border rounded-xl font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="px-6 h-10 bg-primary text-on-primary font-black rounded-xl shadow-md">{isSubmitting ? 'Mengunggah...' : 'Kirim Laporan'}</button></div>
        </form>
      </div>
    </div>
  );
}