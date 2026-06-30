// src/pages/PendaftaranPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { pendaftaranService } from '../services/pendaftaranService';
import toast from 'react-hot-toast';

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
    {error && <span className="text-red-500 text-[11px] font-bold pl-1 flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">error</span>{error}</span>}
  </div>
);

export default function PendaftaranPage() {
  const [step, setStep] = useState(1);
  const [sambungOptions, setSambungOptions] = useState([]);
  const [kurikulumGroups, setKurikulumGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM DATA INITIAL STATE STRUCTURE
  const [formData, setFormData] = useState({
    alamat_sambung: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    gender: '',
    nama_sekolah: '',
    nama_sekolah_lainnya: '',
    nama_ayah: '',
    nama_ibu: '',
    nomor_telepon: '',
    alamat_lengkap: '',
    hobi: '',
    persetujuan: false,

    // ─── DATA SOSMED BARU AWAL ───
    punya_sosmed: 'tidak', // Default awal mengasumsikan tidak memiliki sosmed
    sosial_media: [{ platform: 'Instagram', username: '' }]
  });

  const [formErrors, setFormErrors] = useState({});
  const [riwayatMateri, setRiwayatMateri] = useState({});

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [sambungData, kurikulumData] = await Promise.all([
          pendaftaranService.getSambungOptions(),
          pendaftaranService.getKurikulumMateri()
        ]);
        setSambungOptions(sambungData);
        setKurikulumGroups(kurikulumData);
      } catch (err) {
        toast.error("Gagal memuat konfigurasi form pendaftaran.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // LOGIKA MANIPULASI SOSIAL MEDIA DINAMIS
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
    }
  };

  const handleSosmedFieldChange = (index, field, value) => {
    const updated = [...formData.sosial_media];
    // Jika kolom username, bersihkan spasi dan lambang '@' jika diketik pendaftar
    updated[index][field] = field === 'username' ? value.replace('@', '').trim() : value;
    setFormData(prev => ({ ...prev, sosial_media: updated }));
  };

  const handleMateriCheckboxChange = (materiId, checked) => {
    setRiwayatMateri(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[materiId] = { selesai: true, sampaiHalaman: 1 };
      } else {
        delete updated[materiId];
      }
      return updated;
    });
  };

  const handleHalamanChange = (materiId, val, maxHal) => {
    const num = Math.min(Math.max(parseInt(val, 10) || 1, 1), maxHal);
    setRiwayatMateri(prev => ({
      ...prev,
      [materiId]: { ...prev[materiId], sampaiHalaman: num }
    }));
  };

  // VALIDASI PER LANGKAH FORM
  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!formData.alamat_sambung) errors.alamat_sambung = 'Pilih alamat sambung asal TPQ Anda';
      if (!formData.nama_lengkap.trim()) errors.nama_lengkap = 'Nama lengkap wajib diisi';
      if (!formData.tempat_lahir.trim()) errors.tempat_lahir = 'Tempat lahir wajib diisi';
      if (!formData.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi';
      if (!formData.gender) errors.gender = 'Pilih jenis kelamin Anda';
      if (!formData.nama_sekolah) errors.nama_sekolah = 'Pilih atau tentukan nama sekolah Anda';
      if (formData.nama_sekolah === 'Lainnya' && !formData.nama_sekolah_lainnya.trim()) errors.nama_sekolah_lainnya = 'Sebutkan nama sekolah Anda';
    } else if (currentStep === 2) {
      if (!formData.nama_ayah.trim()) errors.nama_ayah = 'Nama ayah kandung wajib diisi';
      if (!formData.nama_ibu.trim()) errors.nama_ibu = 'Nama ibu kandung wajib diisi';
      if (!formData.nomor_telepon.trim()) errors.nomor_telepon = 'Nomor WhatsApp aktif wajib diisi';
      if (!formData.alamat_lengkap.trim()) errors.alamat_lengkap = 'Alamat rumah lengkap wajib diisi';
      
      // ─── VALIDASI MANDATORI SOSIAL MEDIA (JIKA PILIH YA) ───
      if (formData.punya_sosmed === 'ya') {
        const adaSosmedKosong = formData.sosial_media.some(item => !item.username.trim());
        if (adaSosmedKosong) {
          toast.error("Harap isi semua username akun sosial media yang Anda tambahkan!");
          return false;
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => validateStep(step) && setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmitFinalForm = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    const loadToastId = toast.loading("Sedang mengirimkan berkas pendaftaran ke sistem...");

    try {
      await pendaftaranService.submitPendaftaran(formData, riwayatMateri);
      toast.success("Pendaftaran resmi berhasil dikirim! Silakan hubungi pengurus TPQ setempat.", { id: loadToastId });
      // Reset form atau arahkan ke halaman sukses jika ada
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirimkan berkas pendaftaran.", { id: loadToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-24 text-xs font-bold text-outline animate-pulse">Menghubungkan jaringan form pendaftaran...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-outline-variant/40 rounded-3xl p-5 shadow-sm min-h-[70vh] flex flex-col justify-between">
      
      {/* STEP HEADER INDICATOR */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 select-none">
        <div>
          <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full tracking-wider">Langkah {step} dari 3</span>
          <h2 className="text-base font-black text-on-surface mt-1">
            {step === 1 ? "Biodata Diri Generus" : step === 2 ? "Kontak & Keluarga" : "Riwayat Capaian Ngaji"}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-6 bg-primary' : 'w-2 bg-surface-container-highest'}`} />)}
        </div>
      </div>

      {/* CORE INPUT PANEL STAGE */}
      <form onSubmit={handleSubmitFinalForm} className="flex-1 py-5 space-y-4">
        
        {/* STEP 1: PERSONAL BIODATA */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
              <label className="text-sm text-on-surface font-bold">Pilih Alamat Sambung Asal</label>
              <select name="alamat_sambung" value={formData.alamat_sambung} onChange={handleInputChange} className={`w-full bg-surface text-on-surface border rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 ${formErrors.alamat_sambung ? 'border-red-500' : 'border-outline-variant focus:ring-primary'}`}>
                <option value="">-- Cari Sambung / Desa Asal --</option>
                {sambungOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {formErrors.alamat_sambung && <span className="text-red-500 text-[11px] font-bold flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">error</span>{formErrors.alamat_sambung}</span>}
            </div>

            <InputField label="Nama Lengkap Generus" id="nama_lengkap" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} placeholder="Ketik nama lengkap sesuai akta..." icon="person" error={formErrors.nama_lengkap} />
            
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Tempat Lahir" id="tempat_lahir" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} placeholder="Kota lahir..." icon="location_on" error={formErrors.tempat_lahir} />
              <InputField label="Tanggal Lahir" id="tanggal_lahir" name="tanggal_lahir" type="date" value={formData.tanggal_lahir} onChange={handleInputChange} error={formErrors.tanggal_lahir} />
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
              <label className="text-sm text-on-surface font-bold">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-3 select-none">
                {[['Laki-laki', 'male'], ['Perempuan', 'female']].map(([lbl, val]) => (
                  <button key={val} type="button" onClick={() => setFormData(p => ({ ...p, gender: val }))} className={`py-3 text-center rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${formData.gender === val ? 'border-primary bg-primary/10 text-primary font-black' : 'border-outline-variant bg-surface text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-base">{val}</span> {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
              <label className="text-sm text-on-surface font-bold">Nama Sekolah / Tingkatan Saat Ini</label>
              <select name="nama_sekolah" value={formData.nama_sekolah} onChange={handleInputChange} className="w-full bg-surface text-on-surface border border-outline-variant rounded-xl py-3 px-3 text-sm focus:outline-none">
                <option value="">-- Pilih Tingkat Sekolah --</option>
                <option value="Belum Sekolah">Belum Sekolah / PAUD</option>
                <option value="TK">Taman Kanak-kanak (TK)</option>
                <option value="SD">Sekolah Dasar (SD)</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / SMK / MA</option>
                <option value="Kuliah">Perguruan Tinggi (Kuliah)</option>
                <option value="Lainnya">Lainnya (Ketik Manual...)</option>
              </select>
            </div>

            {formData.nama_sekolah === 'Lainnya' && (
              <InputField label="Sebutkan Nama Instansi Sekolah" id="nama_sekolah_lainnya" name="nama_sekolah_lainnya" value={formData.nama_sekolah_lainnya} onChange={handleInputChange} placeholder="Ketik nama sekolah khusus Anda..." icon="school" error={formErrors.nama_sekolah_lainnya} />
            )}

            <div className="pt-4 flex justify-end select-none">
              <button type="button" onClick={nextStep} className="bg-primary text-on-primary font-black px-6 py-3 rounded-xl shadow-sm flex items-center gap-1 text-xs cursor-pointer">Lanjutkan <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span></button>
            </div>
          </div>
        )}

        {/* STEP 2: FAMILY CONTACT & DYNAMIC SOCIAL MEDIA */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nama Ayah Kandung" id="nama_ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleInputChange} placeholder="Nama ayah..." icon="family_history" error={formErrors.nama_ayah} />
              <InputField label="Nama Ibu Kandung" id="nama_ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} placeholder="Nama ibu..." icon="supervisor_account" error={formErrors.nama_ibu} />
            </div>

            <InputField label="Nomor WhatsApp Aktif Orang Tua / Wali" id="nomor_telepon" name="nomor_telepon" value={formData.nomor_telepon} onChange={handleInputChange} placeholder="Contoh: 081234567xxx" icon="call" error={formErrors.nomor_telepon} />
            
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
              <label className="text-sm text-on-surface font-bold">Alamat Rumah Lengkap</label>
              <textarea name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleInputChange} rows="2" className={`w-full bg-surface text-on-surface border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 ${formErrors.alamat_lengkap ? 'border-red-500' : 'border-outline-variant focus:ring-primary'}`} placeholder="Ketik nama jalan, nomor rumah, RT/RW, dan kelurahan..." required />
            </div>

            <InputField label="Hobi / Minat Bakat Generus" id="hobi" name="hobi" value={formData.hobi} onChange={handleInputChange} placeholder="Contoh: Memanah, Menggambar, Sepakbola..." icon="sports_esports" />

            {/* ─── UI BARU: PERTANYAAN KONDISIONAL SOSIAL MEDIA ─── */}
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant pt-2">
              <label className="text-sm text-on-surface font-bold">Apakah Generus Memiliki Akun Sosial Media?</label>
              <div className="grid grid-cols-2 gap-3 select-none">
                <button type="button" onClick={() => setFormData(p => ({ ...p, punya_sosmed: 'ya' }))} className={`py-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${formData.punya_sosmed === 'ya' ? 'border-primary bg-primary/10 text-primary font-black' : 'border-outline-variant bg-surface text-on-surface-variant'}`}>
                  Ya, Ada
                </button>
                <button type="button" onClick={() => setFormData(p => ({ ...p, punya_sosmed: 'tidak', sosial_media: [{ platform: 'Instagram', username: '' }] }))} className={`py-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${formData.punya_sosmed === 'tidak' ? 'border-primary bg-primary/10 text-primary font-black' : 'border-outline-variant bg-surface text-on-surface-variant'}`}>
                  Tidak Memiliki
                </button>
              </div>
            </div>

            {/* PANEL INPUT DINAMIS MULTIPLE SOSMED (MANDATORI JIKA PILIH YA) */}
            {formData.punya_sosmed === 'ya' && (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">alternate_email</span> Hubungkan Sosial Media</span>
                  <button type="button" onClick={addSosmedField} className="text-[10px] font-black text-secondary hover:underline flex items-center gap-0.5 cursor-pointer">
                    <span className="material-symbols-outlined text-xs font-black">add_circle</span> Tambah Sosmed
                  </button>
                </div>

                {formData.sosial_media.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center animate-fadeIn">
                    <select value={item.platform} onChange={(e) => handleSosmedFieldChange(index, 'platform', e.target.value)} className="w-[35%] h-10 bg-white border border-outline-variant rounded-xl px-2 font-bold text-xs focus:outline-none focus:border-primary">
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="X (Twitter)">X / Twitter</option>
                    </select>

                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/40">@</span>
                      <input 
                        type="text" value={item.username} onChange={(e) => handleSosmedFieldChange(index, 'username', e.target.value)}
                        placeholder="username_kamu" required className="w-full h-10 bg-white border border-outline-variant rounded-xl pl-7 pr-3 text-sm font-medium focus:outline-none focus:border-primary placeholder:text-on-surface-variant/20"
                      />
                    </div>

                    {formData.sosial_media.length > 1 && (
                      <button type="button" onClick={() => removeSosmedField(index)} className="text-outline hover:text-red-600 p-1 cursor-pointer">
                        <span className="material-symbols-outlined text-sm font-black">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-between items-center select-none">
              <button type="button" onClick={prevStep} className="text-on-surface-variant font-bold flex items-center gap-0.5 text-xs cursor-pointer"><span className="material-symbols-outlined text-base">arrow_back</span> Kembali</button>
              <button type="button" onClick={nextStep} className="bg-primary text-on-primary font-black px-6 py-3 rounded-xl shadow-sm flex items-center gap-1 text-xs cursor-pointer">Lanjutkan <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span></button>
            </div>
          </div>
        )}

        {/* STEP 3: RELIABLE GROUPING NG AJI (CLEAN FROM NULL JILID) */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[11px] font-semibold text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
              💡 <span className="font-bold text-primary">Petunjuk Riwayat:</span> Centang kitab materi yang saat ini sedang dipelajari oleh generus, lalu ketik target capaian nomor halaman terakhirnya.
            </p>

            <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1 scrollbar-none">
              {kurikulumGroups.map((group) => (
                <div key={group.jilid} className="bg-surface border border-outline-variant/40 rounded-2xl p-4 space-y-3 shadow-inner">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-sm">auto_stories</span> Kelompok Materi: Jilid {group.jilid}</h4>
                  
                  <div className="divide-y divide-outline-variant/20">
                    {group.items.map((materi) => {
                      const isChecked = !!riwayatMateri[materi.id];
                      return (
                        <div key={materi.id} className="py-2.5 flex items-center justify-between gap-4 animate-fadeIn">
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 text-sm font-bold text-on-surface">
                            <input type="checkbox" checked={isChecked} onChange={(e) => handleMateriCheckboxChange(materi.id, e.target.checked)} className="rounded text-primary border-outline-variant focus:ring-primary w-4 h-4 cursor-pointer" />
                            {materi.label}
                          </label>

                          {isChecked && (
                            <div className="flex items-center gap-1.5 animate-scaleUp">
                              <span className="text-[10px] text-outline font-bold">Sampai Hal:</span>
                              <input
                                type="number" min="1" max={materi.totalHalaman}
                                value={riwayatMateri[materi.id].sampaiHalaman || 1}
                                onChange={(e) => handleHalamanChange(materi.id, e.target.value, materi.totalHalaman)}
                                className="w-14 h-8 text-center bg-white border border-primary rounded-lg text-xs font-black focus:outline-none"
                              />
                              <span className="text-[10px] text-outline">/ {materi.totalHalaman}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-3 p-4 bg-secondary-container/10 rounded-xl border border-secondary text-xs font-bold text-on-surface-variant">
              <input type="checkbox" id="persetujuan" name="persetujuan" required checked={formData.persetujuan} onChange={handleInputChange} className="mt-0.5 text-secondary rounded border-outline w-4 h-4 focus:ring-secondary cursor-pointer" />
              <label className="text-on-surface cursor-pointer font-semibold leading-relaxed" htmlFor="persetujuan">Saya menginput data benar dan sesuai</label>
            </div>

            <div className="pt-4 flex justify-between items-center select-none">
              <button type="button" onClick={prevStep} disabled={isSubmitting} className="text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 cursor-pointer text-xs"><span className="material-symbols-outlined text-sm">edit</span>Perbaiki</button>
              <button type="submit" disabled={isSubmitting || !formData.persetujuan} className="bg-primary text-on-primary hover:bg-primary-container px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-40">
                {isSubmitting ? 'Mengirim berkas...' : 'Kirim Pendaftaran Resmi'} <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}