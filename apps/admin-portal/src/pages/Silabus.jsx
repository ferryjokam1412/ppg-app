// src/pages/admin-portal/KurikulumMasterView.jsx
import { useState, useEffect, useMemo } from 'react';
import { kurikulumService } from '../services/kurikulumService'; 
import toast from 'react-hot-toast';

const JENJANG_OPTIONS = ['PAUD/TK', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Pra Remaja', 'Remaja', 'Pra Nikah'];

export default function KurikulumMasterView({ onBack }) {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterJenjang, setFilterJenjang] = useState('Kelas 1');

  // STATE MODAL ENGINE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  // STATE CRUD KATEGORI INTERNAL
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  
  // 💡 UPDATE: Mengubah default tipe_pelacakan dari 'halaman_ayat' menjadi 'halaman'
  const [form, setForm] = useState({
    kategori: '',
    nama_materi: '', 
    jenjang: 'Kelas 1',
    tipe_pelacakan: 'halaman', 
    halaman_mulai: 1,
    halaman_selesai: 1
  });

  // ─── EFFECT: KUNCI SCROLL PAGE SAAT MODAL TERBUKA ───
  useEffect(() => {
    if (isModalOpen || isCatModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isCatModalOpen]);

  // FETCH ALL DATA FROM DATABASE
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [materiData, kategoriData] = await Promise.all([
        kurikulumService.getMasterMaterials(),
        kurikulumService.getKategoriList()
      ]);
      setMaterials(materiData);
      setCategories(kategoriData);
      
      if (kategoriData.length > 0 && !form.kategori) {
        setForm(prev => ({ ...prev, kategori: kategoriData[0].nama_kategori }));
      }
    } catch (err) {
      toast.error("Gagal sinkronisasi data kurikulum pusat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.jenjang === filterJenjang);
  }, [materials, filterJenjang]);

  // FLOATING HELPER: KELOLA WARNA BADGE SESUAI TIPE PELACAKAN SPESIFIK
  const getBadgeStyles = (type) => {
    if (type === 'persentase') return 'bg-blue-50 text-blue-800';
    if (type === 'ayat') return 'bg-purple-50 text-purple-800';
    if (type === 'hadist') return 'bg-emerald-50 text-emerald-800';
    return 'bg-orange-50 text-orange-800'; // default halaman
  };

  const getBadgeLabel = (type) => {
    if (type === 'persentase') return 'Persentase';
    if (type === 'ayat') return 'Ayat';
    if (type === 'hadist') return 'Hadist';
    return 'Halaman';
  };

  // FORM HANDLERS MATERI SILABUS
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm({
      kategori: categories[0]?.nama_kategori || '',
      nama_materi: '',
      jenjang: filterJenjang,
      tipe_pelacakan: 'halaman', 
      halaman_mulai: 1,
      halaman_selesai: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      kategori: item.kategori,
      nama_materi: item.nama_materi,
      jenjang: item.jenjang,
      tipe_pelacakan: item.tipe_pelacakan || 'halaman', 
      halaman_mulai: item.halaman_mulai || 1,
      halaman_selesai: item.halaman_selesai || 1
    });
    setIsModalOpen(true);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Menyimpan materi ke server...");
    
    const isRangeType = ['halaman', 'ayat', 'hadist'].includes(form.tipe_pelacakan);
    
    const payload = {
      kategori: form.kategori,
      nama_materi: form.nama_materi.trim(),
      jenjang: form.jenjang,
      tipe_pelacakan: form.tipe_pelacakan,
      halaman_mulai: isRangeType ? parseInt(form.halaman_mulai, 10) || 1 : 1,
      halaman_selesai: isRangeType ? parseInt(form.halaman_selesai, 10) || 1 : 100
    };

    try {
      if (editingId) {
        await kurikulumService.updateMasterMaterial(editingId, payload);
        toast.success("Materi silabus berhasil diperbarui!", { id: toastId });
      } else {
        await kurikulumService.insertMasterMaterial(payload);
        toast.success("Materi baru diterbitkan ke gudang pusat!", { id: toastId });
      }
      setIsModalOpen(false);
      loadInitialData();
    } catch (err) {
      toast.error("Gagal memproses data materi.", { id: toastId });
    }
  };

  const handleMaterialDelete = async (id) => {
    if (!window.confirm("Hapus materi ini dari database silabus pusat?")) return;
    try {
      await kurikulumService.deleteMasterMaterial(id);
      toast.success("Materi berhasil dihapus.");
      loadInitialData();
    } catch (err) {
      toast.error("Gagal menghapus materi.");
    }
  };

  // ACTIONS CRUD KATEGORI PUSAT
  const handleSaveKategoriSubmit = async (e) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    try {
      if (editingCatId) {
        await kurikulumService.updateKategori(editingCatId, newCatInput);
        toast.success("Nama kategori berhasil diubah.");
      } else {
        await kurikulumService.insertKategori(newCatInput);
        toast.success("Kategori baru ditambahkan.");
      }
      setNewCatInput('');
      setEditingCatId(null);
      loadInitialData();
    } catch (err) {
      toast.error("Kategori sudah ada atau gagal diproses.");
    }
  };

  const handleKategoriDelete = async (id, nama) => {
    if (!window.confirm(`Hapus kategori "${nama}"? Pastikan tidak ada materi aktif yang menggunakan kategori ini.`)) return;
    try {
      await kurikulumService.deleteKategori(id);
      toast.success("Kategori terhapus.");
      loadInitialData();
    } catch (err) {
      toast.error("Gagal menghapus. Kategori kemungkinan masih terikat materi silabus.");
    }
  };

  // KONTROL TEKS DISKRESI INPUT BERDASARKAN METODE PELACAKAN
  const getDynamicMateriLabel = () => {
    if (form.tipe_pelacakan === 'ayat') return { title: "Nama Surat / Juz Al-Qur'an", placeholder: "Contoh: Al-Baqarah, Juz 30 Amma" };
    if (form.tipe_pelacakan === 'hadist') return { title: "Nama Kitab / Kumpulan Hadist", placeholder: "Contoh: Arba'in Nawawi, Bulughul Maram" };
    if (form.tipe_pelacakan === 'persentase') return { title: "Nama Kitab / Jenis Kegiatan", placeholder: "Contoh: Jurus Keras, Doa Tidur, Gerakan Sholat" };
    return { title: "Nama Kitab / Jilid Buku", placeholder: "Contoh: Tilawati Jilid 2, Kitab Adab" };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Gudang Silabus Master</h1>
          <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Kelola target belajar mengajar berbasis rentang indeks (Halaman/Ayat/Hadist) atau prosentase capaian mandiri pusat.</p>
        </div>
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button type="button" onClick={() => setIsCatModalOpen(true)} className="bg-surface-container-high text-on-surface border border-outline-variant font-black text-xs px-3 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1 cursor-pointer hover:bg-surface-container-highest">
            <span className="material-symbols-outlined text-sm font-bold">category</span> Kelola Kategori
          </button>
          <button type="button" onClick={handleOpenCreateModal} className="flex-1 md:flex-none bg-primary text-on-primary font-black text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container flex items-center justify-center gap-1 cursor-pointer">
            <span className="material-symbols-outlined text-sm font-bold">add</span> Tambah Master Silabus
          </button>
          {onBack && (
            <button type="button" onClick={onBack} className="px-4 py-2.5 border border-outline-variant text-xs font-bold rounded-xl hover:bg-surface-container-low cursor-pointer">Kembali</button>
          )}
        </div>
      </div>

      {/* FILTER HORIZONTAL SCROLL JENJANG */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {JENJANG_OPTIONS.map((lvl) => (
          <button key={lvl} type="button" onClick={() => setFilterJenjang(lvl)} className={`whitespace-nowrap px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterJenjang === lvl ? 'border-primary bg-primary/10 text-primary font-black scale-105' : 'border-outline-variant/60 text-on-surface-variant bg-white'}`}>
            {lvl}
          </button>
        ))}
      </div>

      {/* RENDER LIST MATERI */}
      {isLoading ? (
        <div className="text-center py-12 text-xs font-bold text-outline animate-pulse">Memuat data gudang silabus...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-16 bg-white border border-outline-variant/40 rounded-2xl shadow-sm text-xs text-on-surface-variant font-bold font-mono">
          📭 Belum ada data silabus terdaftar untuk {filterJenjang}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((item) => (
            <div key={item.id} className="bg-white border border-outline-variant/50 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">{item.kategori}</span>
                  {/* 💡 UPDATE: Rendering warna badge cerdas dinamis mengikuti 4 rumpun tipe terpisah */}
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getBadgeStyles(item.tipe_pelacakan)}`}>
                    {getBadgeLabel(item.tipe_pelacakan)}
                  </span>
                </div>
                <h3 className="text-sm font-black text-on-surface pt-0.5">{item.nama_materi}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-on-surface-variant pt-1">
                  {['halaman', 'ayat', 'hadist'].includes(item.tipe_pelacakan) ? (
                    <span className="flex items-center gap-0.5 text-secondary font-bold">
                      <span className="material-symbols-outlined text-xs">tag</span> Rentang Target ({getBadgeLabel(item.tipe_pelacakan)}): {item.halaman_mulai} - {item.halaman_selesai}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-blue-700 font-bold">
                      <span className="material-symbols-outlined text-xs">insights</span> Skala Capaian: 0% - 100%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => handleOpenEditModal(item)} className="w-8 h-8 rounded-lg border border-outline-variant text-outline hover:text-primary flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-sm">edit</span></button>
                <button type="button" onClick={() => handleMaterialDelete(item.id)} className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-sm">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL INTERFACE A: CRUD MANAJEMEN MATERI SILABUS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp max-h-[85vh] overflow-hidden mb-[safe-area-inset-bottom]">
            <div className="bg-primary text-on-primary px-4 py-3.5 flex justify-between items-center sticky top-0 shrink-0">
              <h4 className="text-sm font-black">{editingId ? "Edit Skema Master" : "Tambah Master Silabus Baru"}</h4>
              <button type="button" onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>

            <form onSubmit={handleMaterialSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs font-semibold scrollbar-none pb-8 sm:pb-5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black text-outline">Kategori Sesi</label>
                <select value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})} className="w-full h-10 bg-white border border-outline-variant rounded-xl px-2.5 cursor-pointer focus:outline-none">
                  {categories.map(c => <option key={c.id} value={c.nama_kategori}>{c.nama_kategori}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Target Jenjang</label>
                  <select value={form.jenjang} onChange={(e) => setForm({...form, jenjang: e.target.value})} className="w-full h-10 bg-white border border-outline-variant rounded-xl px-2.5 focus:outline-none">
                    {JENJANG_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black text-outline">Metode Pelacakan</label>
                  {/* 💡 UPDATE: Menyediakan 4 opsi tipe terpisah yang bersih dan spesifik */}
                  <select value={form.tipe_pelacakan} onChange={(e) => setForm({...form, tipe_pelacakan: e.target.value})} className="w-full h-10 bg-white border border-outline-variant rounded-xl px-2.5 font-black text-primary cursor-pointer focus:outline-none">
                    <option value="halaman">📖 Halaman Buku</option>
                    <option value="ayat">🔢 Ayat Al-Qur'an</option>
                    <option value="hadist">📜 Nomor Hadist</option>
                    <option value="persentase">％ Prosentase Capaian</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {/* 💡 UPDATE: Teks label interaktif mengikuti jenis target riil */}
                <label className="text-[10px] uppercase font-black text-outline">
                  {getDynamicMateriLabel().title}
                </label>
                <input 
                  type="text" 
                  value={form.nama_materi} 
                  onChange={(e) => setForm({...form, nama_materi: e.target.value})} 
                  className="w-full h-10 border border-outline-variant rounded-xl px-3 focus:outline-none" 
                  placeholder={getDynamicMateriLabel().placeholder} 
                  required 
                />
              </div>

              {/* FORM INDEKS NUMERIK UNTUK RUMPUN PELACAKAN UNIT RANGE */}
              {['halaman', 'ayat', 'hadist'].includes(form.tipe_pelacakan) ? (
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 space-y-2.5 animate-fadeIn">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">pin</span> Batasan Indeks Standar KBM
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      {/* 💡 UPDATE: Penamaan parameter input angka adaptif mengikuti tipe */}
                      <label className="text-[9px] uppercase text-outline">
                        {form.tipe_pelacakan === 'ayat' ? 'Mulai (Ayat)' : form.tipe_pelacakan === 'hadist' ? 'Mulai (Hadist)' : 'Mulai (Hal)'}
                      </label>
                      <input type="number" min="1" value={form.halaman_mulai} onChange={(e) => setForm({...form, halaman_mulai: parseInt(e.target.value, 10) || 1})} className="w-full h-10 bg-white border border-outline-variant rounded-xl px-2.5 focus:outline-none" required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase text-outline">
                        {form.tipe_pelacakan === 'ayat' ? 'Selesai (Ayat)' : form.tipe_pelacakan === 'hadist' ? 'Selesai (Hadist)' : 'Selesai (Hal)'}
                      </label>
                      <input type="number" min="1" value={form.halaman_selesai} onChange={(e) => setForm({...form, halaman_selesai: parseInt(e.target.value, 10) || 1})} className="w-full h-10 bg-white border border-outline-variant rounded-xl px-2.5 focus:outline-none" required />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200/50 text-[11px] text-blue-800 font-medium leading-relaxed animate-fadeIn">
                  ℹ️ <strong>Mode Prosentase Aktif:</strong> Nilai dasar target akan dipetakan langsung dari rentang 1 hingga 100 secara otomatis oleh sistem saat data disimpan.
                </div>
              )}

              <div className="pt-3 flex gap-2 border-t border-outline-variant/20 mt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/4 h-10 border border-outline-variant text-on-surface-variant rounded-xl font-bold cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 h-10 bg-primary text-on-primary font-black shadow-md rounded-xl cursor-pointer">Simpan Ke Bank Pusat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INTERFACE B: MANAGEMENT KATEGORI */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-all animate-scaleUp h-[75vh] max-h-[80vh] overflow-hidden mb-[safe-area-inset-bottom]">
            <div className="bg-secondary text-on-secondary px-4 py-3.5 flex justify-between items-center sticky top-0 shrink-0">
              <h4 className="text-sm font-black flex items-center gap-1.5"><span className="material-symbols-outlined text-base">category</span> Atur List Kategori Database</h4>
              <button type="button" onClick={() => { setIsCatModalOpen(false); setEditingCatId(null); setNewCatInput(''); }} className="material-symbols-outlined text-base cursor-pointer">close</button>
            </div>

            <form onSubmit={handleSaveKategoriSubmit} className="p-4 bg-surface-container-low border-b border-outline-variant/40 shrink-0 flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[9px] uppercase font-black text-outline">{editingCatId ? "Ubah Nama Kategori" : "Buat Kategori Baru"}</label>
                <input 
                  type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)}
                  className="w-full h-10 bg-white border border-outline-variant rounded-xl px-3 font-bold text-xs uppercase focus:outline-none" 
                  placeholder="Contoh: TAFSIR, IMLA..." required 
                />
              </div>
              <button type="submit" className="bg-secondary text-on-secondary px-4 h-10 rounded-xl font-black text-xs flex items-center gap-0.5 cursor-pointer">
                <span className="material-symbols-outlined text-sm font-black">{editingCatId ? 'check' : 'add'}</span>
                {editingCatId ? 'Simpan' : 'Tambah'}
              </button>
              {editingCatId && (
                <button type="button" onClick={() => { setEditingCatId(null); setNewCatInput(''); }} className="border border-outline-variant bg-white text-on-surface px-2 h-10 rounded-xl text-xs">Batal</button>
              )}
            </form>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-outline-variant/30 text-xs font-bold scrollbar-none pb-6">
              {categories.map((cat) => (
                <div key={cat.id} className="py-2.5 flex items-center justify-between gap-4 animate-fadeIn">
                  <span className="text-on-surface uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    {cat.nama_kategori}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => { setEditingCatId(cat.id); setNewCatInput(cat.nama_kategori); }} className="w-7 h-7 rounded border border-outline-variant text-outline hover:text-secondary flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-xs">edit</span></button>
                    <button type="button" onClick={() => handleKategoriDelete(cat.id, cat.nama_kategori)} className="w-7 h-7 rounded border border-red-100 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-xs">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}