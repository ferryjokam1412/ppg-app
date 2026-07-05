// src/pages/admin-portal/StudentsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { santriService } from '../services/santriService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const { tpqId } = useAuth();

  const [students, setStudents] = useState([]);
  const [classList, setClassList] = useState([]); // State penampung rombel kelas aktif
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Students');

  // State Management Pop-up Detail & Form Mutasi Eksklusif Rombel
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editClassId, setEditClassId] = useState(''); // Hanya kelas yang dapat diubah
  const [editStatus, setEditStatus] = useState('');
  const [editKeteranganStatus, setEditKeteranganStatus] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filterChips = ['All Students', 'Active', 'Needs Review'];

  const loadStudentsData = async () => {
    if (!tpqId) return;
    setIsLoading(true);
    try {
      const [dataSantri, dataRombel] = await Promise.all([
        santriService.getStudentsList(tpqId),
        santriService.getClassesList(tpqId)
      ]);
      setStudents(dataSantri || []);
      setClassList(dataRombel || []);
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memuat sinkronisasi direktori data santri.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsData();
  }, [tpqId]);

  // Sync data ke form lokal saat pop-up diaktifkan
  useEffect(() => {
    if (selectedStudent) {
      setEditClassId(selectedStudent.classId || '');
      setEditStatus(selectedStudent.status || 'Active');
      
      const currentKet = selectedStudent.keterangan_status || '';
      const presetReasons = ["sekolah sambil mondok", "mondok reguler", "Kerja/PKL Luar Kota", "sudah menikah"];
      
      if (currentKet && !presetReasons.includes(currentKet)) {
        setEditKeteranganStatus('alasan lain');
        setCustomReason(currentKet);
      } else {
        setEditKeteranganStatus(currentKet);
        setCustomReason('');
      }

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedStudent]);

  const handleSaveMutation = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSaving(true);
    const toastId = toast.loading('Sedang mengonfigurasi rombel kelas santri...');

    const finalKeterangan = editStatus === 'Active' ? null
      : (editKeteranganStatus === 'alasan lain' ? customReason.trim() : editKeteranganStatus);

    try {
      await santriService.updateStudentMutation(
        selectedStudent.id,
        editClassId, // Kirim id rombel kelas baru hasil pilihan drop-down
        editStatus,
        finalKeterangan
      );
      toast.success('Mutasi rombel kelas berhasil diterapkan!', { id: toastId });
      setSelectedStudent(null);
      loadStudentsData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses re-alokasi kelas.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (id, name, e) => {
    e.stopPropagation();
    const toastId = toast.loading(`Menerbitkan nomor NIS resmi untuk ${name}...`);
    try {
      await santriService.approveStudent(id);
      toast.success(`Berhasil menyetujui ${name}!`, { id: toastId });
      loadStudentsData();
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memproses persetujuan berkas pendaftaran.', { id: toastId });
    }
  };

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'Active').length;
    const review = students.filter(s => s.status === 'Needs Review').length;

    let paudTk = 0;
    let caberawit = 0;
    let praRemaja = 0;
    let remaja = 0;
    let praNikah = 0;

    students.forEach(s => {
      if (s.tanggal_lahir) {
        const age = calculateAge(s.tanggal_lahir);
        if (age <= 6) paudTk++;
        else if (age >= 7 && age <= 12) caberawit++;
        else if (age >= 13 && age <= 15) praRemaja++;
        else if (age >= 16 && age <= 18) remaja++;
        else if (age >= 19) praNikah++;
      }
    });

    return { total, active, review, paudTk, caberawit, praRemaja, remaja, praNikah };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nis_display?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'All Students' || student.status === activeFilter;
      return matchesSearch && matchesCategory;
    });
  }, [students, searchQuery, activeFilter]);

  return (
    <div className="w-full flex flex-col px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto select-none animate-fadeIn">
      
      {/* HEADER TITLE */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl text-on-surface mb-1 font-black tracking-tight">
          Direktori & Penempatan Santri
        </h1>
        <p className="text-xs md:text-sm text-on-surface-variant font-medium">
          Kelola penataan klaster kelompok usia pembinaan serta monitoring penempatan rombel KBM lapangan.
        </p>
      </div>

      {/* BLOCK A: REGISTRASI UTAMA STATUS */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm">
          <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-wider">Total Pendaftar</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.total}</span>
        </div>
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm border-l-4 border-l-green-600">
          <span className="text-[10px] md:text-xs font-black text-green-700 uppercase tracking-wider">Santri Aktif</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.active}</span>
        </div>
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm border-l-4 border-l-orange-500">
          <span className="text-[10px] md:text-xs font-black text-orange-700 uppercase tracking-wider">Butuh Review</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.review}</span>
        </div>
      </div>

      {/* BLOCK B: CARD INFO KLASTER JUMLAH USIA */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 space-y-3 mb-6">
        <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">groups</span> Distribusi Kelompok Usia Lapangan
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
          <div className="bg-white rounded-xl p-3 border border-outline-variant/30 flex flex-col shadow-2xs">
            <span className="text-[10px] text-outline font-bold truncate">PAUD / TK <span className="font-normal text-[9px] text-outline/80">(≤6 th)</span></span>
            <span className="text-lg font-black text-on-surface mt-0.5">{stats.paudTk} <span className="text-[10px] text-outline font-medium">Anak</span></span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-outline-variant/30 flex flex-col shadow-2xs">
            <span className="text-[10px] text-outline font-bold truncate">Caberawit <span className="font-normal text-[9px] text-outline/80">(7-12 th)</span></span>
            <span className="text-lg font-black text-on-surface mt-0.5">{stats.caberawit} <span className="text-[10px] text-outline font-medium">Anak</span></span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-outline-variant/30 flex flex-col shadow-2xs">
            <span className="text-[10px] text-outline font-bold truncate">Pra Remaja <span className="font-normal text-[9px] text-outline/80">(13-15 th)</span></span>
            <span className="text-lg font-black text-on-surface mt-0.5">{stats.praRemaja} <span className="text-[10px] text-outline font-medium">Anak</span></span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-outline-variant/30 flex flex-col shadow-2xs">
            <span className="text-[10px] text-outline font-bold truncate">Remaja <span className="font-normal text-[9px] text-outline/80">(16-18 th)</span></span>
            <span className="text-lg font-black text-on-surface mt-0.5">{stats.remaja} <span className="text-[10px] text-outline font-medium">Anak</span></span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-outline-variant/30 flex flex-col shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-primary font-bold truncate">Pra Nikah <span className="font-normal text-[9px] text-primary/80">(≥19 th)</span></span>
            <span className="text-lg font-black text-primary mt-0.5">{stats.praNikah} <span className="text-[10px] text-primary/70 font-medium">Anak</span></span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-background/90 backdrop-blur-md pb-4 mb-4 space-y-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input 
            className="w-full bg-white border border-outline-variant/60 rounded-xl py-3 pl-12 pr-4 text-sm font-semibold focus:border-primary outline-none transition-all" 
            placeholder="Cari nama lengkap generus atau nomor NIS..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip} type="button" onClick={() => setActiveFilter(chip)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                activeFilter === chip ? 'border-primary bg-primary text-on-primary font-black' : 'border-outline-variant/80 text-on-surface-variant bg-white'
              }`}
            >
              {chip === 'All Students' ? 'Semua Generus' : chip === 'Active' ? 'Aktif' : 'Butuh Approval'}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS LIST RENDER GRID */}
      {isLoading ? (
        <div className="text-center py-12 text-xs font-bold text-outline animate-pulse">Menghubungkan data view Supabase...</div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredStudents.map((student) => {
            const isPending = student.status === 'Needs Review';
            const isInactive = student.status === 'Tidak Aktif';
            
            return (
              <div 
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`bg-white rounded-xl border p-5 flex flex-col gap-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer active:scale-99 relative overflow-hidden ${
                  isInactive ? 'border-red-200 bg-red-50/10' : 'border-outline-variant/30'
                }`}
              >
                {/* 💡 FIX LAYOUT: Mencegah status badge terpotong/squished dengan flex-1 min-w-0 & shrink-0 */}
                <div className="flex justify-between items-start gap-3 w-full">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-black text-xs text-on-surface-variant shrink-0">
                      {student.nama_lengkap?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-on-surface truncate">{student.nama_lengkap}</h3>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[9px] font-black bg-surface-container-high px-1.5 py-0.5 rounded uppercase">{student.jenis_kelamin} • {calculateAge(student.tanggal_lahir)} TH</span>
                        <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{student.divisi || 'caberawit'}</span>
                        <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase truncate max-w-[100px]">{student.nama_kelas || 'Tanpa Rombel'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isPending ? 'bg-orange-100 text-orange-800' : isInactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {isPending ? 'Review' : isInactive ? 'Off' : 'Aktif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold border-t border-b border-outline-variant/10 py-2.5 my-0.5">
                  <div>
                    <span className="text-outline text-[9px] uppercase font-medium block">Lembaga TPQ</span>
                    <span className="text-on-surface truncate block mt-0.5 font-black">🏛 {student.nama_tpq || 'Tidak Ada'}</span>
                  </div>
                  <div>
                    <span className="text-outline text-[9px] uppercase font-medium block">Kualifikasi</span>
                    <span className="text-on-surface block mt-0.5 font-black">🎓 {student.sudah_mt ? 'Mubaligh MT' : student.perbah_mondok ? 'Eks Mondok' : 'Reguler'}</span>
                  </div>
                </div>

                {isInactive && student.keterangan_status && (
                  <div className="bg-red-50 text-red-900 text-[10px] p-2 rounded-lg border border-red-100 font-medium italic">
                    Ket: "{student.keterangan_status}"
                  </div>
                )}

                <div className="mt-auto pt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono font-black text-primary">{student.nis_display || 'NIS_PENDING'}</span>
                  {isPending && (
                    <button
                      type="button" onClick={(e) => handleApprove(student.id, student.nama_lengkap, e)}
                      className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-0.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-xs font-bold">verified</span> Setujui
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-1">person_search</span>
          <p className="text-xs font-bold text-on-surface-variant">Data santri tidak ditemukan.</p>
        </div>
      )}

      {/* ─── MODAL POP-UP DETAIL INFORMASI & MUTASI EXCLUSIF ROMBEL TERKUNCI ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[88vh] overflow-hidden">
            
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0">
              <span className="text-sm font-black flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">id_card</span> Informasi Manifes Detail Santri
              </span>
              <button type="button" onClick={() => setSelectedStudent(null)} className="material-symbols-outlined text-base cursor-pointer p-1 hover:bg-white/10 rounded-full">close</button>
            </div>

            <form onSubmit={handleSaveMutation} className="p-5 overflow-y-auto space-y-4 text-xs font-semibold scrollbar-none pb-8 sm:pb-5">
              
              {/* SEKSI A: DATA ADMINISTRASI (READ-ONLY) */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2.5">
                <span className="text-[9px] text-outline font-black block uppercase tracking-wider border-b pb-1">Identitas Santri (Terkunci)</span>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="col-span-2">
                    <span className="text-[9px] text-outline block font-medium">Nama Lengkap</span>
                    <span className="text-sm font-black text-on-surface block leading-tight">{selectedStudent.nama_lengkap}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Nomor NIS Resmi</span>
                    <span className="text-xs font-mono font-black text-primary">{selectedStudent.nis_display || 'PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Jenis Kelamin / Usia</span>
                    <span className="text-on-surface font-bold text-xs">{selectedStudent.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} ({calculateAge(selectedStudent.tanggal_lahir)} Tahun)</span>
                  </div>
                  
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Rumpun Divisi</span>
                    <span className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded font-black uppercase inline-block mt-0.5">{selectedStudent.divisi || 'caberawit'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Tingkat Jenjang</span>
                    <span className="text-xs bg-secondary/5 text-secondary px-2 py-0.5 rounded font-black uppercase inline-block mt-0.5">{selectedStudent.jenjang || 'Belum Set'}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-outline block font-medium">Kontak WhatsApp</span>
                    <span className="text-on-surface-variant font-mono font-bold">{selectedStudent.nomor_telepon || '-'}</span>
                  </div>
                  <div className="col-span-2 border-t border-dashed border-outline-variant/30 pt-2 mt-1">
                    <span className="text-[9px] text-outline block font-medium">Lembaga TPQ Naungan</span>
                    <span className="text-on-surface font-black text-xs flex items-center gap-1">🏛 {selectedStudent.nama_tpq || 'Belum Terikat'}</span>
                  </div>
                </div>
              </div>

              {/* SEKSI B: AREA MODUL EDITABLE (ROMBEL KELAS & STATUS) */}
              <div className="bg-white border-2 border-primary/20 p-4 rounded-xl space-y-3.5 shadow-2xs">
                <span className="text-[9px] text-primary font-black block uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit_square</span> Penempatan & Status Lapangan (Bisa Diedit)
                </span>

                {/* 💡 FIX DROPDOWN OPTION: Hanya memuat Nama Rombel dan Informasi Jenjang Usia saja */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Mutasi Pilihan Rombel Kelas</label>
                  <select 
                    value={editClassId} 
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full h-10 border border-outline-variant rounded-xl px-2.5 font-black text-xs bg-white text-primary outline-none focus:border-primary"
                  >
                    <option value="">-- Letakkan Tanpa Rombel Kelas --</option>
                    {classList.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nama_kelas} ({cls.jenjang_list?.join(', ') || 'Semua Jenjang'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit Pilihan Status Keaktifan */}
                <div className="flex flex-col gap-1 pt-1 border-t border-dashed">
                  <label className="text-[10px] uppercase font-black text-outline">Status Keaktifan Generus</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => { setEditStatus(e.target.value); setEditKeteranganStatus(''); setCustomReason(''); }}
                    className={`w-full h-10 border rounded-xl px-2.5 font-black text-xs bg-white outline-none ${
                      editStatus === 'Tidak Aktif' ? 'border-red-400 text-red-700 focus:border-red-500' : 'border-outline-variant focus:border-primary'
                    }`}
                    required
                  >
                    <option value="Active">Aktif / Mengikuti KBM Rutin</option>
                    <option value="Tidak Aktif">Tidak Aktif (Off Lapangan)</option>
                  </select>
                </div>

                {/* Form Dropdown Alasan Keterangan Jika Memilih "Tidak Aktif" */}
                {editStatus === 'Tidak Aktif' && (
                  <div className="space-y-2.5 animate-fadeIn p-3 bg-red-50/50 border border-red-200/60 rounded-xl">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-black text-red-800">Pilih Keterangan Alasan</label>
                      <select
                        value={editKeteranganStatus}
                        onChange={(e) => { setEditKeteranganStatus(e.target.value); if(e.target.value !== 'alasan lain') setCustomReason(''); }}
                        className="w-full h-9 border border-red-200 rounded-lg px-2 bg-white font-bold text-xs text-on-surface focus:outline-none"
                        required
                      >
                        <option value="">-- Pilih Alasan --</option>
                        <option value="sekolah sambil mondok">Sekolah sambil mondok</option>
                        <option value="mondok reguler">Mondok reguler</option>
                        <option value="Kerja/PKL Luar Kota">Kerja/PKL Luar Kota</option>
                        <option value="sudah menikah">Sudah Menikah</option>
                        <option value="alasan lain">Alasan lain (Input sendiri)</option>
                      </select>
                    </div>

                    {/* Input Kustom Teks Mandiri */}
                    {editKeteranganStatus === 'alasan lain' && (
                      <div className="flex flex-col gap-1 animate-fadeIn">
                        <label className="text-[9px] uppercase font-black text-outline">Tulis Alasan Kustom</label>
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Tulis alasan tidak aktif..."
                          className="w-full h-16 bg-white border border-outline-variant rounded-lg p-2 font-medium text-xs focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Button Actions */}
              <div className="flex gap-2 pt-3 border-t border-outline-variant/20 shrink-0">
                <button type="button" onClick={() => setSelectedStudent(null)} className="w-1/4 h-10 border border-outline-variant rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">Kembali</button>
                <button type="submit" disabled={isSaving || (editStatus === 'Tidak Aktif' && !editKeteranganStatus)} className="flex-1 h-10 bg-primary text-on-primary font-black shadow-md rounded-xl hover:bg-primary-container disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-base">cloud_done</span>
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}