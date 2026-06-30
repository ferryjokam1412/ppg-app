// src/pages/InstitutionProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { institutionService } from '../services/institutionService';
import toast from 'react-hot-toast';

export default function InstitutionProfilePage() {
  const { tpqId } = useAuth();
  const fileInputRef = useRef(null);
  
  // ─── STATE UTAMA ───
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── STATE UPLOAD MEDIA ───
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [uploadType, setUploadType] = useState('logo'); // 'logo', 'cover', atau 'headmaster'

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    coverUrl: '',
    headmasterAvatarUrl: '',
    address: '',
    mapsUrl: '',
    sambung: '',
    headmasterName: '',
    headmasterPhone: '',
    jadwalBelajar: {}
  });

  const loadProfile = async () => {
    if (!tpqId) return;
    setLoading(true);
    try {
      const data = await institutionService.getProfile(tpqId);
      setProfileData(data);
      setFormData({
        name: data.name,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        headmasterAvatarUrl: data.headmaster.avatarUrl,
        address: data.address,
        mapsUrl: data.mapsUrl,
        sambung: data.sambung,
        headmasterName: data.headmaster.name,
        headmasterPhone: data.headmaster.whatsappUrl.replace('https://wa.me/', ''),
        jadwalBelajar: data.jadwalBelajar
      });
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memuat profil lembaga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [tpqId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ─── LOGIKA STRUKTUR HARI & DYNAMIC KELAS CABERAWIT ───
  const handleDayToggle = (category, currentDaysString, day, subCategory = null) => {
    const daysArray = currentDaysString ? currentDaysString.split(', ').map(d => d.trim()) : [];
    let updatedDaysArray;

    if (daysArray.includes(day)) {
      updatedDaysArray = daysArray.filter(d => d !== day);
    } else {
      const order = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      updatedDaysArray = [...daysArray, day].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }

    const updatedString = updatedDaysArray.join(', ');

    setFormData(prev => {
      const updatedJadwal = { ...prev.jadwalBelajar };
      if (subCategory) {
        updatedJadwal[category][subCategory]['hari'] = updatedString;
      } else {
        updatedJadwal[category]['hari'] = updatedString;
      }
      return { ...prev, jadwalBelajar: updatedJadwal };
    });
  };

  const handleJadwalTimeChange = (category, field, value, subCategory = null) => {
    setFormData(prev => {
      const updatedJadwal = { ...prev.jadwalBelajar };
      if (subCategory) {
        updatedJadwal[category][subCategory][field] = value;
      } else {
        updatedJadwal[category][field] = value;
      }
      return { ...prev, jadwalBelajar: updatedJadwal };
    });
  };

  const handleJumlahKelasCaberawitChange = (val) => {
    const count = Math.max(0, parseInt(val) || 0);
    setFormData(prev => {
      const updatedJadwal = { ...prev.jadwalBelajar };
      updatedJadwal.caberawit = updatedJadwal.caberawit || {};
      updatedJadwal.caberawit.jumlah_kelas = count;
      
      const currentRincian = updatedJadwal.caberawit.rincian_kelas || [];
      updatedJadwal.caberawit.rincian_kelas = Array.from({ length: count }, (_, i) => currentRincian[i] || '');
      
      return { ...prev, jadwalBelajar: updatedJadwal };
    });
  };

  const handleRincianKelasChange = (index, value) => {
    setFormData(prev => {
      const updatedJadwal = { ...prev.jadwalBelajar };
      updatedJadwal.caberawit.rincian_kelas[index] = value;
      return { ...prev, jadwalBelajar: updatedJadwal };
    });
  };

  // ─── LOGIKA CLICK PHOTO & VALIDASI UPLOAD ───
  const openUploadGuidelines = (type) => {
    setUploadType(type);
    setIsUploadPopupOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      toast.error('Gagal: Ukuran file melebihi batas syarat maksimal 5 MB!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      const targetField = uploadType === 'logo' 
        ? 'logoUrl' 
        : uploadType === 'cover' 
          ? 'coverUrl' 
          : 'headmasterAvatarUrl';

      const updatedForm = { ...formData, [targetField]: base64String };
      
      const toastId = toast.loading('Mengunggah berkas gambar...');
      try {
        await institutionService.updateProfile(tpqId, updatedForm);
        toast.success('Foto komponen profil berhasil diperbarui!', { id: toastId });
        setIsUploadPopupOpen(false);
        loadProfile();
      } catch (err) {
        toast.error('Gagal mengunggah foto ke database.', { id: toastId });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Memperbarui informasi lembaga...');
    try {
      await institutionService.updateProfile(tpqId, formData);
      toast.success('Profil lembaga berhasil disimpan!', { id: toastId });
      setIsEditModalOpen(false);
      loadProfile();
    } catch (err) {
      console.error(err.message);
      toast.error('Gagal memperbarui data.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-on-surface-variant animate-pulse">Memuat Profil...</p>
      </div>
    );
  }

  const tpqInitial = profileData.name ? profileData.name.charAt(0).toUpperCase() : 'T';
  const headmasterInitial = profileData.headmaster.name ? profileData.headmaster.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full space-y-8 md:space-y-12">
      
      {/* 1. Header Banner Section */}
      <section className="relative rounded-xl overflow-hidden bg-white soft-shadow border border-outline-variant select-none">
        <div onClick={() => openUploadGuidelines('cover')} className="h-32 md:h-48 w-full relative overflow-hidden cursor-pointer group">
          {profileData.coverUrl ? (
            <img src={profileData.coverUrl} alt="Sampul TPQ" className="w-full h-full object-cover transition-all group-hover:brightness-75 duration-200" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${profileData.bannerColor} flex items-center justify-center group-hover:brightness-90 transition-all`}>
              <h2 className="text-white font-bold text-2xl md:text-4xl tracking-widest drop-shadow-md uppercase opacity-90 font-headline-xl">PPG Kota Batu</h2>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs gap-2">
            <span className="material-symbols-outlined text-xl">photo_camera</span> Ganti Foto Sampul (16:9)
          </div>
        </div>
        
        <div className="px-6 pb-6 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
          <div onClick={() => openUploadGuidelines('logo')} className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-white bg-white overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center cursor-pointer relative group">
            {profileData.logoUrl ? (
              <img className="w-full h-full object-cover group-hover:brightness-75 transition-all" alt={`Logo ${profileData.name}`} src={profileData.logoUrl} />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-white text-5xl md:text-6xl font-black rounded-lg group-hover:bg-primary/90 transition-all">
                {tpqInitial}
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white text-[10px] font-bold text-center p-1">
              <span className="material-symbols-outlined text-lg mb-0.5">add_a_photo</span> Ubah Logo (1:1)
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1 pb-2">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 border border-green-300 font-label-md text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-[16px] filled-icon text-green-700">check_circle</span> Status: Aktif
            </div>
            <h1 className="font-headline-xl text-3xl md:text-4xl text-on-surface font-bold tracking-tight">{profileData.name}</h1>
          </div>
          
          <div className="pb-2">
            <button type="button" onClick={() => setIsEditModalOpen(true)} className="bg-primary text-on-primary font-label-md text-sm px-6 py-3 rounded-xl hover:bg-primary-container transition-colors flex items-center gap-2 cursor-pointer font-semibold shadow-sm">
              <span className="material-symbols-outlined text-base">edit</span> Edit Profil Lembaga
            </button>
          </div>
        </div>
      </section>

      {/* 2. Grid Informasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-6">
          
          {/* Card Informasi Umum */}
          <section className="bg-white rounded-xl p-6 soft-shadow border border-outline-variant">
            <h2 className="font-headline-lg text-xl md:text-2xl text-primary flex items-center gap-3 mb-6 font-bold">
              <span className="material-symbols-outlined fill-icon text-secondary">info</span> Informasi Umum
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/50 text-sm">
                <span className="material-symbols-outlined text-primary mt-0.5 text-xl">location_on</span>
                <div className="flex-1">
                  <h3 className="font-label-md text-on-surface mb-1 font-bold">Alamat Lengkap</h3>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">{profileData.address}</p>
                  <a href={profileData.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-primary font-label-md font-bold hover:underline">
                    <span className="material-symbols-outlined text-base">map</span> Lihat di Google Maps
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold">
                
                {/* INFORMASI SAMBUNG (MURNI READ ONLY, TIDAK BISA DIUBAH) */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-outline-variant/50 bg-surface-container-low/30 select-none">
                  <span className="material-symbols-outlined text-primary text-xl">link</span>
                  <div>
                    <h3 className="font-label-md text-xs text-on-surface-variant/80 font-bold">Sambung</h3>
                    <p className="font-body-md text-on-surface text-base mt-0.5 font-bold">{profileData.sambung}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setIsJadwalModalOpen(true)} className="flex items-center gap-4 p-4 rounded-lg border border-primary/40 bg-primary/5 text-left hover:bg-primary/10 transition-all group cursor-pointer">
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">schedule</span>
                  <div className="flex-1">
                    <h3 className="font-label-md text-primary text-xs font-bold">Waktu Belajar</h3>
                    <p className="font-body-md text-on-surface text-sm mt-0.5 font-bold flex items-center gap-1 text-primary">
                      Lihat Detail Kategori <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </section>

          {/* Card Kontak Kepala Lembaga */}
          <section className="bg-white rounded-xl p-6 soft-shadow border border-outline-variant">
            <h2 className="font-headline-lg text-xl md:text-2xl text-primary flex items-center gap-3 mb-6 font-bold">
              <span className="material-symbols-outlined fill-icon text-secondary">contact_phone</span> Kontak Kepala TPQ
            </h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/50">
              
              <div onClick={() => openUploadGuidelines('headmaster')} className="w-24 h-24 rounded-full overflow-hidden bg-primary-container border-2 border-primary-fixed shrink-0 shadow-sm relative group cursor-pointer flex items-center justify-center">
                {profileData.headmaster.avatarUrl ? (
                  <img className="w-full h-full object-cover group-hover:brightness-75 transition-all" alt={profileData.headmaster.name} src={profileData.headmaster.avatarUrl} />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-white text-3xl font-black rounded-full group-hover:bg-secondary/90 transition-all">
                    {headmasterInitial}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white text-[9px] font-bold text-center p-1">
                  <span className="material-symbols-outlined text-sm mb-0.5">photo_camera</span> Ganti Foto
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-headline-md text-lg md:text-xl text-on-surface font-bold tracking-tight leading-tight">{profileData.headmaster.name}</h3>
                <p className="font-body-md text-sm text-on-surface-variant mt-1 font-medium">{profileData.headmaster.role}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4 text-sm font-bold">
                  <a href={profileData.headmaster.whatsappUrl} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl hover:bg-[#128C7E] flex items-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-base">chat</span> Hubungi via WhatsApp
                  </a>
                  <a href={profileData.headmaster.phoneUrl} className="border border-primary text-primary bg-white px-5 py-2.5 rounded-xl hover:bg-primary-container/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">call</span> Telepon
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Kolom Kanan */}
        <div className="md:col-span-4 space-y-6">
          <section className="bg-tertiary rounded-xl p-6 soft-shadow border border-tertiary-container text-on-tertiary select-none">
            <h2 className="font-headline-md text-lg md:text-xl flex items-center gap-3 mb-6 font-bold">
              <span className="material-symbols-outlined fill-icon text-secondary-fixed">bar_chart</span> Statistik Lembaga
            </h2>
            <div className="space-y-4 text-sm font-semibold">
              {[
                { label: 'Jumlah Santri', val: profileData.stats.students, icon: 'group', iconStyle: 'bg-primary-container text-on-primary-container' },
                { label: 'Jumlah Guru', val: profileData.stats.teachers, icon: 'school', iconStyle: 'bg-secondary-container text-on-secondary-container' },
                { label: 'Kelas Caberawit (Dinamis)', val: profileData.stats.classrooms, icon: 'meeting_room', iconStyle: 'bg-surface-container-highest text-on-surface' }
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${stat.iconStyle}`}>
                      <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-tertiary-fixed-dim text-xs font-medium">{stat.label}</p>
                      <p className="text-2xl text-white font-bold mt-0.5">{stat.val}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 3. MODAL POPUP PERSYARATAN UPLOAD SYARAT GAMBAR */}
      {isUploadPopupOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-outline-variant space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Syarat Unggah Foto {uploadType === 'logo' ? 'Profil' : uploadType === 'cover' ? 'Sampul' : 'Kepala TPQ'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Spesifikasi wajib berkas foto:</p>
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 text-left text-xs font-bold space-y-2.5 text-on-surface-variant">
              <div className="flex justify-between items-center">
                <span>Kapasitas File:</span>
                <span className="text-error bg-error-container/20 px-2 py-0.5 rounded text-[11px]">Maksimal 5 MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rasio Dimensi Ukuran:</span>
                <span className="text-primary bg-primary-container/20 px-2 py-0.5 rounded text-[11px]">
                  {uploadType === 'cover' ? '16:9 (Landscape)' : '1:1 (Persegi)'}
                </span>
              </div>
            </div>

            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsUploadPopupOpen(false)} className="flex-1 py-3 text-xs font-bold border border-outline-variant rounded-xl hover:bg-surface-container-low cursor-pointer">Batal</button>
              <button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 py-3 text-xs font-bold bg-primary text-on-primary rounded-xl hover:bg-primary-container cursor-pointer shadow-sm">Pilih Foto</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL POPUP JADWAL BELAJAR & RINCIAN KELAS CABERAWIT VIEWER */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-outline-variant space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">schedule</span> Detail Kategori Waktu Belajar
              </h2>
              <button type="button" onClick={() => setIsJadwalModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-outline cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 space-y-3">
                <div className="flex items-center gap-2 text-orange-800 font-bold text-base border-b border-orange-100 pb-1.5">
                  <span className="material-symbols-outlined">child_care</span> Kategori Caberawit
                </div>
                <p className="font-semibold text-on-surface-variant">Hari: <span className="text-on-surface font-bold">{profileData.jadwalBelajar.caberawit?.hari || 'Belum diatur'}</span></p>
                <p className="font-semibold text-on-surface-variant mt-1">Waktu: <span className="text-on-surface font-bold">{profileData.jadwalBelajar.caberawit?.waktu || 'Belum diatur'}</span></p>
                
                <div className="mt-3 pt-2.5 border-t border-dashed border-orange-200">
                  <p className="text-xs font-bold text-orange-900 uppercase tracking-wide mb-2">
                    Pembagian Kelompok Kelas ({profileData.jadwalBelajar.caberawit?.jumlah_kelas || 0} Kelas):
                  </p>
                  {profileData.jadwalBelajar.caberawit?.rincian_kelas && profileData.jadwalBelajar.caberawit.rincian_kelas.length > 0 ? (
                    <ul className="space-y-1.5 pl-1">
                      {profileData.jadwalBelajar.caberawit.rincian_kelas.map((rincian, i) => (
                        <li key={i} className="flex items-center gap-2 font-bold text-xs text-on-surface">
                          <span className="w-5 h-5 rounded bg-orange-200 text-orange-800 flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                          {rincian || 'Nama kelompok belum diisi'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-outline">Belum ada pembagian kelompok rincian kelas.</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                <div className="flex justify-between items-center text-indigo-800 font-bold text-base border-b border-indigo-100 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">groups</span> Kategori Muda-Mudi
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${profileData.jadwalBelajar.muda_mudi?.is_serentak ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                    {profileData.jadwalBelajar.muda_mudi?.is_serentak ? 'Serentak' : 'Berbeda Hari/Waktu'}
                  </span>
                </div>

                {profileData.jadwalBelajar.muda_mudi?.is_serentak ? (
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-xs uppercase tracking-wide mb-1">Jadwal Serentak (Pra Remaja, Remaja, Pra Nikah)</p>
                    <p className="font-semibold text-on-surface-variant">Hari: <span className="text-on-surface font-bold">{profileData.jadwalBelajar.muda_mudi?.hari_serentak}</span></p>
                    <p className="font-semibold text-on-surface-variant mt-0.5">Waktu: <span className="text-on-surface font-bold">{profileData.jadwalBelajar.muda_mudi?.waktu_serentak}</span></p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'pra_remaja', label: 'Pra Remaja' },
                      { key: 'remaja', label: 'Remaja' },
                      { key: 'pra_nikah', label: 'Pra Nikah' }
                    ].map(sub => (
                      <div key={sub.key} className="p-2.5 bg-white rounded-lg border border-indigo-100">
                        <p className="font-bold text-indigo-900 text-xs mb-1">{sub.label}</p>
                        <div className="flex gap-4 text-xs font-semibold text-on-surface-variant">
                          <span>Hari: <strong className="text-on-surface">{profileData.jadwalBelajar.muda_mudi?.[sub.key]?.hari || 'Belum diatur'}</strong></span>
                          <span>Jam: <strong className="text-on-surface">{profileData.jadwalBelajar.muda_mudi?.[sub.key]?.waktu || 'Belum diatur'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL FORM EDIT UTAMA PROFIL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">edit_square</span> Edit Informasi Lembaga
              </h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-outline cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 flex-1 text-sm font-semibold text-on-surface-variant">
              
              {/* INPUT NAMA SEKARANG PENUH, INPUT SAMBUNG DIHAPUS TOTAL AGAR TIDAK BISA DIUBAH */}
              <div>
                <label className="block mb-1.5 pl-1">Nama Lembaga TPQ</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium" />
              </div>

              <div>
                <label className="block mb-1.5 pl-1">Alamat Lengkap Lembaga</label>
                <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 pl-1">Link Google Maps URL</label>
                  <input type="text" name="mapsUrl" value={formData.mapsUrl} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium" />
                </div>
                <div>
                  <label className="block mb-1.5 pl-1">Jumlah Kelas Statis</label>
                  <input type="number" name="classrooms" value={formData.classrooms} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium" />
                </div>
              </div>

              {/* MANAJEMEN JADWAL & DINAMIS PEMBAGIAN KELAS CABERAWIT */}
              <div className="border-t border-outline-variant/60 pt-4 space-y-4">
                <h3 className="text-base font-bold text-primary flex items-center gap-1.5"><span className="material-symbols-outlined text-lg">edit_calendar</span> Manajemen Jadwal Kategori</h3>
                
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/20 space-y-4">
                  <div className="text-orange-800 font-bold text-xs uppercase tracking-wider">Form Caberawit</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1">Jam Operasional Belajar</label>
                      <input type="text" value={formData.jadwalBelajar.caberawit?.waktu || ''} onChange={(e) => handleJadwalTimeChange('caberawit', 'waktu', e.target.value)} className="w-full border border-outline-variant rounded-xl p-2.5 bg-white text-on-surface font-medium text-xs focus:border-primary outline-none" placeholder="Misal: 15:30 - 17:00 WIB" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Jumlah Pembagian Kelas Caberawit</label>
                      <input type="number" value={formData.jadwalBelajar.caberawit?.jumlah_kelas || 0} onChange={(e) => handleJumlahKelasCaberawitChange(e.target.value)} className="w-full border border-orange-300 rounded-xl p-2.5 bg-white text-on-surface font-bold text-xs focus:border-orange-500 outline-none" placeholder="Masukkan jumlah kelas, contoh: 3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Pilih Hari Belajar Caberawit</label>
                    <DaySelectorButtons selectedDaysString={formData.jadwalBelajar.caberawit?.hari || ''} onToggleDay={(day) => handleDayToggle('caberawit', formData.jadwalBelajar.caberawit?.hari || '', day)} />
                  </div>

                  {(formData.jadwalBelajar.caberawit?.jumlah_kelas || 0) > 0 && (
                    <div className="pt-3 border-t border-orange-200/60 space-y-3">
                      <p className="text-[11px] font-bold text-orange-900 uppercase tracking-wide">Tulis Rincian Kelompok Pembagian Kelas:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.jadwalBelajar.caberawit.rincian_kelas.map((rincianText, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="block text-[11px] text-on-surface-variant font-medium">Rincian Nama Kelas {idx + 1}</label>
                            <input type="text" required value={rincianText} onChange={(e) => handleRincianKelasChange(idx, e.target.value)} className="w-full border border-outline-variant rounded-xl p-2.5 bg-white text-on-surface font-medium text-xs focus:border-orange-500 outline-none" placeholder={`Contoh: ${idx === 0 ? 'Paud/TK' : idx === 1 ? 'SD 1,2,3' : 'SD 4,5,6'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-indigo-100 pb-2">
                    <div className="text-indigo-800 font-bold text-xs uppercase tracking-wider">Form Muda-Mudi (Pra Remaja, Remaja, Pra Nikah)</div>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={formData.jadwalBelajar.muda_mudi?.is_serentak === true} onChange={() => handleJadwalTimeChange('muda_mudi', 'is_serentak', true)} className="text-indigo-600 focus:ring-indigo-500" /> Serentak
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={formData.jadwalBelajar.muda_mudi?.is_serentak === false} onChange={() => handleJadwalTimeChange('muda_mudi', 'is_serentak', false)} className="text-indigo-600 focus:ring-indigo-500" /> Berbeda Waktu/Hari
                      </label>
                    </div>
                  </div>

                  {formData.jadwalBelajar.muda_mudi?.is_serentak ? (
                    <div className="space-y-3 bg-white p-3 rounded-xl border border-indigo-100">
                      <div>
                        <label className="block text-xs mb-1">Pilih Hari Serentak</label>
                        <DaySelectorButtons selectedDaysString={formData.jadwalBelajar.muda_mudi?.hari_serentak || ''} onToggleDay={(day) => handleDayToggle('muda_mudi', formData.jadwalBelajar.muda_mudi?.hari_serentak || '', day)} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Waktu Jam Serentak</label>
                        <input type="text" value={formData.jadwalBelajar.muda_mudi?.waktu_serentak || ''} onChange={(e) => handleJadwalTimeChange('muda_mudi', 'waktu_serentak', e.target.value)} className="w-full border border-outline-variant rounded-xl p-2.5 bg-surface-container-low text-on-surface font-medium text-xs focus:border-indigo-500 outline-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: 'pra_remaja', label: 'Jadwal Kelas Pra Remaja' },
                        { key: 'remaja', label: 'Jadwal Kelas Remaja' },
                        { key: 'pra_nikah', label: 'Jadwal Kelas Pra Nikah' }
                      ].map(sub => (
                        <div key={sub.key} className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2">
                          <div className="text-indigo-900 font-bold text-[11px] uppercase">{sub.label}</div>
                          <div>
                            <label className="block text-[10px] text-outline mb-1">Pilih Hari</label>
                            <DaySelectorButtons selectedDaysString={formData.jadwalBelajar.muda_mudi?.[sub.key]?.hari || ''} onToggleDay={(day) => handleDayToggle('muda_mudi', formData.jadwalBelajar.muda_mudi?.[sub.key]?.hari || '', day, sub.key)} />
                          </div>
                          <div>
                            <input type="text" placeholder="Jam Belajar (Contoh: 19:30 WIB)" value={formData.jadwalBelajar.muda_mudi?.[sub.key]?.waktu || ''} onChange={(e) => handleJadwalTimeChange('muda_mudi', 'waktu', e.target.value, sub.key)} className="w-full border border-outline-variant rounded-xl p-2.5 bg-surface-container-low text-on-surface font-medium text-xs focus:border-indigo-500 outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Kepala */}
              <div className="pt-4 border-t border-outline-variant/60">
                <h3 className="text-base font-bold text-primary mb-3">Informasi Kepala TPQ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 pl-1">Nama Kepala Lembaga</label>
                    <input type="text" name="headmasterName" value={formData.headmasterName} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium" />
                  </div>
                  <div>
                    <label className="block mb-1.5 pl-1">No. WhatsApp</label>
                    <input type="text" name="headmasterPhone" value={formData.headmasterPhone} onChange={handleInputChange} className="w-full border border-outline-variant rounded-xl p-3 focus:border-primary outline-none bg-white text-on-surface font-medium" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/60 bg-surface-container-lowest -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button type="button" disabled={isSubmitting} onClick={() => setIsEditModalOpen(false)} className="px-5 py-3 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-low font-bold cursor-pointer transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function DaySelectorButtons({ selectedDaysString, onToggleDay }) {
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const currentDaysArray = selectedDaysString ? selectedDaysString.split(', ').map(d => d.trim()) : [];

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {daysOfWeek.map(day => {
        const isSelected = currentDaysArray.includes(day);
        return (
          <button type="button" key={day} onClick={() => onToggleDay(day)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isSelected ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}>
            {day}
          </button>
        );
      })}
    </div>
  );
}