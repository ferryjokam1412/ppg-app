// src/services/pendaftaranService.js
import { supabase } from '../utils/supabaseClient';

export const pendaftaranService = {
  // 1. Ambil opsi alamat sambung dari tabel TPQ untuk di-render di dropdown
  async getSambungOptions() {
    const { data, error } = await supabase
      .from('tpq')
      .select('id, nama, sambung')
      .order('nama', { ascending: true });

    if (error) throw error;
    return data.map(item => ({
      value: item.id,
      label: item.sambung ? `TPQ ${item.nama} (${item.sambung})` : `${item.nama} (Alamat belum diatur)`
    }));
  },

  // 2. Mengambil data materi secara live dari tabel kurikulum (Hanya yang memiliki jilid / tidak null)
  async getKurikulumMateri() {
    const { data, error } = await supabase
      .from('kurikulum')
      .select('id, nama_materi, jilid, halaman_selesai')
      .not('jilid', 'is', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const groups = data.reduce((acc, item) => {
      const groupName = item.jilid;
      if (!acc[groupName]) {
        acc[groupName] = { jilid: groupName, items: [] };
      }
      acc[groupName].items.push({
        id: item.id,
        label: item.nama_materi,
        totalHalaman: item.halaman_selesai
      });
      return acc;
    }, {});

    return Object.values(groups);
  },

  // 3. Eksekusi INSERT payload data pendaftaran santri baru ke tabel Supabase
  async submitPendaftaran(formData, riwayatMateriJson) {
    // Susun objek sosial media bersih jikalau user memilih status 'ya'
    const finalSosmedPayload = formData.punya_sosmed === 'ya' ? formData.sosial_media : null;

    const { data, error } = await supabase
      .from('santri_baru')
      .insert([
        {
          tpq_id: formData.alamat_sambung,
          nama_lengkap: formData.nama_lengkap,
          tempat_lahir: formData.tempat_lahir,
          tanggal_lahir: formData.tanggal_lahir,
          jenis_kelamin: formData.gender,
          nama_sekolah: formData.nama_sekolah === 'Lainnya' ? formData.nama_sekolah_lainnya : formData.nama_sekolah,
          nama_ayah: formData.nama_ayah,
          nama_ibu: formData.nama_ibu,
          nomor_telepon: formData.nomor_telepon,
          alamat_rumah_lengkap: formData.alamat_lengkap,
          hobi: formData.hobi,
          
          // ─── DIKEMBALIKAN KE STRUKTUR ASLI TABEL DATABASE ANDA ───
          minat_bakat: formData.minat_bakat || null, 
          pernah_mondok: formData.pernah_mondok,
          sudah_mt: formData.sudah_mt,
          riwayat_materi: riwayatMateriJson, // KOREKSI UTAMA: Kembali menggunakan nama kolom 'riwayat_materi'
          
          // KOLOM SOSIAL MEDIA BARU
          sosial_media: finalSosmedPayload
        }
      ]);

    if (error) throw error;
    return data;
  }
};