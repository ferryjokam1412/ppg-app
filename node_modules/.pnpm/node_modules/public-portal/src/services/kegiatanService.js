// src/services/kegiatanService.js
import { supabase } from '../utils/supabaseClient';

export const kegiatanService = {

  async getLatestKegiatan() {
    const { data, error } = await supabase
      .from('kegiatan')
      .select(`
        id,
        nama_kegiatan,
        deskripsi,
        tanggal_terlaksana,
        lokasi,
        banner_url,
        tpq ( nama )
      `)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    // Mengembalikan data baris pertama jika ada, atau null jika tabel masih kosong
    return data && data.length > 0 ? data[0] : null;
  }
};