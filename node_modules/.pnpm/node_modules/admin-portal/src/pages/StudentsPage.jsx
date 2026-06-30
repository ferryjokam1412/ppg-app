// src/pages/admin-portal/StudentsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { santriService } from '../services/santriService';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Students');

  // State Management Pop-up Detail & Mutasi Terkunci
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editDivisi, setEditDivisi] = useState('');
  const [editJenjang, setEditJenjang] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filterChips = ['All Students', 'Active', 'Needs Review'];

  // Pilihan opsi jenjang dinamis mengikuti rumpun divisi terpilih
  const JENJANG_OPTIONS = useMemo(() => {
    if (editDivisi === 'mudamudi') {
      return ['Pra Remaja', 'Remaja', 'Pra Nikah'];
    }
    return ['PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  }, [editDivisi]);

  const loadStudentsData = async () => {
    setIsLoading(true);
    try {
      const data = await santriService.getStudentsList();
      setStudents(data || []);
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memuat direktori data santri.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsData();
  }, []);

  // Sync data ke form lokal saat pop-up diaktifkan
  useEffect(() => {
    if (selectedStudent) {
      setEditDivisi(selectedStudent.divisi || 'caberawit');
      setEditJenjang(selectedStudent.jenjang || 'PAUD/TK');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedStudent]);

  // Handler Kirim Hasil Mutasi khusus Jenjang & Divisi
  const handleSaveMutation = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSaving(true);
    const toastId = toast.loading('Sedang menyimpan pembaruan penempatan santri...');

    try {
      await santriService.updateStudentMutation(selectedStudent.id, editJenjang, editDivisi);
      toast.success('Mutasi jenjang & divisi berhasil disimpan!', { id: toastId });
      setSelectedStudent(null);
      loadStudentsData(); // Refresh list data screen
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan perubahan mutasi.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (id, name, e) => {
    e.stopPropagation(); // Amankan dari pemicu klik card info
    const toastId = toast.loading(`Memproses generate NIS untuk ${name}...`);
    try {
      await santriService.approveStudent(id);
      toast.success(`Berhasil menyetujui ${name}!`, { id: toastId });
      loadStudentsData();
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal menyetujui data santri.', { id: toastId });
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
    return { total, active, review };
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
          Kelola re-alokasi kelompok divisi pembinaan serta monitoring berkas mutasi tingkat rombel lapangan.
        </p>
      </div>

      {/* BENTO STATISTICS BOX */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm">
          <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-wider">Total Registrasi</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.total}</span>
        </div>
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm border-l-4 border-l-green-600">
          <span className="text-[10px] md:text-xs font-black text-green-700 uppercase tracking-wider">Santri Aktif</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.active}</span>
        </div>
        <div className="bg-white border border-outline-variant/40 rounded-2xl p-4 flex flex-col shadow-sm border-l-4 border-l-orange-500">
          <span className="text-[10px] md:text-xs font-black text-orange-700 uppercase tracking-wider">Butuh Approval</span>
          <span className="text-xl md:text-3xl font-black text-on-surface mt-1">{stats.review}</span>
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
              {chip === 'All Students' ? 'Semua Generus' : chip === 'Active' ? 'Aktif (Ada NIS)' : 'Butuh Approval'}
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
            return (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)} // Tampilkan Detail Pop-up
                className="bg-white rounded-xl border border-outline-variant/30 p-5 flex flex-col gap-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer active:scale-99 relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-black text-xs text-on-surface-variant">
                      {student.nama_lengkap?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface truncate max-w-[180px]">{student.nama_lengkap}</h3>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[9px] font-black bg-surface-container-high px-1.5 rounded uppercase">{student.jenis_kelamin} • {calculateAge(student.tanggal_lahir)} TH</span>
                        {/* RE-ALOKASI LABEL DIVISI & JENJANG DI KARTU UTAMA */}
                        <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 rounded uppercase">{student.divisi || 'caberawit'}</span>
                        <span className="text-[9px] font-black bg-secondary/10 text-secondary px-1.5 rounded uppercase">{student.jenjang || 'Belum Set'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isPending ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {isPending ? 'Review' : 'Aktif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold border-t border-b border-outline-variant/10 py-2.5 my-0.5">
                  <div>
                    <span className="text-outline text-[9px] uppercase font-medium block">Lembaga TPQ</span>
                    <span className="text-on-surface truncate block mt-0.5 font-black">🏛 {student.nama_tpq || 'Tidak Ada'}</span>
                  </div>
                  <div>
                    <span className="text-outline text-[9px] uppercase font-medium block">Kualifikasi</span>
                    <span className="text-on-surface block mt-0.5 font-black">🎓 {student.sudah_mt ? 'Mubaligh MT' : student.pernah_mondok ? 'Eks Mondok' : 'Reguler'}</span>
                  </div>
                </div>

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

      {/* ─── MODAL POP-UP DETAIL INFORMASI & MUTASI EXCLUSIVE TERKUNCI ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[88vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center shrink-0">
              <span className="text-sm font-black flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">id_card</span> Informasi Manifes Detail Santri
              </span>
              <button type="button" onClick={() => setSelectedStudent(null)} className="material-symbols-outlined text-base cursor-pointer p-1 hover:bg-white/10 rounded-full">close</button>
            </div>

            {/* Form Box Scrollable */}
            <form onSubmit={handleSaveMutation} className="p-5 overflow-y-auto space-y-4 text-xs font-semibold scrollbar-none pb-8 sm:pb-5">
              
              {/* SEKSI A: DATA ADMINISTRASI (READ-ONLY / KUNCI TOTAL) */}
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
                    <span className="text-[9px] text-outline block font-medium">Kontak WhatsApp</span>
                    <span className="text-on-surface-variant font-mono font-bold">{selectedStudent.nomor_telepon || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-outline block font-medium">Status Pendaftaran</span>
                    <span className="text-on-surface-variant font-bold uppercase tracking-wide text-[10px]">{selectedStudent.status}</span>
                  </div>
                  <div className="col-span-2 border-t border-dashed border-outline-variant/30 pt-2 mt-1">
                    <span className="text-[9px] text-outline block font-medium">Lembaga TPQ Naungan</span>
                    <span className="text-on-surface font-black text-xs flex items-center gap-1">🏛 {selectedStudent.nama_tpq || 'Belum Terikat'}</span>
                  </div>
                </div>
              </div>

              {/* SEKSI B: HANYA INI YANG BISA DIEDIT/MUTASI OLEH PENGAJAR */}
              <div className="bg-white border-2 border-primary/20 p-4 rounded-xl space-y-3.5 shadow-2xs">
                <span className="text-[9px] text-primary font-black block uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit_square</span> Penempatan Tingkat Mengajar (Bisa Diedit)
                </span>

                {/* Edit Pilihan Rumpun Divisi */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Kelompok Divisi Pembinaan</label>
                  <select 
                    value={editDivisi} 
                    onChange={(e) => { setEditDivisi(e.target.value); setEditJenjang(''); }}
                    className="w-full h-10 border border-outline-variant rounded-xl px-2.5 font-black text-xs bg-white outline-none focus:border-primary"
                    required
                  >
                    <option value="caberawit">Caberawit (PAUD - Kelas 6)</option>
                    <option value="mudamudi">Muda-Mudi (Pra Remaja - Pra Nikah)</option>
                  </select>
                </div>

                {/* Edit Pilihan Sub-Jenjang Kelas */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Tingkat Jenjang Pembinaan Usia</label>
                  <select 
                    value={editJenjang} 
                    onChange={(e) => setEditJenjang(e.target.value)}
                    className="w-full h-10 border border-outline-variant rounded-xl px-2.5 font-black text-xs bg-white text-primary outline-none focus:border-primary"
                    required
                  >
                    <option value="">-- Pilih Jenjang Lapangan --</option>
                    {JURUSAN_JENJANG_OPTIONS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Button Actions */}
              <div className="flex gap-2 pt-3 border-t border-outline-variant/20 shrink-0">
                <button type="button" onClick={() => setSelectedStudent(null)} className="w-1/4 h-10 border border-outline-variant rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">Kembali</button>
                <button type="submit" disabled={isSaving || !editJenjang} className="flex-1 h-10 bg-primary text-on-primary font-black shadow-md rounded-xl hover:bg-primary-container disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1">
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