// src/pages/admin-portal/InputKegiatanPage.jsx
import { useState, useEffect } from 'react';
import { kegiatanService } from '../../services/admin-portal/kegiatanService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function InputKegiatanPage() {
  const navigate = useNavigate();
  const [tpqOptions, setTpqOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    tpq_id: '',
    deskripsi: '',
    tanggal_laksana: '',
    lokasi: '',
    banner_url: ''
  });

  useEffect(() => {
    const loadTpqData = async () => {
      try {
        const data = await kegiatanService.getTpqOptions();
        setTpqOptions(data);
      } catch (err) {
        console.error(err.message);
        toast.error('Gagal mengambil daftar master data TPQ.');
      }
    };
    loadTpqData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const clearError = { ...prev };
        delete clearError[name];
        return clearError;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Berkas foto terlalu besar! Maksimal batasan adalah 5MB.');
        return;
      }
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, banner_url: 'https://lh3.googleusercontent.com/uploaded_image_mock' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentErrors = {};
    const requiredFields = [
      { key: 'nama_kegiatan', label: 'Nama Kegiatan' },
      { key: 'tpq_id', label: 'Nama TPQ yang Input' },
      { key: 'deskripsi', label: 'Deskripsi & Detail' },
      { key: 'tanggal_laksana', label: 'Tanggal Terlaksana' },
      { key: 'lokasi', label: 'Lokasi' }
    ];

    requiredFields.forEach(field => {
      if (!formData[field.key]) {
        currentErrors[field.key] = 'Belum terisi';
      }
    });

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      toast.error('Ada kolom wajib berita kegiatan yang terlewat!');
      
      const firstErrorId = Object.keys(currentErrors)[0];
      const element = document.getElementById(firstErrorId);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sedang menerbitkan berita kegiatan...');

    try {
      await kegiatanService.submitKegiatan(formData);
      toast.success('Berita kegiatan berhasil disimpan ke sistem!', { id: toastId });
      setFormData({ nama_kegiatan: '', tpq_id: '', deskripsi: '', tanggal_laksana: '', lokasi: '', banner_url: '' });
      setImagePreview(null);
      setErrors({});
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memproses data kegiatan ke database.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col selection:bg-secondary-container">
      
      {/* HEADER: Bersih Tanpa Tombol Kembali */}
      <header className="bg-background w-full top-0 sticky z-50 shadow-sm border-b border-outline-variant h-16 flex items-center select-none">
        <div className="flex justify-between items-center px-6 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">dashboard_customization</span>
            <h1 className="font-headline-md text-lg font-black text-primary">PPG Admin Portal</h1>
          </div>
          <button type="button" className="text-on-surface-variant font-label-md px-4 py-2 hover:bg-surface-container transition-colors rounded-full font-bold text-xs cursor-pointer">Portal Keluar</button>
        </div>
      </header>

      {/* CANVAS UTAMA LAYAR LEBAR (WEB ACCESSIBLE) */}
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 w-full flex-grow flex flex-col justify-center">
        
        <div className="mb-6 md:mb-8 select-none">
          <h2 className="font-headline-lg-mobile text-2xl md:text-3xl text-on-surface mb-1.5 font-bold tracking-tight">Input Kegiatan Baru</h2>
          <p className="text-on-surface-variant text-xs md:text-sm font-medium leading-relaxed">Formulir internal manajemen kurikulum dan publikasi agenda silsilah daerah PPG Kota Batu.</p>
        </div>

        {/* CONTAINER KARTU FORM UTAMA BENTO GRID STYLE */}
        <div className="bg-white rounded-2xl border border-outline-variant p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Nama Kegiatan (Full Width) */}
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="font-label-md text-xs font-bold text-on-surface ml-1" htmlFor="nama_kegiatan">Nama Agenda Kegiatan</label>
              <input 
                name="nama_kegiatan" id="nama_kegiatan" type="text"
                className={`w-full h-12 bg-surface border rounded-xl px-4 text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                  errors.nama_kegiatan ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' : 'border-outline-variant focus:ring-primary focus:border-primary'
                }`} 
                placeholder="Contoh: Musyawarah Guru Tarbiyah Triwulan"
                value={formData.nama_kegiatan} onChange={handleInputChange}
              />
              {errors.nama_kegiatan && <p className="text-red-500 text-[11px] font-bold ml-1 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">error</span>{errors.nama_kegiatan}</p>}
            </div>

            {/* 2. Nama TPQ Penginput (Full Width) */}
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="font-label-md text-xs font-bold text-on-surface ml-1" htmlFor="tpq_id">Nama Instansi TPQ Penyelenggara</label>
              <div className="relative">
                <select 
                  name="tpq_id" id="tpq_id"
                  className={`w-full h-12 bg-surface border rounded-xl px-4 appearance-none text-sm font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    errors.tpq_id ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' : 'border-outline-variant focus:ring-primary focus:border-primary'
                  }`}
                  value={formData.tpq_id} onChange={handleInputChange}
                >
                  <option value="">Pilih Opsi Unit Tempat Sambung</option>
                  {tpqOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              {errors.tpq_id && <p className="text-red-500 text-[11px] font-bold ml-1 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">error</span>{errors.tpq_id}</p>}
            </div>

            {/* 3. Tanggal Terlaksana (Kolom Kiri di Desktop) */}
            <div className="space-y-1.5 flex flex-col col-span-1">
              <label className="font-label-md text-xs font-bold text-on-surface ml-1" htmlFor="tanggal_laksana">Tanggal Terlaksana</label>
              <input 
                name="tanggal_laksana" id="tanggal_laksana" type="date"
                className={`w-full h-12 bg-surface border rounded-xl px-4 text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                  errors.tanggal_laksana ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' : 'border-outline-variant focus:ring-primary focus:border-primary'
                }`} 
                value={formData.tanggal_laksana} onChange={handleInputChange}
              />
              {errors.tanggal_laksana && <p className="text-red-500 text-[11px] font-bold ml-1 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">error</span>{errors.tanggal_laksana}</p>}
            </div>

            {/* 4. Tempat / Lokasi (Kolom Kanan di Desktop) */}
            <div className="space-y-1.5 flex flex-col col-span-1">
              <label className="font-label-md text-xs font-bold text-on-surface ml-1" htmlFor="lokasi">Lokasi / Tempat Pelaksanaan</label>
              <div className="relative">
                <input 
                  name="lokasi" id="lokasi" type="text"
                  className={`w-full h-12 bg-surface border rounded-xl pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                    errors.lokasi ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' : 'border-outline-variant focus:ring-primary focus:border-primary'
                  }`} 
                  placeholder="Misal: Lantai Utama Masjid Luhur"
                  value={formData.lokasi} onChange={handleInputChange}
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">location_on</span>
              </div>
              {errors.lokasi && <p className="text-red-500 text-[11px] font-bold ml-1 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">error</span>{errors.lokasi}</p>}
            </div>

            {/* 5. Deskripsi Detail (Full Width) */}
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="font-label-md text-xs font-bold text-on-surface ml-1" htmlFor="deskripsi">Deskripsi Lengkap Berita Kegiatan</label>
              <textarea 
                name="deskripsi" id="deskripsi" rows="4"
                className={`w-full bg-surface border rounded-xl p-4 text-sm font-semibold focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.deskripsi ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' : 'border-outline-variant focus:ring-primary focus:border-primary'
                }`} 
                placeholder="Tuliskan runtunan acara, pengumuman instruksi sanksi, atau detail target pencapaian..."
                value={formData.deskripsi} onChange={handleInputChange}
            	></textarea>
              {errors.deskripsi && <p className="text-red-500 text-[11px] font-bold ml-1 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">error</span>{errors.deskripsi}</p>}
            </div>

            {/* 6. Upload Foto Dokumentasi Banner (Full Width) */}
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="font-label-md text-xs font-bold text-on-surface block ml-1">Banner Grafis / Dokumentasi Foto Kegiatan</label>
              <div className="relative w-full aspect-video md:h-56 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors overflow-hidden group">
                <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                
                <div className="flex flex-col items-center group-hover:scale-105 transition-transform select-none">
                  <span className="material-symbols-outlined text-primary text-4xl mb-1.5">add_a_photo</span>
                  <p className="text-xs font-bold text-on-surface-variant">Klik untuk unggah berkas gambar</p>
                  <p className="text-[10px] text-outline mt-0.5 uppercase tracking-wider font-semibold">Format: JPG, JPEG, PNG (Maksimal 5MB)</p>
                </div>

                {imagePreview && (
                  <div className="absolute inset-0 z-20 animate-fadeIn">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }}></div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-sm">cached</span> Ganti Berkas Banner
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONTROLS ACTION BUTTONS: BERDAMPINGAN DI SUDUT FORM CARD */}
            <div className="md:col-span-2 pt-4 border-t border-outline-variant/40 flex justify-end items-center gap-4 select-none">
              <button 
                type="button" 
                disabled={isSubmitting} 
                onClick={() => navigate(-1)} // Navigasi mundur kembali ke dashboard utama admin
                className="px-6 h-12 rounded-xl text-xs font-bold text-on-surface-variant border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="px-8 h-12 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-md hover:bg-primary-container disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">save</span>
                {isSubmitting ? 'Proses Menyimpan...' : 'Simpan Berita Kegiatan'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}