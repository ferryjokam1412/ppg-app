// src/pages/TeachersPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const { tpqId } = useAuth();
  
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', pob: '', dob: '', gender: 'L',
    statusMubaligh: 'MS', startDuty: '',
    teachingType: 'flexible', assignedClass: 'caberawit_1'
  });

  const loadTeachersData = async () => {
    if (!tpqId) return;
    setLoading(true);
    try {
      const data = await teacherService.getTeachers(tpqId);
      setTeachers(data);
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memuat direktori pengajar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachersData();
  }, [tpqId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Mendaftarkan pengajar baru...');
    try {
      await teacherService.createTeacher(tpqId, formData);
      toast.success('Pengajar berhasil ditambahkan ke database!', { id: toastId });
      setIsModalOpen(false);
      setFormData({
        name: '', pob: '', dob: '', gender: 'L', statusMubaligh: 'MS',
        startDuty: '', teachingType: 'flexible', assignedClass: 'caberawit_1'
      });
      loadTeachersData();
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal menyimpan data.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── KOREKSI UTAMA: CUSTOM INTERACTIVE TOAST CONFIRMATION (NO WINDOW ALERT/CONFIRM) ───
  const handleDeleteTeacher = (id, name) => {
    // Membuka toast kustom yang berisi aksi interaktif
    toast((t) => (
      <div className="flex flex-col gap-3 p-1 text-xs font-semibold text-on-surface-variant max-w-xs select-none">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-lg mt-0.5">warning</span>
          <div>
            <p className="text-on-surface font-bold text-sm">Hapus Data Pengajar?</p>
            <p className="mt-0.5 text-outline leading-relaxed">Apakah Anda yakin ingin menghapus data ustadz/ustadzah <strong>{name}</strong> secara permanen?</p>
          </div>
        </div>
        
        {/* Kontrol Aksi Tombol */}
        <div className="flex justify-end gap-2 pt-1 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)} // Menutup toast jika klik batal
            className="px-3 py-2 border border-outline-variant rounded-xl hover:bg-surface-container-low text-on-surface cursor-pointer font-bold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id); // Tutup toast konfirmasi
              executeDelete(id, name); // Jalankan fungsi hapus riil
            }}
            className="px-3.5 py-2 bg-error text-on-error rounded-xl hover:bg-error-container cursor-pointer font-bold shadow-sm transition-colors"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    ), {
      duration: 6000, // Toast akan bertahan selama 6 detik sebelum menghilang otomatis
      position: 'top-center',
      style: { padding: '12px', minWidth: '300px' }
    });
  };

  // Fungsi internal yang mengeksekusi penghapusan ke Supabase
  const executeDelete = async (id, name) => {
    const actionToastId = toast.loading(`Sedang menghapus data ${name}...`);
    try {
      await teacherService.deleteTeacher(id);
      toast.success('Data pengajar berhasil dihapus!', { id: actionToastId });
      loadTeachersData(); // Segarkan baris grid kartu pengajar
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal menghapus data pengajar.', { id: actionToastId });
    }
  };

  const calculateMasaTugas = (startDutyStr) => {
    if (!startDutyStr) return '-';
    const start = new Date(startDutyStr + '-01');
    const now = new Date();
    
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (totalMonths < 0) return 'Belum Mulai';
    if (totalMonths === 0) return 'Baru Bulan Ini';
    
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    
    let hasilTeks = [];
    if (years > 0) hasilTeks.push(`${years} Tahun`);
    if (remainingMonths > 0) hasilTeks.push(`${remainingMonths} Bulan`);
    
    return hasilTeks.join(' ');
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.nip && t.nip.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalMT = teachers.filter(t => t.statusMubaligh === 'MT').length;
  const totalMS = teachers.filter(t => t.statusMubaligh === 'MS').length;

  const formatClassName = (type, key) => {
    if (type === 'flexible') return 'Flexible (Semua Sesi)';
    if (!key) return '-';
    if (key.startsWith('caberawit_')) return `Caberawit Kelas ${key.replace('caberawit_', '')}`;
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <h1 className="font-headline-lg-mobile text-3xl md:font-headline-lg md:text-4xl text-primary mb-1 font-bold tracking-tight">
            Manajemen Dewan Guru
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Pendaftaran staf pengajar internal TPQ dengan sistem penomoran induk (NIP) otomatis.
          </p>
        </div>
        <button 
          type="button" 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary font-label-md text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-container transition-all shadow-sm font-bold border border-primary/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Daftarkan Staf Baru
        </button>
      </div>

      {/* 2. Mini Bento Statistics Overview */}
      <div className="grid grid-cols-3 gap-4 select-none">
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm text-center">
          <p className="text-outline text-[10px] font-bold uppercase tracking-wide">Total Staf</p>
          <p className="text-xl md:text-2xl text-on-surface font-black mt-1">{loading ? '...' : teachers.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm text-center text-orange-900">
          <p className="text-orange-700/80 text-[10px] font-bold uppercase tracking-wide">Status MT</p>
          <p className="text-xl md:text-2xl font-black mt-1">{loading ? '...' : totalMT}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm text-center text-indigo-900">
          <p className="text-indigo-700/80 text-[10px] font-bold uppercase tracking-wide">Status MS</p>
          <p className="text-xl md:text-2xl font-black mt-1">{loading ? '...' : totalMS}</p>
        </div>
      </div>

      {/* 3. Search Bar Controls */}
      <div className="max-w-md w-full">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input 
            className="w-full bg-white border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            placeholder="Cari berdasarkan nama atau NIP induk..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Tampilan Data Card Grid */}
      {loading ? (
        <div className="w-full h-40 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-xl border border-outline-variant p-5 flex flex-col gap-4 shadow-sm group hover:border-primary/40 transition-all text-xs font-semibold text-on-surface-variant">
                
                <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-3">
                  <div className="w-11 h-11 rounded-xl bg-primary text-white font-black text-lg flex items-center justify-center shadow-inner select-none">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors leading-tight">{teacher.name}</h3>
                    <span className="text-[10px] font-bold bg-surface-container-highest px-2 py-0.5 rounded text-primary border border-outline-variant/60 font-mono mt-1 inline-block">
                      {teacher.nip || 'PENDING NIP'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                    className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors cursor-pointer"
                    title="Hapus Pengajar"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-outline text-[10px] block font-medium">Tempat, Tgl Lahir</span>
                    <span className="text-on-surface block mt-0.5">
                      {teacher.pob}, {teacher.dob ? new Date(teacher.dob).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px] block font-medium">Kategori Dai</span>
                    <span className="text-on-surface block mt-0.5">
                      {teacher.statusMubaligh === 'MT' 
                        ? `${teacher.gender === 'L' ? 'Mubaligh' : 'Mubaleghot'} Tugasan` 
                        : `${teacher.gender === 'L' ? 'Mubaligh' : 'Mubaleghot'} Setempat`
                      }
                    </span>
                  </div>
                  
                  {teacher.statusMubaligh === 'MT' && (
                    <div className="col-span-2 bg-orange-50/60 border border-orange-200 p-3 rounded-xl space-y-1 text-orange-950 text-[11px] leading-relaxed">
                      <div className="flex items-center gap-2 font-bold text-orange-800">
                        <span className="material-symbols-outlined text-sm">Business_Center</span>
                        <span>Mulai Tugas: {teacher.startDuty ? new Date(teacher.startDuty + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-on-surface bg-white/80 border border-orange-200/50 rounded-lg px-2 py-1 w-fit mt-1 shadow-sm">
                        <span className="material-symbols-outlined text-sm text-orange-600">hourglass_empty</span>
                        <span>Masa Tugas: <strong className="text-primary">{calculateMasaTugas(teacher.startDuty)}</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="col-span-2 border-t border-outline-variant/50 pt-2 mt-1">
                    <span className="text-outline text-[10px] block font-medium mb-1">Penugasan / Ploting Mengajar</span>
                    <span className="text-primary font-bold bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">assignment</span>
                      {formatClassName(teacher.teachingType, teacher.assignedClass)}
                    </span>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-outline-variant text-outline">
              <span className="material-symbols-outlined text-4xl mb-1">search_off</span>
              <p className="text-sm font-bold">Belum ada pengajar terdaftar dalam lingkup pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. FORM MODAL INPUT KONDISIONAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant flex flex-col">
            
            <div className="px-6 py-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">badge</span>
                Form Pendaftaran Pengajar Baru
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-outline cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 text-sm font-semibold text-on-surface-variant">
              <div>
                <label className="block mb-1">Nama Lengkap Pengajar</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary bg-white text-on-surface font-medium outline-none" placeholder="Masukkan nama tanpa gelar" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Tempat Lahir</label>
                  <input type="text" name="pob" required value={formData.pob} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary bg-white text-on-surface font-medium outline-none" placeholder="Contoh: Batu" />
                </div>
                <div>
                  <label className="block mb-1">Tanggal Lahir</label>
                  <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary bg-white text-on-surface font-medium outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Jenis Kelamin</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary bg-white text-on-surface font-medium outline-none">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Status Kedaian</label>
                  <select name="statusMubaligh" value={formData.statusMubaligh} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary bg-white text-on-surface font-medium outline-none">
                    <option value="MS">{formData.gender === 'L' ? 'Mubaligh Setempat (MS)' : 'Mubaleghot Setempat (MS)'}</option>
                    <option value="MT">{formData.gender === 'L' ? 'Mubaligh Tugasan (MT)' : 'Mubaleghot Tugasan (MT)'}</option>
                  </select>
                </div>
              </div>

              {formData.statusMubaligh === 'MT' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-1 animate-fadeIn">
                  <label className="block text-xs font-bold text-orange-900">Mulai Tugas Di Daerah</label>
                  <input type="month" name="startDuty" required={formData.statusMubaligh === 'MT'} value={formData.startDuty} onChange={handleInputChange} className="w-full border border-orange-300 rounded-xl p-2.5 bg-white text-on-surface font-medium outline-none text-xs" />
                </div>
              )}

              <div className="border-t border-outline-variant/60 pt-4 space-y-3">
                <label className="block">Metode Pemetaan Wali Kelas</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                    <input type="radio" checked={formData.teachingType === 'flexible'} onChange={() => setFormData(prev => ({ ...prev, teachingType: 'flexible' }))} className="text-primary focus:ring-primary" />
                    Flexible (Bisa Semua Kelas)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                    <input type="radio" checked={formData.teachingType === 'spesifik'} onChange={() => setFormData(prev => ({ ...prev, teachingType: 'spesifik' }))} className="text-primary focus:ring-primary" />
                    Spesifik Wali Kelas
                  </label>
                </div>

                {formData.teachingType === 'spesifik' && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-indigo-900">Pilih Penempatan Mengajar</label>
                    <select name="assignedClass" value={formData.assignedClass} onChange={handleInputChange} className="w-full border border-indigo-300 rounded-xl p-2.5 bg-white text-on-surface font-medium text-xs outline-none">
                      <optgroup label="Kategori Caberawit">
                        <option value="caberawit_1">Caberawit Kelas 1</option>
                        <option value="caberawit_2">Caberawit Kelas 2</option>
                        <option value="caberawit_3">Caberawit Kelas 3</option>
                        <option value="caberawit_4">Caberawit Kelas 4</option>
                        <option value="caberawit_5">Caberawit Kelas 5</option>
                        <option value="caberawit_6">Caberawit Kelas 6</option>
                      </optgroup>
                      <optgroup label="Kategori Muda-Mudi">
                        <option value="pra_remaja">Kelas Pra Remaja</option>
                        <option value="remaja">Kelas Remaja</option>
                        <option value="pra_nikah">Kelas Pra Nikah</option>
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/60 bg-surface-container-lowest -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-low font-bold cursor-pointer transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-bold cursor-pointer shadow-sm transition-all">Simpan Pengajar</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}