// src/services/kurikulumGlobalService.js
import { supabase } from '../utils/supabaseClient';

export const kurikulumGlobalService = {
  /**
   * 1. Ambil semua daftar TPQ Cabang untuk opsi filter dropdown
   */
  async getTpqList() {
    const { data, error } = await supabase
      .from('tpq')
      .select('id, nama')
      .order('nama', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * 2. Ambil log jurnal global (Hanya join ke tabel TPQ yang sudah aman)
   */
  async getGlobalJournals(startDate, endDate) {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .select(`
        *,
        tpq (
          id,
          nama
        )
      `)
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 3. 💡 BARU: Ambil semua data master kelas untuk pemetaan jenjang hibrida
   */
  async getAllMasterKelas() {
    const { data, error } = await supabase
      .from('master_kelas')
      .select('id, nama_kelas, tpq_id, jenjang_list');

    if (error) throw error;
    return data || [];
  }
};