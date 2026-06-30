// src/pages/pengajar-portal/ManagementJurnalKelas.jsx
import { useState, useMemo, useEffect } from 'react';
import { jurnalKelasService } from '../services/jurnalKelasService';
import toast from 'react-hot-toast';

export default function ManagementJurnalKelas() {
  const [activeTab, setActiveTab] = useState('kelas'); 
  const [activeDivision, setActiveDivision] = useState('caberawit'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Lists State
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [pengajarList, setPengajarList] = useState([]);
  const [jadwalHariIni, setJadwalHariIni] = useState([]);

  // Option Options Lists Static Data
  const MASTER_JENJANG_OPTIONS = useMemo(() => [
    'PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Pra Remaja', 'Remaja', 'Pra Nikah'
  ], []);

  // State Tab 1: Operational Rombel & Mutasi Lapangan
  const [selectedClassId, setSelectedClassId] = useState('');
  const [mutatingStudent, setMutatingStudent] = useState(null);
  const [targetMutationClass, setTargetMutationClass] = useState('');
  const [targetMutationJenjang, setTargetMutationJenjang] = useState(''); // Override Lapangan
  const [targetMutationDivisi, setTargetMutationDivisi] = useState('');   // Override Lapangan
  
  // State Modal Tambah/Edit Rombel Komposit
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null); 
  const [classFormName, setClassFormName] = useState('');
  const [classFormJenjang, setClassFormJenjang] = useState([]); 

  // State Modal Input Jurnal Baru
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedPengajar, setSelectedPengajar] = useState('');
  const [selectedClassForJournal, setSelectedClassForJournal] = useState('');
  const [attendanceState, setAttendanceState] = useState({});
  const [capaianMateriState, setCapaianMateriState] = useState({});
  const [catatanKelas, setCatatanKelas] = useState('');

  // State Modal Detail Popup Jurnal
  const [selectedHistoryDetails, setSelectedHistoryDetails] = useState(null);

  // State Filter Rentang Waktu
  const [filterStartDate, setFilterStartDate] = useState('2026-06-01');
  const [filterEndDate, setFilterEndDate] = useState('2026-06-30');

  const todayObj = useMemo(() => new Date(), []);
  const todayDayNum = todayObj.getDate();
  const currentAutoMonth = useMemo(() => {
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${namaBulan[todayObj.getMonth()]} ${todayObj.getFullYear()}`;
  }, [todayObj]);

  const loadClassAndStudentsData = async () => {
    setIsLoading(true);
    try {
      const [kelas, santri, pengajar, jadwal] = await Promise.all([
        jurnalKelasService.getClasses(activeDivision), 
        jurnalKelasService.getStudents(),
        jurnalKelasService.getPengajar(),
        jurnalKelasService.getJadwalHariIni(currentAutoMonth, todayDayNum)
      ]);

      setClassesList(kelas);
      setStudentsList(santri);
      setPengajarList(pengajar);
      setJadwalHariIni(jadwal);

      if (kelas.length > 0) {
        setSelectedClassId(kelas[0].id);
        setSelectedClassForJournal(kelas[0].id);
      } else {
        setSelectedClassId('');
        setSelectedClassForJournal('');
      }
      await syncLogHistoriJurnal();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyinkronkan data dari pangkalan Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncLogHistoriJurnal = async () => {
    try {
      const logs = await jurnalKelasService.getHistoryLogs(filterStartDate, filterEndDate);
      setHistoryList(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadClassAndStudentsData(); }, [activeDivision]);
  useEffect(() => { syncLogHistoriJurnal(); }, [filterStartDate, filterEndDate]);

  // Sync Buka Modal Mutasi Lapangan
  useEffect(() => {
    if (mutatingStudent) {
      setTargetMutationClass(mutatingStudent.classId || '');
      setTargetMutationJenjang(mutatingStudent.jenjang || '');
      setTargetMutationDivisi(mutatingStudent.divisi || '');
    }
  }, [mutatingStudent]);

  const allTakenJenjangByOtherClasses = useMemo(() => {
    const taken = [];
    classesList.forEach(cls => {
      if (editingClass && cls.id === editingClass.id) return;
      if (Array.isArray(cls.jenjang_list)) {
        taken.push(...cls.jenjang_list);
      }
    });
    return taken;
  }, [classesList, editingClass]);

  const filteredSantriByClass = useMemo(() => studentsList.filter(s => s.classId === selectedClassId), [studentsList, selectedClassId]);
  const santriForAbsensi = useMemo(() => studentsList.filter(s => s.classId === selectedClassForJournal), [studentsList, selectedClassForJournal]);

  const totalAttendanceAverage = useMemo(() => {
    if (historyList.length === 0) return 0;
    return Math.round(historyList.reduce((acc, curr) => acc + (curr.hadir_pct || 0), 0) / historyList.length);
  }, [historyList]);

  useEffect(() => {
    const initAbsen = {};
    santriForAbsensi.forEach(s => { initAbsen[s.id] = 'H'; });
    setAttendanceState(initAbsen);

    const initCapaian = {};
    jadwalHariIni.forEach(sess => {
      sess.materials?.forEach(mat => { initCapaian[mat.materi_id] = mat.target_awal || 1; });
    });
    setCapaianMateriState(initCapaian);
  }, [selectedClassForJournal, isJournalModalOpen, jadwalHariIni, santriForAbsensi]);

  const liveAttendancePercentage = useMemo(() => {
    const total = Object.keys(attendanceState).length;
    if (total === 0) return 0;
    return Math.round((Object.values(attendanceState).filter(v => v === 'H').length / total) * 100);
  }, [attendanceState]);

  const liveProgressPercentage = useMemo(() => {
    let totalProgress = 0;
    let count = 0;
    jadwalHariIni.forEach(sess => {
      sess.materials?.forEach(mat => {
        count++;
        const currentVal = capaianMateriState[mat.materi_id] || 0;
        if (mat.tipe_pelacakan === 'persentase') {
          totalProgress += Math.min(100, Math.max(0, currentVal));
        } else {
          const totalRange = (mat.target_akhir - mat.target_awal) + 1;
          const currentProgress = (currentVal - mat.target_awal) + 1;
          const pct = totalRange > 0 ? (currentProgress / totalRange) * 100 : 100;
          totalProgress += Math.min(100, Math.max(0, Math.round(pct)));
        }
      });
    });
    return count > 0 ? Math.round(totalProgress / count) : 0;
  }, [capaianMateriState, jadwalHariIni]);

  // Operational Submits
  const handleOpenAddClass = () => {
    setEditingClass(null); setClassFormName(''); setClassFormJenjang([]); setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls, e) => {
    e.stopPropagation(); setEditingClass(cls); setClassFormName(cls.nama_kelas); setClassFormJenjang(cls.jenjang_list || []); setIsClassModalOpen(true);
  };

  const handleToggleJenjangCheckbox = (jenjangName) => {
    if (classFormJenjang.includes(jenjangName)) {
      setClassFormJenjang(prev => prev.filter(item => item !== jenjangName));
    } else {
      setClassFormJenjang(prev => [...prev, jenjangName]);
    }
  };

  const handleSaveClassSubmit = async (e) => {
    e.preventDefault();
    if (!classFormName.trim() || classFormJenjang.length === 0) return;
    try {
      if (editingClass) {
        await jurnalKelasService.updateClass(editingClass.id, classFormName.trim(), classFormJenjang);
        toast.success('Rombel berhasil dikonfigurasi ulang!');
      } else {
        await jurnalKelasService.insertClass(classFormName.trim(), activeDivision, classFormJenjang);
        toast.success('Rombel baru berhasil dibuat!');
      }
      setIsClassModalOpen(false);
      const updatedClasses = await jurnalKelasService.getClasses(activeDivision);
      setClassesList(updatedClasses);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // EKSEKUSI MUTASI DINAMIS DI LAPANGAN (Mengubah ClassId, Jenjang, dan Divisi sekaligus)
  const handleExecuteMutation = async (e) => {
    e.preventDefault();
    if (!targetMutationClass) return;
    try {
      await jurnalKelasService.mutateStudentClass(
        mutatingStudent.id, 
        targetMutationClass, 
        targetMutationJenjang, 
        targetMutationDivisi
      );
      toast.success(`Berhasil memutasikan data lapangan ${mutatingStudent.name}!`);
      setMutatingStudent(null);
      loadClassAndStudentsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPengajar) return;
    setIsSubmitting(true);
    try {
      const payload = {
        tanggal: new Date().toISOString().split('T')[0],
        pengajar: pengajarList.find(p => p.id === selectedPengajar)?.nama || 'Unknown',
        kelas: classesList.find(c => c.id === selectedClassForJournal)?.nama_kelas || '',
        hadir_pct: liveAttendancePercentage,
        capaian_pct: liveProgressPercentage,
        detail: catatanKelas.trim(),
        absensi: santriForAbsensi.map(s => ({
          name: s.name,
          status: attendanceState[s.id] === 'H' ? 'Hadir' : attendanceState[s.id] === 'I' ? 'Izin' : attendanceState[s.id] === 'S' ? 'Sakit' : 'Alfa'
        }))
      };
      await jurnalKelasService.insertJurnalKelas(payload);
      toast.success('Laporan Jurnal KBM Diterbitkan!');
      setIsJournalModalOpen(false); setCatatanKelas(''); syncLogHistoriJurnal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16">
      
      {/* HEADER CONTROL */}
      <div className="bg-white border border-outline-variant/60 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Portal Kendali Kelas</h1>
          <p className="text-xs text-on-surface-variant font-medium">Manajemen kelompok belajar, rombel komposit lintas usia, serta presensi harian terpadu.</p>
        </div>
        <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-xl border max-w-xs shrink-0 select-none text-xs font-black">
          <button type="button" onClick={() => { setActiveDivision('caberawit'); }} className={`py-2 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${activeDivision === 'caberawit' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-sm">child_care</span> Caberawit</button>
          <button type="button" onClick={() => { setActiveDivision('mudamudi'); }} className={`py-2 px-4 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${activeDivision === 'mudamudi' ? 'bg-secondary text-on-secondary shadow-xs' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-sm">groups</span> Muda-Mudi</button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-surface-container-high p-1 rounded-2xl max-w-sm border border-outline-variant/40">
        <button type="button" onClick={() => setActiveTab('kelas')} className={`flex-1 py-3 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'kelas' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-base">schema</span> Penataan Rombel</button>
        <button type="button" onClick={() => setActiveTab('riwayat')} className={`flex-1 py-3 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'riwayat' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-base">history</span> Log Jurnal Harian</button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-xs font-bold text-outline animate-pulse">Menghubungkan kueri via Supabase Service...</div>
      ) : (
        <>
          {/* TAB 1: KELAS & SANTRI */}
          {activeTab === 'kelas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-scaleUp">
              <div className="space-y-3 bg-white border border-outline-variant/60 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-1">
                  <h3 className="text-xs font-black text-outline uppercase tracking-wider">Rombel Aktif ({activeDivision})</h3>
                  <button type="button" onClick={handleOpenAddClass} className="text-xs font-black text-primary hover:underline flex items-center gap-0.5 cursor-pointer"><span className="material-symbols-outlined text-sm font-bold">add_box</span> Tambah Rombel</button>
                </div>
                {classesList.map((cls) => (
                  <button key={cls.id} type="button" onClick={() => setSelectedClassId(cls.id)} className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer relative group ${selectedClassId === cls.id ? 'border-primary bg-primary/5 font-black text-primary' : 'border-outline-variant/60 text-on-surface'}`}>
                    <div className="space-y-1 max-w-[80%]"><p className="text-sm truncate font-black">{cls.nama_kelas}</p>
                      <div className="flex flex-wrap gap-1">{cls.jenjang_list?.map(j => (<span key={j} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">{j}</span>))}</div>
                    </div>
                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold bg-surface-container-highest text-on-surface px-2 py-0.5 rounded-full font-mono">{studentsList.filter(s => s.classId === cls.id).length} S</span><span onClick={(e) => handleOpenEditClass(cls, e)} className="material-symbols-outlined text-base text-outline hover:text-primary transition-colors cursor-pointer p-0.5 rounded">edit</span></div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2 bg-white border border-outline-variant/60 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b bg-surface-container-low/50"><h3 className="text-sm font-black text-on-surface">Daftar Anggota Rombel</h3></div>
                <div className="divide-y text-xs font-semibold">
                  {filteredSantriByClass.length === 0 ? (<p className="text-center py-12 text-outline italic">Rombel ini kosong.</p>) : (
                    filteredSantriByClass.map((santri, idx) => (
                      <div key={santri.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low/30">
                        <div className="flex items-center gap-3"><span className="text-outline font-mono w-4">{idx + 1}.</span>
                          <div>
                            <p className="font-black text-on-surface text-sm">{santri.name}</p>
                            <span className="text-[10px] text-outline font-medium">Asli Sistem: {santri.divisi} ({santri.jenjang || 'Belum diisi tgl lahir'})</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => setMutatingStudent(santri)} className="px-3 h-8 border border-primary/20 text-primary font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer">Mutasi</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOG RIWAYAT */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4 animate-scaleUp">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary/5 border border-primary/10 rounded-3xl p-4 md:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-2xl">analytics</span></div>
                  <div><span className="text-[10px] uppercase font-black text-outline block">Rata Presensi Bulan Ini</span><span className="text-xl font-black text-primary font-mono">{totalAttendanceAverage}%</span></div>
                </div>
                <div className="text-xs font-bold text-on-surface-variant flex items-center sm:justify-end"><span>Sinkronisasi otomatis {historyList.length} berkas laporan.</span></div>
              </div>

              <div className="bg-white border border-outline-variant/60 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-mono">
                  <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="bg-surface-container-low border rounded-xl px-2.5 py-1.5 focus:outline-none" />
                  <span className="text-outline font-sans">s/d</span>
                  <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="bg-surface-container-low border rounded-xl px-2.5 py-1.5 focus:outline-none" />
                </div>
                <button type="button" onClick={() => setIsJournalModalOpen(true)} className="w-full md:w-auto h-11 bg-primary text-on-primary font-black text-xs px-5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"><span className="material-symbols-outlined text-base font-bold">add_circle</span> Input Jurnal Hari Ini</button>
              </div>

              <div className="space-y-3">
                {historyList.map((log) => (
                  <div key={log.id} onClick={() => setSelectedHistoryDetails(log)} className="border rounded-2xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded font-mono font-bold text-outline">📅 {log.tanggal}</span><span className="text-xs font-black text-primary">{log.kelas}</span></div>
                      <p className="text-sm font-black text-on-surface">Guru Pengampu: <span className="font-semibold text-on-surface-variant">{log.pengajar}</span></p>
                      <p className="text-xs text-outline line-clamp-1 italic">"{log.detail || 'Tidak ada catatan.'}"</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-2.5 py-1 bg-green-50 text-green-800 border border-green-200 rounded-lg text-center min-w-[65px]"><span className="text-[8px] uppercase block font-black">Hadir</span><span className="text-xs font-black font-mono">{log.hadir_pct}%</span></div>
                      <div className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-center min-w-[65px]"><span className="text-[8px] uppercase block font-black">Capaian</span><span className="text-xs font-black font-mono">{log.capaian_pct}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: TAMBAH / EDIT ROMBEL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0">
              <h4 className="text-sm font-black">{editingClass ? 'Edit Komposisi Kelas' : 'Deklarasi Kelas Baru'}</h4>
              <button type="button" onClick={() => setIsClassModalOpen(false)} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>
            <form onSubmit={handleSaveClassSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5"><label className="text-[10px] uppercase font-black text-outline">Nama Rombel Kelompok</label><input type="text" value={classFormName} onChange={(e) => setClassFormName(e.target.value)} className="w-full h-10 border rounded-xl px-3 font-bold" placeholder="Contoh: Rombel Gabungan" required /></div>
              <div className="flex flex-col gap-1.5"><label className="text-[10px] uppercase font-black text-outline">Pilih Batas Jenjang Usia</label>
                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-xl border">
                  {(activeDivision === 'mudamudi' ? ['Pra Remaja', 'Remaja', 'Pra Nikah'] : ['PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']).map((jenjang) => {
                    const isAlreadyTaken = allTakenJenjangByOtherClasses.includes(jenjang); const isChecked = classFormJenjang.includes(jenjang);
                    return (
                      <label key={jenjang} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isAlreadyTaken ? 'bg-surface-container-highest/60 opacity-40 cursor-not-allowed' : isChecked ? 'bg-primary/5 border-primary text-primary font-black' : 'bg-white'}`}>
                        <input type="checkbox" checked={isChecked} disabled={isAlreadyTaken} onChange={() => handleToggleJenjangCheckbox(jenjang)} className="accent-primary pointer-events-none" /><span className="text-[11px]">{jenjang}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 border-t pt-3"><button type="button" onClick={() => setIsClassModalOpen(false)} className="w-1/4 h-10 border rounded-xl">Batal</button><button type="submit" className="flex-1 h-10 bg-primary text-on-primary font-black rounded-xl">Simpan Rombel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM INPUT JURNAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[999] bg-surface-container-lowest flex flex-col animate-fadeIn md:p-4 sm:bg-black/40 sm:backdrop-blur-xs sm:items-center sm:justify-center">
          <div className="bg-white w-full h-full md:h-auto md:max-w-3xl md:rounded-3xl shadow-2xl flex flex-col transform transition-all animate-scaleUp overflow-hidden max-h-[95vh]">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0"><span className="text-sm font-black flex items-center gap-2"><span className="material-symbols-outlined text-base">edit_note</span> Form Penerbitan Jurnal</span><button type="button" onClick={() => setIsJournalModalOpen(false)} className="material-symbols-outlined text-base cursor-pointer">close</button></div>
            <form onSubmit={handleJournalSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs font-semibold scrollbar-none">
              <div className="grid grid-cols-2 gap-3 bg-primary/5 p-3 rounded-xl text-center">
                <div><span className="text-[10px] text-outline block font-bold">PREVIEW ABSEN</span><span className="text-sm font-black text-primary font-mono">{liveAttendancePercentage}%</span></div>
                <div><span className="text-[10px] text-outline block font-bold">PREVIEW CAPAIAN</span><span className="text-sm font-black text-secondary font-mono">{liveProgressPercentage}%</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-black text-outline">Pengajar Pengampu</label><select value={selectedPengajar} onChange={(e) => setSelectedPengajar(e.target.value)} className="h-9.5 bg-white border rounded-xl px-2.5 font-bold" required><option value="">-- Pilih Pengajar --</option>{pengajarList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></div>
                <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-black text-outline">Rombel Kelompok</label><select value={selectedClassForJournal} onChange={(e) => setSelectedClassForJournal(e.target.value)} className="h-9.5 bg-white border rounded-xl px-2.5 font-bold">{classesList.map(c => <option key={c.id} value={c.id}>{c.nama_kelas}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                <div className="lg:col-span-2 border rounded-2xl p-3.5 space-y-3"><span className="text-[10px] font-black text-primary uppercase tracking-wider block border-b pb-1">Presensi Santri</span>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 scrollbar-none">
                    {santriForAbsensi.map((s, idx) => (
                      <div key={s.id} className="p-2 bg-surface-container-low/50 border rounded-xl space-y-1"><p className="font-black text-on-surface truncate">{idx + 1}. {s.name}</p>
                        <div className="grid grid-cols-4 gap-1 text-[9px] font-black text-center">{['H', 'I', 'S', 'A'].map((st) => (<button key={st} type="button" onClick={() => setAttendanceState(prev => ({ ...prev, [s.id]: st }))} className={`py-0.5 rounded border ${attendanceState[s.id] === st ? 'bg-primary text-on-primary border-transparent' : 'bg-white text-on-surface-variant'}`}>{st === 'H' ? 'Hadir' : st === 'I' ? 'Izin' : st === 'S' ? 'Sakit' : 'Alfa'}</button>))}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-3 border rounded-2xl p-3.5 space-y-3"><span className="text-[10px] font-black text-secondary uppercase tracking-wider block border-b pb-1">Target Silabus</span>
                  <div className="space-y-3">
                    {jadwalHariIni.length === 0 ? <p className="text-center py-6 italic text-outline">Tidak ada target kurikulum ter-plot harian.</p> : (
                      jadwalHariIni.map((sess, sIdx) => (
                        <div key={sIdx} className="bg-surface-container-low p-3 rounded-xl space-y-2"><span className="text-[9px] font-black bg-secondary text-on-secondary px-1.5 rounded uppercase block w-fit">{sess.kategori}</span>
                          {sess.materials?.map(mat => (
                            <div key={mat.materi_id} className="bg-white p-3 rounded-lg border space-y-2"><div className="flex justify-between items-center"><h5 className="font-black text-on-surface">{mat.nama_materi}</h5></div>
                              {mat.tipe_pelacakan === 'halaman_ayat' ? (
                                <div className="space-y-1"><p className="text-[10px] text-outline">Target: Lembar <span className="text-primary font-black">{mat.target_awal} - {mat.target_akhir}</span></p><input type="number" min={mat.target_awal} value={capaianMateriState[mat.materi_id] || ''} onChange={(e) => setCapaianMateriState(prev => ({ ...prev, [mat.materi_id]: parseInt(e.target.value, 10) || 0 }))} className="w-full h-8 border rounded px-2 font-mono font-black" required /></div>
                              ) : (
                                <div className="space-y-1"><input type="range" min="0" max="100" step="5" value={capaianMateriState[mat.materi_id] || 0} onChange={(e) => setCapaianMateriState(prev => ({ ...prev, [mat.materi_id]: parseInt(e.target.value, 10) || 0 }))} className="w-full accent-primary appearance-none bg-surface-container-high h-1 rounded" /><div className="text-right text-[10px] font-mono font-black text-primary">{capaianMateriState[mat.materi_id] || 0}%</div></div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-2xl border"><label className="text-[10px] uppercase font-black text-outline tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">rate_review</span> Catatan / Laporan Kejadian Kelas</label>
                <textarea value={catatanKelas} onChange={(e) => setCatatanKelas(e.target.value)} className="w-full min-h-[85px] bg-white border rounded-xl p-3" placeholder="Tulis kendala mengajar..." required />
              </div>
              <div className="pt-3 border-t flex gap-2 justify-end"><button type="button" onClick={() => setIsJournalModalOpen(false)} className="px-5 h-10 border rounded-xl font-bold">Batal</button><button type="submit" disabled={isSubmitting} className="px-6 h-10 bg-primary text-on-primary font-black rounded-xl">{isSubmitting ? 'Mengunggah...' : 'Kirim Laporan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: POPUP DETAILS */}
      {selectedHistoryDetails && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[85vh] overflow-hidden">
            <div className="bg-secondary text-on-secondary px-4 py-3.5 flex justify-between items-center shrink-0"><span className="text-sm font-black flex items-center gap-1.5"><span className="material-symbols-outlined text-base">analytics</span> Detil Riwayat Jurnal</span><button type="button" onClick={() => setSelectedHistoryDetails(null)} className="material-symbols-outlined text-base cursor-pointer">close</button></div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high/60 p-3 rounded-xl text-center font-mono">
                <div className="border-r border-outline-variant/40"><p className="text-[9px] text-outline font-bold uppercase">Kehadiran</p><p className="text-base font-black text-green-700">{selectedHistoryDetails.hadir_pct}%</p></div>
                <div><p className="text-[9px] text-outline font-bold uppercase">Capaian</p><p className="text-base font-black text-blue-700">{selectedHistoryDetails.capaian_pct}%</p></div>
              </div>
              <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border">
                <p className="text-on-surface">📅 <span className="font-bold">Tanggal:</span> {selectedHistoryDetails.tanggal}</p>
                <p className="text-on-surface">🏛 <span className="font-bold">Rombel:</span> {selectedHistoryDetails.kelas}</p>
                <p className="text-on-surface">🧔 <span className="font-bold">Pengampu:</span> {selectedHistoryDetails.pengajar}</p>
                <div className="mt-2 pt-2 border-t border-dashed"><span className="text-[9px] uppercase font-black text-outline block mb-0.5">Catatan Kelas:</span><p className="text-on-surface-variant italic font-medium leading-relaxed bg-white p-2.5 rounded-lg border">"{selectedHistoryDetails.detail || 'Tidak ada catatan.'}"</p></div>
              </div>
              <div className="space-y-1.5"><p className="text-[10px] text-outline uppercase font-black pl-1">Manifes Absensi</p>
                <div className="max-h-36 overflow-y-auto divide-y border rounded-xl px-3 bg-white scrollbar-none">
                  {selectedHistoryDetails.absensi?.map((abs, sIdx) => (
                    <div key={sIdx} className="py-2 flex justify-between items-center"><span className="font-bold text-on-surface truncate max-w-[70%]">{sIdx + 1}. {abs.name}</span><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${abs.status === 'Hadir' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{abs.status}</span></div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedHistoryDetails(null)} className="w-full h-10 bg-secondary text-on-secondary font-black rounded-xl cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: MUTASI KELAS (DENGAN OVERRIDE KONDISI DI LAPANGAN) ─── */}
      {mutatingStudent && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center sticky top-0">
              <h4 className="text-sm font-black flex items-center gap-1"><span className="material-symbols-outlined text-base">swap_horiz</span> Penyesuaian Mutasi Lapangan</h4>
              <button type="button" onClick={() => setMutatingStudent(null)} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>
            
            <form onSubmit={handleExecuteMutation} className="p-5 space-y-4 text-xs font-semibold">
              <div className="p-3 bg-surface-container-low rounded-xl border space-y-1">
                <span className="text-[9px] text-outline font-black block uppercase">Nama Santri:</span>
                <p className="text-base font-black text-on-surface">{mutatingStudent.name}</p>
              </div>

              {/* 1. SELEKTOR PILIHAN ROMBEL KELAS */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black text-outline">Pindahkan Ke Rombel Kelas Baru</label>
                <select value={targetMutationClass} onChange={(e) => setTargetMutationClass(e.target.value)} className="w-full h-10 border rounded-xl px-2.5 font-bold bg-white" required>
                  <option value="">-- Pilih Kelas Tujuan --</option>
                  {/* Tampilkan semua kelas rombel agar fleksibel */}
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.nama_kelas} ({c.divisi})</option>
                  ))}
                </select>
              </div>

              {/* 2. OVERRIDE PILIHAN DIVISI */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black text-outline">Override Pilihan Divisi (Kondisi Lapangan)</label>
                <select value={targetMutationDivisi} onChange={(e) => setTargetMutationDivisi(e.target.value)} className="w-full h-10 border rounded-xl px-2.5 font-bold bg-white" required>
                  <option value="caberawit">Caberawit</option>
                  <option value="mudamudi">Muda-Mudi</option>
                </select>
              </div>

              {/* 3. OVERRIDE PILIHAN JENJANG (Mengabaikan hitungan rumus umur asli jika ada anomali) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black text-outline">Override Tingkat Jenjang (Kondisi Lapangan)</label>
                <select value={targetMutationJenjang} onChange={(e) => setTargetMutationJenjang(e.target.value)} className="w-full h-10 border rounded-xl px-2.5 font-bold bg-white" required>
                  <option value="">-- Pilih Jenjang Lapangan --</option>
                  {MASTER_JENJANG_OPTIONS.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                <p className="text-[10px] text-primary font-medium mt-0.5">💡 Isi ini jika kemampuan santri berbeda dengan tingkatan usia lahirnya.</p>
              </div>

              <div className="flex gap-2 border-t pt-3.5">
                <button type="button" onClick={() => setMutatingStudent(null)} className="w-1/4 h-10 border rounded-xl">Batal</button>
                <button type="submit" className="flex-1 h-10 bg-primary text-on-primary font-black rounded-xl shadow-md">Simpan Perubahan Lapangan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}