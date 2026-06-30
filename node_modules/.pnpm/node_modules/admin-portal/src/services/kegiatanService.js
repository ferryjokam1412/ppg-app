// src/services/admin-portal/kegiatanService.js
import { supabase } from '../../utils/supabaseClient'; // Sesuaikan relative path client Anda

export const kegiatanService = {
  // 1. Ambil opsi instansi TPQ dari database
  async getTpqOptions() {
    const { data, error } = await supabase
      .from('tpq')
      .select('id, nama')
      .order('nama', { ascending: true });

    if (error) throw error;
    return data.map(item => ({
      value: item.id,
      label: item.nama
    }));
  },

  // 2. Kirim data berita kegiatan baru ke Supabase
  async submitKegiatan(payload) {
    const { data, error } = await supabase
      .from('kegiatan')
      .insert([
        {
          tpq_id: payload.tpq_id,
          nama_kegiatan: payload.nama_kegiatan,
          deskripsi: payload.deskripsi,
          tanggal_terlaksana: payload.tanggal_laksana,
          lokasi: payload.lokasi,
          banner_url: payload.banner_url || null
        }
      ]);

    if (error) throw error;
    return data;
  }
};