// src/pages/PendaftaranPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { pendaftaranService } from '../services/pendaftaranService';
import toast from 'react-hot-toast';

// Sub-komponen InputField dengan tambahan deteksi error visual
const InputField = ({ label, id, name, type = 'text', placeholder, icon, error, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full text-xs font-semibold text-on-surface-variant">
    {label && <label className="text-sm text-on-surface font-bold" htmlFor={id}>{label}</label>}
    <div className="relative">
      {icon && <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">{icon}</span>}
      <input
        className={`w-full bg-surface text-on-surface border rounded-xl py-3 font-medium text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-on-surface-variant/40 ${icon ? 'pl-11 pr-4' : 'px-4'} ${
          error 
            ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' 
            : 'border-outline-variant focus:ring-primary focus:border-primary'
        }`}
        id={id} name={name} type={type} placeholder={placeholder} {...props}
      />
    </div>
    {error && (
      <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-1 animate-fadeIn">
        <span className="material-symbols-outlined text-xs">error</span>{error}
      </p>
    )}
  </div>
);

// Sub-komponen SelectField dengan tambahan deteksi error visual
const SelectField = ({ label, id, name, options, icon, value, error, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full text-xs font-semibold text-on-surface-variant">
    {label && <label className="text-sm text-on-surface font-bold" htmlFor={id}>{label}</label>}
    <div className="relative">
      {icon && <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">{icon}</span>}
      <select
        className={`w-full bg-surface text-on-surface border rounded-xl py-3 font-medium text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer ${icon ? 'pl-11 pr-10' : 'pl-4 pr-10'} ${
          error 
            ? 'border-red-500 bg-red-50/10 focus:ring-red-200 focus:border-red-500' 
            : 'border-outline-variant focus:ring-primary focus:border-primary'
        }`}
        id={id} name={name} value={value} {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} hidden={opt.hidden}>{opt.label}</option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">arrow_drop_down</span>
    </div>
    {error && (
      <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-1 animate-fadeIn">
        <span className="material-symbols-outlined text-xs">error</span>{error}
      </p>
    )}
  </div>
);

export default function PendaftaranPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [sambungOptions, setSambungOptions] = useState([]);
  const [masterMateri, setMasterMateri] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materiStates, setMateriStates] = useState({});
  const [errors, setErrors] = useState({}); 
  
  // ─── STATE BARU: POPUP KEBERHASILAN PENDAFTARAN ───
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    nama_lengkap: '', tempat_lahir: '', tanggal_lahir: '', gender: '',
    nama_sekolah: '', nama_sekolah_lainnya: '', alamat_sambung: '',
    nama_ayah: '', nama_ibu: '', nomor_telepon: '', alamat_lengkap: '', persetujuan: false,
    hobi: '', minat_bakat: '', pernah_mondok: false, sudah_mt: false,
    punya_sosmed: 'tidak', 
    sosial_media: [{ platform: 'Instagram', username: '' }] 
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [options, materiData] = await Promise.all([
          pendaftaranService.getSambungOptions(),
          pendaftaranService.getKurikulumMateri()
        ]);
        setSambungOptions([{ value: '', label: 'Pilih Alamat Sambung...', disabled: true }, ...options]);
        setMasterMateri(materiData || []);
      } catch (err) {
        console.error(err.message);
        toast.error('Gagal menyelaraskan data kurikulum dari server.');
      }
    };
    fetchInitialData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const addSosmedField = () => {
    setFormData(prev => ({
      ...prev,
      sosial_media: [...prev.sosial_media, { platform: 'Instagram', username: '' }]
    }));
  };

  const removeSosmedField = (index) => {
    if (formData.sosial_media.length > 1) {
      setFormData(prev => ({
        ...prev,
        sosial_media: prev.sosial_media.filter((_, idx) => idx !== index)
      }));
      if (errors[`sosmed_${index}`]) {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[`sosmed_${index}`];
          return updated;
        });
      }
    }
  };

  const handleSosmedChange = (index, field, value) => {
    const updatedSosmed = [...formData.sosial_media];
    updatedSosmed[index][field] = field === 'username' ? value.replace('@', '').trim() : value;
    
    setFormData(prev => ({ ...prev, sosial_media: updatedSosmed }));

    if (errors[`sosmed_${index}`]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`sosmed_${index}`];
        return updated;
      });
    }
  };

  const handleMateriStatusChange = (materiId, statusValue) => {
    setMateriStates(prev => ({
      ...prev,
      [materiId]: { ...prev[materiId], status: statusValue, halaman: statusValue === 'sebagian' ? (prev[materiId]?.halaman || 1) : 0 }
    }));
  };

  const handleMateriHalamanChange = (materiId, hlmValue) => {
    setMateriStates(prev => ({
      ...prev,
      [materiId]: { ...prev[materiId], halaman: Math.max(1, parseInt(hlmValue) || 1) }
    }));
  };

  const nextStep = () => {
    const currentErrors = {};

    if (activeStep === 1) {
      const step1Required = [
        { key: 'nama_lengkap', label: 'Nama Lengkap' },
        { key: 'tempat_lahir', label: 'Tempat Lahir' },
        { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
        { key: 'gender', label: 'Jenis Kelamin' },
        { key: 'nama_sekolah', label: 'Asal Sekolah Umum' },
        { key: 'alamat_sambung', label: 'Alamat Tempat Sambung TPQ Tujuan' },
        { key: 'hobi', label: 'Hobi Generus' }
      ];

      step1Required.forEach(field => {
        if (!formData[field.key]) {
          currentErrors[field.key] = 'Belum terisi';
        }
      });

      if (formData.nama_sekolah === 'Lainnya' && !formData.nama_sekolah_lainnya) {
        currentErrors['nama_sekolah_lainnya'] = 'Belum terisi';
      }

      if (formData.punya_sosmed === 'ya') {
        formData.sosial_media.forEach((item, index) => {
          if (!item.username.trim()) {
            currentErrors[`sosmed_${index}`] = 'Username wajib diisi jika memiliki sosmed';
          }
        });
      }
    }
    
    if (activeStep === 2) {
      const step2Required = [
        { key: 'nama_ayah', label: 'Nama Ayah Kandung' },
        { key: 'nama_ibu', label: 'Nama Ibu Kandung' },
        { key: 'nomor_telepon', label: 'No. Telp WhatsApp Wali' },
        { key: 'alamat_lengkap', label: 'Alamat Rumah Mukim Lengkap' }
      ];

      step2Required.forEach(field => {
        if (!formData[field.key]) {
          currentErrors[field.key] = 'Belum terisi';
        }
      });
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      toast.error('Formulir gagal diproses: Ada kolom wajib yang terlewat!');
      
      const firstErrorId = Object.keys(currentErrors)[0];
      const targetElement = document.getElementById(firstErrorId);
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return; 
    }

    setErrors({});
    setActiveStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setErrors({});
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const steps = [
    { id: 1, name: 'Data Generus', icon: 'person' },
    { id: 2, name: 'Data Orang Tua', icon: 'family_restroom' },
    { id: 3, name: 'Konfirmasi', icon: 'verified_user' }
  ];

  const age = useMemo(() => {
    if (!formData.tanggal_lahir) return 0;
    const birthDate = new Date(formData.tanggal_lahir);
    if (isNaN(birthDate.getTime())) return 0; 
    
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
    return calculatedAge;
  }, [formData.tanggal_lahir]);

  const isOldEnoughForMateri = age >= 13;

  const khatamMaterialsList = useMemo(() => {
    const list = [];
    masterMateri.forEach(group => {
      group.items.forEach(item => {
        if (materiStates[item.id]?.status === 'khatam') {
          list.push({ label: item.label, jilid: group.jilid });
        }
      });
    });
    return list;
  }, [masterMateri, materiStates]);

  const selectedTpqLabel = useMemo(() => {
    const found = sambungOptions.find(opt => opt.value == formData.alamat_sambung);
    return found ? found.label : '-';
  }, [sambungOptions, formData.alamat_sambung]);

  const sekolahOptions = [
    { value: '', label: 'Pilih Sekolah...', disabled: true, hidden: true },
    { value: 'Belum Sekolah', label: 'Belum Sekolah' },
    { value: 'TK/KB Bina Karakter Luhur', label: 'TK/KB Bina Karakter Luhur' },
    { value: 'SDIT Bina Karakter Luhur', label: 'SDIT Bina Karakter Luhur' },
    { value: 'Lainnya', label: 'Lainnya (Masukkan Sendiri)' },
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Sedang mengirim formulir pendaftaran...');

    const riwayatMateriJsonArray = formData.sudah_mt 
      ? [] 
      : Object.keys(materiStates)
          .filter(id => materiStates[id].status && materiStates[id].status !== 'belum')
          .map(id => ({
            id: id,
            status: materiStates[id].status,
            halaman_terakhir: materiStates[id].status === 'sebagian' ? materiStates[id].halaman : null
          }));

    try {
      await pendaftaranService.submitPendaftaran(formData, riwayatMateriJsonArray);
      toast.success('Pendaftaran Generus baru berhasil dikirim!', { id: toastId });
      
      // ─── TRIGER POPUP SUKSES ───
      setShowSuccessModal(true);

      // Reset seluruh isi form
      setActiveStep(1);
      setMateriStates({});
      setErrors({});
      setFormData({
        nama_lengkap: '', tempat_lahir: '', tanggal_lahir: '', gender: '',
        nama_sekolah: '', nama_sekolah_lainnya: '', alamat_sambung: '',
        nama_ayah: '', nama_ibu: '', nomor_telepon: '', alamat_lengkap: '', persetujuan: false,
        hobi: '', minat_bakat: '', pernah_mondok: false, sudah_mt: false,
        punya_sosmed: 'tidak',
        sosial_media: [{ platform: 'Instagram', username: '' }]
      });
    } catch (err) {
      console.error(err.message);
      // ─── TAMBAHAN INFORMASI HUBUNGI TIM KURIKULUM PPG SAAT GAGAL ───
      toast.error('Gagal mengirim pendaftaran. Hubungi Tim Kurikulum PPG untuk bantuan teknis sistem.', { id: toastId, duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col px-margin-mobile md:px-margin-desktop py-8 md:py-12 max-w-3xl mx-auto w-full relative select-none">
      
      <div className="text-center md:text-left mb-8">
        <h1 className="font-headline-lg-mobile text-3xl md:font-headline-lg md:text-4xl text-primary mb-2 font-bold tracking-tight">Pendaftaran Generus Baru</h1>
        <p className="font-body-md text-sm text-on-surface-variant">Lengkapi berkas pendaftaran data Generus daerah PPG Kota Batu.</p>
      </div>

      {/* Tampilan Bar Indikator Progress */}
      <div className="w-full mb-10 block">
        <div className="flex justify-between items-start relative">
          <div className="absolute left-0 top-5 -translate-y-1/2 w-full h-1 bg-surface-container-high rounded-full z-0"></div>
          <div className="absolute left-0 top-5 -translate-y-1/2 h-1 bg-secondary rounded-full z-0 transition-all duration-300" style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}></div>
          
          {steps.map(step => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm ${activeStep > step.id ? 'bg-secondary text-on-secondary' : activeStep === step.id ? 'bg-primary text-on-primary ring-4 ring-primary/10' : 'bg-surface-container-high text-on-surface-variant border-2 border-surface'}`}>
                {activeStep > step.id ? <span className="material-symbols-outlined text-base font-bold">check</span> : <span className="text-sm">{step.id}</span>}
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight max-w-[85px] ${activeStep >= step.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant p-6 md:p-8 mt-6">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          
          {/* STEP 1: DATA PERSONAL Generus */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <h2 className="font-headline-md text-xl text-primary border-b border-outline-variant pb-2.5 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined filled-icon">person</span>Data Pribadi Generus
              </h2>
              
              <InputField label="Nama Lengkap" id="nama_lengkap" name="nama_lengkap" placeholder="Masukkan nama tanpa gelar" error={errors.nama_lengkap} value={formData.nama_lengkap} onChange={handleInputChange} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Tempat Lahir" id="tempat_lahir" name="tempat_lahir" placeholder="Contoh: Kota Batu" error={errors.tempat_lahir} value={formData.tempat_lahir} onChange={handleInputChange} />
                <InputField label="Tanggal Lahir" id="tanggal_lahir" name="tanggal_lahir" type="date" error={errors.tanggal_lahir} value={formData.tanggal_lahir} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-on-surface font-bold">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-3" id="gender">
                    {['Laki-laki', 'Perempuan'].map(option => (
                      <label key={option} className={`flex items-center gap-2.5 cursor-pointer p-3 border rounded-xl hover:bg-surface-container-low transition-all ${
                        formData.gender === option 
                          ? 'bg-primary-container border-primary text-on-primary-container font-bold' 
                          : errors.gender ? 'border-red-500 bg-red-50/10' : 'bg-white border-outline-variant'
                      }`}>
                        <input type="radio" name="gender" value={option} checked={formData.gender === option} onChange={handleInputChange} className="text-primary" />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.gender}</p>
                  )}
                </div>
                <InputField label="Usia Otomatis" id="usia" name="usia" type="number" readOnly placeholder="0" icon="cake" value={age > 0 ? age : ''} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <SelectField label="Asal Sekolah Umum" id="nama_sekolah" name="nama_sekolah" icon="school" options={sekolahOptions} error={errors.nama_sekolah} value={formData.nama_sekolah} onChange={handleInputChange} />
                {formData.nama_sekolah === 'Lainnya' && (
                  <InputField id="nama_sekolah_lainnya" name="nama_sekolah_lainnya" placeholder="Masukkan nama sekolah manual" error={errors.nama_sekolah_lainnya} value={formData.nama_sekolah_lainnya} onChange={handleInputChange} />
                )}
              </div>

              <SelectField label="Alamat Tempat Sambung TPQ Tujuan" id="alamat_sambung" name="alamat_sambung" icon="location_on" options={sambungOptions} error={errors.alamat_sambung} value={formData.alamat_sambung} onChange={handleInputChange} />

              {/* FIELD GROUP: POTENSI & LATAR BELAKANG */}
              <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60 space-y-4">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-base">interests</span> Potensi & Latar Belakang Kelompok</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Hobi Generus" id="hobi" name="hobi" placeholder="Misal: Membaca, Olahraga" error={errors.hobi} value={formData.hobi} onChange={handleInputChange} />
                  <InputField label="Minat & Bakat Spesifik (Opsional)" id="minat_bakat" name="minat_bakat" placeholder="Misal: Kaligrafi, Pidato, Adzan" value={formData.minat_bakat} onChange={handleInputChange} />
                </div>

                <div className="flex flex-wrap gap-6 pt-1 text-sm font-bold text-on-surface">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="pernah_mondok" checked={formData.pernah_mondok} onChange={handleInputChange} className="text-primary rounded border-outline focus:ring-primary w-4 h-4" />
                    Pernah Mondok
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="sudah_mt" checked={formData.sudah_mt} onChange={handleInputChange} className="text-primary rounded border-outline focus:ring-primary w-4 h-4" />
                    Sudah MT
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="text-sm text-on-surface font-bold">Apakah Generus Memiliki Akun Sosial Media?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, punya_sosmed: 'ya' }))} className={`py-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${formData.punya_sosmed === 'ya' ? 'border-primary bg-primary/10 text-primary font-black shadow-sm' : 'border-outline-variant bg-white text-on-surface-variant'}`}>
                    Ya, Ada
                  </button>
                  <button type="button" onClick={() => { setFormData(p => ({ ...p, punya_sosmed: 'tidak', sosial_media: [{ platform: 'Instagram', username: '' }] })); if (errors.sosmed_0) setErrors(p => ({ ...p, sosmed_0: '' })); }} className={`py-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${formData.punya_sosmed === 'tidak' ? 'border-primary bg-primary/10 text-primary font-black shadow-sm' : 'border-outline-variant bg-white text-on-surface-variant'}`}>
                    Tidak Memiliki
                  </button>
                </div>
              </div>

              {/* PANEL INPUT DINAMIS MULTI SOSIAL MEDIA (MANDATORI JIKA YA) */}
              {formData.punya_sosmed === 'ya' && (
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-base">alternate_email</span> Sambungkan Akun Sosial Media</h3>
                    <button type="button" onClick={addSosmedField} className="text-xs font-black text-secondary hover:underline flex items-center gap-0.5 cursor-pointer">
                      <span className="material-symbols-outlined text-sm font-black">add_circle</span> Tambah Akun
                    </button>
                  </div>

                  {formData.sosial_media.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex gap-3 items-center animate-fadeIn">
                        <select 
                          value={item.platform} 
                          onChange={(e) => handleSosmedChange(index, 'platform', e.target.value)} 
                          className="w-[35%] h-11 bg-white border border-outline-variant rounded-xl px-2 font-bold text-sm focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Facebook">Facebook</option>
                          <option value="YouTube">YouTube</option>
                          <option value="X (Twitter)">X / Twitter</option>
                        </select>

                        <div className="flex-1 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant/40">@</span>
                          <input 
                            type="text" 
                            id={`sosmed_${index}`}
                            value={item.username} 
                            onChange={(e) => handleSosmedChange(index, 'username', e.target.value)}
                            placeholder="username_kamu" 
                            className={`w-full h-11 bg-white border rounded-xl pl-8 pr-4 text-sm font-medium focus:outline-none placeholder:text-on-surface-variant/20 ${errors[`sosmed_${index}`] ? 'border-red-500 bg-red-50/10' : 'border-outline-variant focus:border-primary'}`}
                          />
                        </div>

                        {formData.sosial_media.length > 1 && (
                          <button type="button" onClick={() => removeSosmedField(index)} className="text-outline hover:text-red-600 p-1 cursor-pointer">
                            <span className="material-symbols-outlined text-xl font-black">close</span>
                          </button>
                        )}
                      </div>
                      {errors[`sosmed_${index}`] && (
                        <p className="text-red-500 text-[11px] font-bold pl-2 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors[`sosmed_${index}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* EVALUASI LEVEL MATERI KHATAM / SEBAGIAN */}
              {isOldEnoughForMateri && !formData.sudah_mt && (
                <div className="mt-6 p-6 bg-orange-50/30 rounded-2xl border border-orange-200 space-y-5 animate-fadeIn">
                  <div>
                    <h3 className="font-headline-md text-lg text-orange-900 flex items-center gap-2 font-bold">
                      <span className="material-symbols-outlined text-orange-700 filled-icon">menu_book</span>Evaluasi Capaian Materi Awal (Usia 13+ Tahun)
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Isi status kehataman kitab untuk mempermudah pemetaan kurikulum kelas nanti.</p>
                  </div>
                  
                  <div className="space-y-6">
                    {masterMateri.map((jilidGroup) => (
                      <div key={jilidGroup.jilid} className="space-y-3">
                        <h4 className="text-xs font-black text-orange-800 tracking-wider uppercase border-b border-orange-200/60 pb-1 w-fit">{jilidGroup.jilid}</h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {jilidGroup.items.map((materi) => {
                            const currentMateri = materiStates[materi.id] || { status: 'belum', halaman: 0 };
                            
                            return (
                              <div key={materi.id} className="bg-white p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                <div className="sm:max-w-xs w-full">
                                  <p className="text-sm font-bold text-on-surface leading-snug">{materi.label}</p>
                                  {materi.totalHalaman > 0 && (
                                    <p className="text-[10px] text-outline mt-0.5">Ketebalan: {materi.totalHalaman} Halaman</p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                  <select 
                                    value={currentMateri.status}
                                    onChange={(e) => handleMateriStatusChange(materi.id, e.target.value)}
                                    className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs font-bold text-on-surface focus:border-primary outline-none cursor-pointer"
                                  >
                                    <option value="belum">Belum Sama Sekali</option>
                                    <option value="sebagian">Isi Sebagian (Progress)</option>
                                    <option value="khatam">Sudah Khatam (Tuntas)</option>
                                  </select>

                                  {currentMateri.status === 'sebagian' && (
                                    <div className="flex items-center gap-1.5 animate-fadeIn">
                                      <span className="text-[11px] text-outline font-bold">Hlm Terakhir:</span>
                                      <input 
                                        type="number"
                                        min="1"
                                        max={materi.totalHalaman > 0 ? materi.totalHalaman : 999}
                                        value={currentMateri.halaman || ''}
                                        onChange={(e) => handleMateriHalamanChange(materi.id, e.target.value)}
                                        className="w-16 border border-orange-300 bg-orange-50/20 text-orange-950 font-mono text-center rounded-lg py-1 text-xs font-bold focus:border-orange-500 outline-none"
                                        placeholder="1"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button type="button" onClick={nextStep} className="bg-primary text-on-primary hover:bg-primary-container px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer text-xs">
                  Lanjut ke Data Orang Tua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATA ORANG TUA / WALI */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <h2 className="font-headline-md text-xl text-primary border-b border-outline-variant pb-2.5 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined">family_restroom</span>Data Orang Tua / Wali
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nama Ayah Kandung" id="nama_ayah" name="nama_ayah" placeholder="Sesuai kartu keluarga" error={errors.nama_ayah} value={formData.nama_ayah} onChange={handleInputChange} />
                <InputField label="Nama Ibu Kandung" id="nama_ibu" name="nama_ibu" placeholder="Sesuai kartu keluarga" error={errors.nama_ibu} value={formData.nama_ibu} onChange={handleInputChange} />
              </div>
              
              <InputField label="No. Telp WhatsApp Wali" id="nomor_telepon" name="nomor_telepon" placeholder="Contoh: 081234..." icon="phone" error={errors.nomor_telepon} value={formData.nomor_telepon} onChange={handleInputChange} />
              
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                <label className="text-sm text-on-surface font-bold" htmlFor="alamat_lengkap">Alamat Rumah Lengkap</label>
                <textarea 
                  className={`w-full bg-surface text-on-surface border rounded-xl px-4 py-3 font-medium text-sm focus:outline-none focus:ring-2 resize-none placeholder:text-on-surface-variant/40 ${
                    errors.alamat_lengkap ? 'border-red-500 bg-red-50/10 focus:ring-red-200' : 'border-outline-variant focus:ring-primary focus:border-primary'
                  }`}
                  id="alamat_lengkap" name="alamat_lengkap" placeholder="Nama jalan, nomor rumah, RT/RW, Dusun, Kelurahan" rows="3" value={formData.alamat_lengkap} onChange={handleInputChange}
                />
                {errors.alamat_lengkap && (
                  <p className="text-red-500 text-[11px] font-bold mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.alamat_lengkap}</p>
                )}
              </div>

              <div className="pt-4 flex justify-between items-center select-none">
                <button type="button" onClick={prevStep} className="text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 cursor-pointer text-xs"><span className="material-symbols-outlined text-sm">arrow_back</span>Kembali</button>
                <button type="button" onClick={nextStep} className="bg-primary text-on-primary hover:bg-primary-container px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer text-xs">Tinjau Isian Data <span className="material-symbols-outlined text-sm">visibility</span></button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW KONFIRMASI DATA */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-headline-md text-xl text-primary border-b border-outline-variant pb-2.5 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-secondary filled-icon">verified_user</span>Tinjauan & Konfirmasi Akhir Formulir
              </h2>
              
              {/* 1. Bento Card: Biodata Pribadi Generus */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">badge</span> Identitas Pribadi Generus</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-on-surface-variant">
                  <div><dt className="text-outline text-[10px] font-medium">Nama Lengkap</dt><dd className="text-on-surface font-bold mt-0.5">{formData.nama_lengkap || '-'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Tempat, Tanggal Lahir</dt><dd className="text-on-surface font-bold mt-0.5">{formData.tempat_lahir || '-'}, {formData.tanggal_lahir || '-'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Jenis Kelamin • Usia</dt><dd className="text-on-surface font-bold mt-0.5">{formData.gender || '-'} ({age} Tahun)</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Asal Sekolah Umum</dt><dd className="text-on-surface font-bold mt-0.5">{formData.nama_sekolah === 'Lainnya' ? formData.nama_sekolah_lainnya : formData.nama_sekolah || '-'}</dd></div>
                  <div className="sm:col-span-2 border-t border-dashed border-outline-variant/60 pt-2"><dt className="text-outline text-[10px] font-medium">TPQ Tempat Sambung Pilihan</dt><dd className="text-primary font-black text-sm mt-0.5">{selectedTpqLabel}</dd></div>
                </dl>
              </div>

              {/* 2. Bento Card: Potensi & Sosial Media */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">interests</span> Potensi & Sosial Media</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-on-surface-variant">
                  <div><dt className="text-outline text-[10px] font-medium">Hobi Generus</dt><dd className="text-on-surface font-bold mt-0.5">{formData.hobi || '-'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Minat & Bakat Spesifik</dt><dd className="text-on-surface font-bold mt-0.5">{formData.minat_bakat || 'Tidak diisi'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Pernah Mondok / Berasrama</dt><dd className="text-on-surface font-bold mt-0.5">{formData.pernah_mondok ? 'Ya, Pernah Mondok' : 'Tidak Pernah'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Status</dt><dd className="text-on-surface font-bold mt-0.5">{formData.sudah_mt ? 'Ya, Anggota Korps MT (Mubaligh)' : 'Generus Reguler/Generus'}</dd></div>
                  
                  <div className="sm:col-span-2 border-t border-dashed border-outline-variant/60 pt-2">
                    <dt className="text-outline text-[10px] font-medium mb-1">Sosial Media Terhubung</dt>
                    <dd className="text-on-surface font-bold mt-0.5">
                      {formData.punya_sosmed === 'ya' ? (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {formData.sosial_media.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-surface border border-outline-variant/80 px-2.5 py-1 rounded-lg text-[11px] text-primary">
                              <span className="font-medium text-outline text-[10px]">{item.platform}:</span> @{item.username}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/60 font-medium italic">Tidak memiliki akun sosial media</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {/* 3. Bento Card: Data Wali / Orang Tua */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">family_restroom</span> Data Orang Tua / Wali</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-on-surface-variant">
                  <div><dt className="text-outline text-[10px] font-medium">Nama Ayah Kandung</dt><dd className="text-on-surface font-bold mt-0.5">{formData.nama_ayah || '-'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">Nama Ibu Kandung</dt><dd className="text-on-surface font-bold mt-0.5">{formData.nama_ibu || '-'}</dd></div>
                  <div><dt className="text-outline text-[10px] font-medium">No. HP / WhatsApp Pengasuh</dt><dd className="text-on-surface font-bold mt-0.5 font-mono">{formData.nomor_telepon || '-'}</dd></div>
                  <div className="sm:col-span-2 border-t border-dashed border-outline-variant/60 pt-2"><dt className="text-outline text-[10px] font-medium">Alamat Rumah Mukim Lengkap</dt><dd className="text-on-surface font-bold mt-0.5 leading-relaxed">{formData.alamat_lengkap || '-'}</dd></div>
                </dl>
              </div>

              {/* 4. Bento Card Daftar Materi */}
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant space-y-3">
                <h3 className="text-xs font-black text-orange-900 uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm text-orange-700">bookmark_added</span> Daftar Kitab/Materi Yang Sudah Khatam</h3>
                
                {formData.sudah_mt ? (
                  <p className="text-xs font-bold text-orange-700 bg-orange-100/60 border border-orange-200 px-3 py-2 rounded-xl w-fit">
                    Bypass Evaluasi Materi (Generus Mubaligh/ot).
                  </p>
                ) : !isOldEnoughForMateri ? (
                  <p className="text-xs font-medium text-outline">
                    Evaluasi materi dikhususkan untuk calon Generus/generus berusia 13 tahun ke atas.
                  </p>
                ) : khatamMaterialsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-bold">
                    {khatamMaterialsList.map((materi, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white border border-outline-variant/60 px-3 py-2.5 rounded-xl text-on-surface shadow-sm">
                        <span className="material-symbols-outlined text-green-600 text-sm font-bold">check_circle</span>
                        <div>
                          <p className="leading-tight">{materi.label}</p>
                          <p className="text-[9px] text-outline font-medium">{materi.jilid}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-outline py-1">
                    Belum ada materi/kitab yang ditandai sudah Khatam (Tuntas).
                  </p>
                )}
              </div>

              {/* Tombol Checkbox Persetujuan Legal */}
              <div className="mt-4 flex items-start gap-3 p-4 bg-secondary-container/10 rounded-xl border border-secondary text-xs font-bold text-on-surface-variant">
                <input type="checkbox" id="persetujuan" name="persetujuan" required checked={formData.persetujuan} onChange={handleInputChange} className="mt-0.5 text-secondary rounded border-outline w-4 h-4 focus:ring-secondary cursor-pointer" />
                <label className="text-on-surface cursor-pointer font-semibold leading-relaxed" htmlFor="persetujuan">Saya menginput data benar dan sesuai</label>
              </div>

              <div className="pt-4 flex justify-between items-center select-none">
                <button type="button" onClick={prevStep} disabled={isSubmitting} className="text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 cursor-pointer text-xs"><span className="material-symbols-outlined text-sm">edit</span>Perbaiki</button>
                <button type="submit" disabled={isSubmitting || !formData.persetujuan} className="bg-primary text-on-primary hover:bg-primary-container px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-40">
                  {isSubmitting ? 'Mengirim berkas...' : 'Kirim Pendaftaran'} <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* ─── MODAL OVERLAY: POPUP PENDAFTARAN SUKSES (RESPONSIVE) ─── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-outline-variant/60 p-6 shadow-2xl flex flex-col items-center text-center space-y-4 transform transition-all animate-scaleUp">
            
            {/* Lencana Centang Beranimasi */}
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-4xl font-black animate-bounce mt-1">verified</span>
            </div>

            {/* Informasi Text */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-primary tracking-tight">Pendaftaran Berhasil!</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed px-2">
                Berkas data administrasi santri baru telah diterbitkan ke sistem internal. Silakan hubungi pengurus TPQ tujuan untuk verifikasi lanjutan.
              </p>
            </div>

            {/* Tombol Navigasi Kembali Ke Beranda */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="w-full h-11 bg-primary text-on-primary font-black rounded-xl text-xs hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Kembali ke Beranda
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}