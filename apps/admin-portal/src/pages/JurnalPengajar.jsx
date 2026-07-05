// src/pages/pengajar-portal/ManagementJurnalKelas.jsx
import { useState, useMemo, useEffect } from 'react';
import { jurnalKelasService } from '../services/jurnalKelasService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import JournalFormModal from './JournalFormModal';

export default function ManagementJurnalKelas() {
  // 1. OTENTIKASI & KONTROL POROS MULTI-TENANT
  const { tpqId } = useAuth();

  // 2. STATE NAVIGASI & LAYOUT GLOBAL
  const [activeTab, setActiveTab] = useState('kelas'); 
  const [activeDivision, setActiveDivision] = useState('caberawit'); 
  const [isLoading, setIsLoading] = useState(true);

  // 3. STATE KUMPULAN DATA MASTER (DATABASE LISTS)
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [pengajarList, setPengajarList] = useState([]);

  // 4. STATE OPERASIONAL TAB ROMBEL & MUTASI LAPANGAN
  const [selectedClassId, setSelectedClassId] = useState('');
  const [mutatingStudent, setMutatingStudent] = useState(null);
  const [targetMutationClass, setTargetMutationClass] = useState(''); 
  
  // 5. STATE MODAL 1: TAMBAH / EDIT CONFIGURATION ROMBEL
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null); 
  const [classFormName, setClassFormName] = useState('');
  const [classFormJenjang, setClassFormJenjang] = useState([]); 
  const [classFormJamMulai, setClassFormJamMulai] = useState('15:30');
  const [classFormJamSelesai, setClassFormJamSelesai] = useState('17:00');

  // 6. STATE MODAL 2: INPUT LAPORAN JURNAL KBM BARU
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedClassForJournal, setSelectedClassForJournal] = useState('');

  // 7. STATE MODAL 3: POPUP MANIFES REKAP DETAILS HISTORI
  const [selectedHistoryDetails, setSelectedHistoryDetails] = useState(null);

  // 8. STATE MODAL KUSTOM DIALOG: KONFIRMASI HAPUS ROMBEL
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // 9. STATE RENTANG WAKTU FILTER LOG JURNAL
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); 
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [filterEndDate, setFilterEndDate] = useState(() => {
    const d = new Date(); 
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // 10. REAL-TIME BULAN & HARI DATE HELPER OLEH SISTEM
  const todayObj = useMemo(() => new Date(), []);
  const todayDayNum = todayObj.getDate();
  const currentAutoMonth = useMemo(() => {
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${namaBulan[todayObj.getMonth()]} ${todayObj.getFullYear()}`;
  }, [todayObj]);

  // Kalkulator Otomatis Selisih Jam Operasional (Durasi KBM)
  const calculateDuration = (start, end) => {
    if (!start || !end) return '-';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const diffInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffInMinutes <= 0) return '0 Menit';
    const hours = Math.floor(diffInMinutes / 60);
    const mins = diffInMinutes % 60;
    return hours > 0 ? `${hours} Jam ${mins > 0 ? `${mins} Menit` : ''}` : `${mins} Menit`;
  };

  // AMBIL DATA KELAS, SANTRI & PENGAJAR
  const loadClassAndStudentsData = async () => {
    if (!tpqId) return; 
    setIsLoading(true);
    try {
      let kelas = await jurnalKelasService.getClasses(activeDivision, tpqId);
      
      if (kelas.length === 0) {
        const autoToastId = toast.loading('Menginisialisasi konfigurasi rombel default...');
        if (activeDivision === 'caberawit') {
          await Promise.all([
            jurnalKelasService.insertClass('PAUD/TK', 'caberawit', tpqId, ['PAUD/TK'], '15:30', '16:30'),
            jurnalKelasService.insertClass('Caberawit A', 'caberawit', tpqId, ['Kelas 1', 'Kelas 2', 'Kelas 3'], '15:30', '17:00'),
            jurnalKelasService.insertClass('Caberawit B', 'caberawit', tpqId, ['Kelas 4', 'Kelas 5', 'Kelas 6'], '15:30', '17:00')
          ]);
        } else {
          await Promise.all([
            jurnalKelasService.insertClass('Pra Remaja', 'mudamudi', tpqId, ['Pra Remaja'], '18:30', '20:00'),
            jurnalKelasService.insertClass('Remaja', 'mudamudi', tpqId, ['Remaja'], '18:30', '20:00'),
            jurnalKelasService.insertClass('Pra Nikah', 'mudamudi', tpqId, ['Pra Nikah'], '18:30', '20:00')
          ]);
        }
        toast.success('Rombel default cabang sukses dibuat!', { id: autoToastId });
        kelas = await jurnalKelasService.getClasses(activeDivision, tpqId);
      }

      const [santri, pengajar] = await Promise.all([
        jurnalKelasService.getStudents(tpqId),
        jurnalKelasService.getPengajar(tpqId)
      ]);

      setClassesList(kelas);
      setStudentsList(santri);
      setPengajarList(pengajar);

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
      toast.error('Gagal mengambil manifes rombel.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncLogHistoriJurnal = async () => {
    if (!tpqId) return;
    try {
      const logs = await jurnalKelasService.getHistoryLogs(filterStartDate, filterEndDate, tpqId);
      setHistoryList(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadClassAndStudentsData(); }, [activeDivision, tpqId]);
  useEffect(() => { syncLogHistoriJurnal(); }, [filterStartDate, filterEndDate, tpqId]);

  // AUTOMATIC SCROLL LOCK CONTROLLER
  useEffect(() => {
    const isModalActive = isClassModalOpen || isJournalModalOpen || !!selectedHistoryDetails || !!mutatingStudent || !!deleteConfirmation;
    document.body.style.overflow = isModalActive ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isClassModalOpen, isJournalModalOpen, selectedHistoryDetails, mutatingStudent, deleteConfirmation]);

  useEffect(() => {
    if (mutatingStudent) {
      setTargetMutationClass(mutatingStudent.classId || '');
    }
  }, [mutatingStudent]);

  // FILTERING MEMOIZATION RENDER DATA
  const allTakenJenjangByOtherClasses = useMemo(() => {
    const taken = [];
    classesList.forEach(cls => {
      if (editingClass && cls.id === editingClass.id) return;
      if (Array.isArray(cls.jenjang_list)) taken.push(...cls.jenjang_list);
    });
    return taken;
  }, [classesList, editingClass]);

  const filteredSantriByClass = useMemo(() => studentsList.filter(s => s.classId === selectedClassId), [studentsList, selectedClassId]);

  const totalAttendanceAverage = useMemo(() => {
    if (historyList.length === 0) return 0;
    return Math.round(historyList.reduce((acc, curr) => acc + (curr.hadir_pct || 0), 0) / historyList.length);
  }, [historyList]);

  // ACTION HANDLER: OPERASIONAL ROMBEL KELAS
  const handleOpenAddClass = () => {
    setEditingClass(null); setClassFormName(''); setClassFormJenjang([]); 
    setClassFormJamMulai('15:30'); setClassFormJamSelesai('17:00');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls, e) => {
    e.stopPropagation(); setEditingClass(cls); setClassFormName(cls.nama_kelas); 
    setClassFormJenjang(cls.jenjang_list || []); 
    setClassFormJamMulai(cls.jam_mulai || '15:30');
    setClassFormJamSelesai(cls.jam_selesai || '17:00');
    setIsClassModalOpen(true);
  };

  const handleToggleJenjangCheckbox = (jenjangName) => {
    if (classFormJenjang.includes(jenjangName)) {
      setClassFormJenjang(prev => prev.filter(item => item !== jenjangName));
    } else {
      setClassFormJenjang(prev => [...prev, jenjangName]);
    }
  };

  const handleExecuteDeleteClass = async () => {
    if (!deleteConfirmation) return;
    const { id, name } = deleteConfirmation;
    const toastId = toast.loading(`Sedang menghapus rombel ${name}...`);
    try {
      await jurnalKelasService.deleteClass(id);
      toast.success(`Rombel "${name}" berhasil dihapus dari sistem!`, { id: toastId });
      setDeleteConfirmation(null);
      loadClassAndStudentsData(); 
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus rombel kelas: ' + err.message, { id: toastId });
    }
  };

  const handleSaveClassSubmit = async (e) => {
    e.preventDefault();
    if (!classFormName.trim() || classFormJenjang.length === 0 || !tpqId) return;
    try {
      if (editingClass) {
        await jurnalKelasService.updateClass(editingClass.id, classFormName.trim(), classFormJenjang, classFormJamMulai, classFormJamSelesai);
        toast.success('Konfigurasi ulang rombel kelas berhasil disimpan!');
      } else {
        await jurnalKelasService.insertClass(classFormName.trim(), activeDivision, tpqId, classFormJenjang, classFormJamMulai, classFormJamSelesai);
        toast.success('Rombel kelas baru sukses ditambahkan!');
      }
      setIsClassModalOpen(false);
      const updatedClasses = await jurnalKelasService.getClasses(activeDivision, tpqId);
      setClassesList(updatedClasses);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExecuteMutation = async (e) => {
    e.preventDefault();
    try {
      await jurnalKelasService.mutateStudentClass(mutatingStudent.id, targetMutationClass || null, null, null);
      toast.success(`Mutasi rombel ${mutatingStudent.name || mutatingStudent.nama_lengkap} berhasil disimpan!`);
      setMutatingStudent(null);
      loadClassAndStudentsData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16">
      
      {/* AREA UTAMA: HEADER CONTROL */}
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

      {/* TABS MENU BAR */}
      <div className="flex bg-surface-container-high p-1 rounded-2xl max-w-sm border border-outline-variant/40">
        <button type="button" onClick={() => setActiveTab('kelas')} className={`flex-1 py-3 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'kelas' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-base">schema</span> Penataan Rombel</button>
        <button type="button" onClick={() => setActiveTab('riwayat')} className={`flex-1 py-3 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'riwayat' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-base">history</span> Log Jurnal Harian</button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-xs font-bold text-outline animate-pulse">Menghubungkan kueri via Supabase Service...</div>
      ) : (
        <>
          {/* TAB 1: OPERASIONAL KELAS & SANTRI */}
          {activeTab === 'kelas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-scaleUp">
              <div className="space-y-3 bg-white border border-outline-variant/60 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-1">
                  <h3 className="text-xs font-black text-outline uppercase tracking-wider">Rombel Profil Kelas</h3>
                  <button type="button" onClick={handleOpenAddClass} className="text-[11px] font-black text-primary hover:underline flex items-center gap-0.5 cursor-pointer bg-primary/5 px-2.5 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-xs font-bold">add</span> Tambah Rombel
                  </button>
                </div>

                {classesList.map((cls) => (
                  <button key={cls.id} type="button" onClick={() => setSelectedClassId(cls.id)} className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer relative group ${selectedClassId === cls.id ? 'border-primary bg-primary/5 font-black text-primary' : 'border-outline-variant/60 text-on-surface'}`}>
                    <div className="space-y-1 max-w-[65%]">
                      <p className="text-sm truncate font-black">{cls.nama_kelas}</p>
                      <p className="text-[10px] text-outline font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {cls.jam_mulai || '--:--'} - {cls.jam_selesai || '--:--'} ({calculateDuration(cls.jam_mulai, cls.jam_selesai)})
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {cls.jenjang_list?.map(j => (<span key={j} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">{j}</span>))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold bg-surface-container-highest text-on-surface px-2 py-0.5 rounded-full font-mono">
                        {studentsList.filter(s => s.classId === cls.id).length} S
                      </span>
                      <span onClick={(e) => handleOpenEditClass(cls, e)} className="material-symbols-outlined text-base text-outline hover:text-primary transition-colors cursor-pointer p-0.5 rounded">edit</span>
                      <span onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ id: cls.id, name: cls.nama_kelas }); }} className="material-symbols-outlined text-base text-outline hover:text-red-600 transition-colors cursor-pointer p-0.5 rounded">delete</span>
                    </div>
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
                            <p className="font-black text-on-surface text-sm">{santri.name || santri.nama_lengkap}</p>
                            <span className="text-[10px] text-outline font-medium">Asli Sistem: <span className="uppercase text-primary font-bold">{santri.divisi}</span> ({santri.jenjang || 'Belum Set'})</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => setMutatingStudent(santri)} className="px-3 h-8 border border-primary/20 text-primary font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer">Mutasi Kelas</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOG HISTORI REKAP JURNAL KBM */}
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
                <button type="button" onClick={() => { setIsJournalModalOpen(true); }} className="w-full md:w-auto h-11 bg-primary text-on-primary font-black text-xs px-5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"><span className="material-symbols-outlined text-base font-bold">add_circle</span> Input Jurnal Hari Ini</button>
              </div>

              <div className="space-y-3">
                {historyList.map((log) => (
                  <div key={log.id} onClick={() => setSelectedHistoryDetails(log)} className="border rounded-2xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded font-mono font-bold text-outline">📅 {log.tanggal}</span><span className="text-xs font-black text-primary">{log.kelas}</span></div>
                      <p className="text-sm font-black text-on-surface">Guru Pengampu: <span className="font-semibold text-on-surface-variant">{log.pengajar}</span></p>
                      {log.jam_mulai && <p className="text-[11px] font-mono text-outline-variant font-bold">⏱ Durasi KBM: {log.jam_mulai} - {log.jam_selesai} ({calculateDuration(log.jam_mulai, log.jam_selesai)})</p>}
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

      {/* MODAL 1: FORMS TAMBAH / EDIT CONFIGURATION ROMBEL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0 sticky top-0 z-10">
              <h4 className="text-sm font-black">{editingClass ? 'Edit Komposisi Rombel Kelas' : 'Deklarasi Rombel Kelas Baru'}</h4>
              <button type="button" onClick={() => setIsClassModalOpen(false)} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>
            <form onSubmit={handleSaveClassSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5"><label className="text-[10px] uppercase font-black text-outline">Nama Rombel Kelompok</label><input type="text" value={classFormName} onChange={(e) => setClassFormName(e.target.value)} className="w-full h-10 border rounded-xl px-3 font-bold bg-white outline-none focus:border-primary" placeholder="Contoh: Rombel Caberawit A" required /></div>
              
              <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl border">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Jam Mulai KBM</label>
                  <input type="time" value={classFormJamMulai} onChange={(e) => setClassFormJamMulai(e.target.value)} className="h-9 border rounded-lg px-2 bg-white font-mono font-bold text-center outline-none focus:border-primary" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Jam Selesai KBM</label>
                  <input type="time" value={classFormJamSelesai} onChange={(e) => setClassFormJamSelesai(e.target.value)} className="h-9 border rounded-lg px-2 bg-white font-mono font-bold text-center outline-none focus:border-primary" required />
                </div>
                <div className="col-span-2 pt-1 border-t border-dashed flex justify-between items-center text-[11px]">
                  <span className="text-outline font-medium">Estimasi Durasi Belajar Rombel:</span>
                  <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black">{calculateDuration(classFormJamMulai, classFormJamSelesai)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black text-outline">Pilih Cakupan Batas Usia Jenjang</label>
                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-xl border">
                  {(activeDivision === 'mudamudi' ? ['Pra Remaja', 'Remaja', 'Pra Nikah'] : ['PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']).map((jenjang) => {
                    const isAlreadyTaken = allTakenJenjangByOtherClasses.includes(jenjang); 
                    const isChecked = classFormJenjang.includes(jenjang);
                    return (
                      <label key={jenjang} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isAlreadyTaken ? 'bg-surface-container-highest/60 opacity-40 cursor-not-allowed' : isChecked ? 'bg-primary/5 border-primary text-primary font-black cursor-pointer' : 'bg-white hover:bg-surface-container-low cursor-pointer'}`}>
                        <input type="checkbox" checked={isChecked} disabled={isAlreadyTaken} onChange={() => handleToggleJenjangCheckbox(jenjang)} className="accent-primary w-4 h-4 cursor-pointer" />
                        <span className="text-[11px] font-medium">{jenjang}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 border-t pt-3"><button type="button" onClick={() => setIsClassModalOpen(false)} className="w-1/4 h-10 border rounded-xl">Batal</button><button type="submit" className="flex-1 h-10 bg-primary text-on-primary font-black rounded-xl shadow-md">Simpan Rombel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MODULAR FORM PENERBITAN BERKAS JURNAL KBM BARU */}
      {isJournalModalOpen && (
        <JournalFormModal 
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
          tpqId={tpqId}
          classesList={classesList}
          studentsList={studentsList}
          pengajarList={pengajarList}
          selectedClassForJournal={selectedClassForJournal}
          setSelectedClassForJournal={setSelectedClassForJournal}
          currentAutoMonth={currentAutoMonth}
          todayDayNum={todayDayNum}
          syncLogHistoriJurnal={syncLogHistoriJurnal}
          calculateDuration={calculateDuration}
        />
      )}

      {/* 3. MODAL REKAP MANIFES DETAILS HISTORI */}
      {selectedHistoryDetails && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[85vh] overflow-hidden">
            <div className="bg-secondary text-on-secondary px-4 py-3.5 flex justify-between items-center shrink-0"><span className="text-sm font-black flex items-center gap-1.5"><span className="material-symbols-outlined text-base">analytics</span> Detil Riwayat Jurnal KBM</span><button type="button" onClick={() => setSelectedHistoryDetails(null)} className="material-symbols-outlined text-base cursor-pointer">close</button></div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs font-semibold scrollbar-none">
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high/60 p-3 rounded-xl text-center font-mono">
  <div className="border-r border-outline-variant/40">
    <p className="text-[9px] text-outline font-bold uppercase">Kehadiran</p>
    <p className="text-base font-black text-green-700">{selectedHistoryDetails.hadir_pct}%</p>
  </div>
  <div>
    <p className="text-[9px] text-outline font-bold uppercase">Status Silabus</p>
    {/* 💡 KOREKSI: Ubah dari "100%" menjadi nilai dinamis dari database */}
    <p className="text-base font-black text-blue-700">{selectedHistoryDetails.capaian_pct}%</p>
  </div>
</div>
              <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border">
                <p className="text-on-surface">📅 <span className="font-bold">Tanggal KBM:</span> {selectedHistoryDetails.tanggal}</p>
                <p className="text-on-surface">🏛 <span className="font-bold">Nama Rombel:</span> {selectedHistoryDetails.kelas}</p>
                <p className="text-on-surface">🧔 <span className="font-bold">Guru Pengampu:</span> {selectedHistoryDetails.pengajar}</p>
                {selectedHistoryDetails.jam_mulai && <p className="text-on-surface">⏱ <span className="font-bold">Jam Belajar:</span> {selectedHistoryDetails.jam_mulai} - {selectedHistoryDetails.jam_selesai} ({calculateDuration(selectedHistoryDetails.jam_mulai, selectedHistoryDetails.jam_selesai)})</p>}
                <div className="mt-2 pt-2 border-t border-dashed"><span className="text-[9px] uppercase font-black text-outline block mb-0.5">Catatan & Rangkuman KBM Harian:</span><p className="text-on-surface-variant font-medium leading-relaxed bg-white p-2.5 rounded-lg border whitespace-pre-line">{selectedHistoryDetails.detail || 'Tidak ada catatan khusus.'}</p></div>
              </div>

              {/* 💡 SINKRONISASI BARU: BLOK RENDER CAPAIAN SILABUS REAL-TIME */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-outline uppercase font-black pl-1">Target Silabus Tersampaikan</p>
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-white max-h-32 overflow-y-auto scrollbar-none px-3 py-1.5 space-y-1.5">
                  {Array.isArray(selectedHistoryDetails.capaian_silabus_jurnal) && selectedHistoryDetails.capaian_silabus_jurnal.length > 0 ? (
                    selectedHistoryDetails.capaian_silabus_jurnal.map((sil, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center py-1 border-b border-outline-variant/10 last:border-none font-bold">
                        <span className="text-on-surface truncate max-w-[70%]">• {sil.nama_materi} <span className="text-[9px] text-outline font-medium">({sil.kategori})</span></span>
                        <span className="text-[10px] text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">
                          {sil.tipe_pelacakan === 'persentase' ? `${sil.capaian_pct}%` : `${sil.tipe_pelacakan === 'hadist' ? 'Hds' : sil.tipe_pelacakan === 'ayat' ? 'Ayt' : 'Hal'} ${sil.capaian_awal}-${sil.capaian_akhir}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-3 text-outline italic">Tidak ada dokumentasi silabus utama harian.</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5"><p className="text-[10px] text-outline uppercase font-black pl-1">Manifes Absensi Santri</p>
                <div className="max-h-36 overflow-y-auto divide-y border rounded-xl px-3 bg-white scrollbar-none">
                  {/* 💡 KOREKSI: Membaca array sub-tabel hasil join secara dinamis */}
                  {Array.isArray(selectedHistoryDetails.absensi_santri) && selectedHistoryDetails.absensi_santri.length > 0 ? (
                    selectedHistoryDetails.absensi_santri.map((abs, sIdx) => (
                      <div key={sIdx} className="py-2 flex justify-between items-center">
                        <span className="font-bold text-on-surface truncate max-w-[70%]">
                          {sIdx + 1}. {abs.santri?.nama_lengkap || 'Santri Terhapus'}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${abs.status === 'Hadir' ? 'bg-green-100 text-green-800' : abs.status === 'Izin' ? 'bg-blue-100 text-blue-800' : abs.status === 'Sakit' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                          {abs.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-outline italic">Manifes riwayat absensi kosong.</p>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedHistoryDetails(null)} className="w-full h-10 bg-secondary text-on-secondary font-black rounded-xl cursor-pointer shadow-md">Tutup Manifes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MUTASI PINDAH WADAH KELAS / ROMBEL LAPANGAN */}
      {mutatingStudent && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center sticky top-0 z-10">
              <h4 className="text-sm font-black flex items-center gap-1"><span className="material-symbols-outlined text-base">swap_horiz</span> Penyesuaian Rombel Lapangan</h4>
              <button type="button" onClick={() => setMutatingStudent(null)} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>
            
            <form onSubmit={handleExecuteMutation} className="p-5 space-y-4 text-xs font-semibold">
              <div className="p-3 bg-surface-container-low rounded-xl border space-y-2">
                <div>
                  <span className="text-[9px] text-outline font-black block uppercase">Nama Santri</span>
                  <p className="text-sm font-black text-on-surface">{mutatingStudent.name || mutatingStudent.nama_lengkap}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-dashed pt-2 mt-1">
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Divisi Asli</span>
                    <span className="text-xs font-black text-primary uppercase">{mutatingStudent.divisi || 'caberawit'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Jenjang Asli</span>
                    <span className="text-xs font-black text-secondary uppercase">{mutatingStudent.jenjang || 'Belum Set'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <select value={targetMutationClass} onChange={(e) => setTargetMutationClass(e.target.value)} className="w-full h-10 border rounded-xl px-2.5 font-bold bg-white text-primary outline-none focus:border-primary">
                  <option value="">-- Letakkan Tanpa Rombel Kelas --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.nama_kelas} ({c.divisi})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 border-t pt-3.5">
                <button type="button" onClick={() => setMutatingStudent(null)} className="w-1/4 h-10 border rounded-xl">Batal</button>
                <button type="submit" className="flex-1 h-10 bg-primary text-on-primary font-black rounded-xl shadow-md">Simpan Perubahan Rombel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIGH-END CUSTOM CONFIRMATION DIALOG MODAL */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5 flex flex-col items-center text-center animate-scaleUp space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-2xl font-bold">delete_forever</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-on-surface">Hapus Rombel Kelas?</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirmation.name}"</strong>? Anggota di dalamnya otomatis keluar menjadi tanpa rombel.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button type="button" onClick={() => setDeleteConfirmation(null)} className="h-9 border border-outline-variant rounded-xl font-bold text-xs hover:bg-surface-container-low text-on-surface-variant cursor-pointer">Batal</button>
              <button type="button" onClick={handleExecuteDeleteClass} className="h-9 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-sm cursor-pointer">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}