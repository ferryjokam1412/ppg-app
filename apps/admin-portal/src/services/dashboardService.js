// src/services/dashboardService.js
import { supabase } from '../utils/supabaseClient';

export const dashboardService = {
  /**
   * Mengambil ringkasan data ringkas untuk dashboard pengajar
   * @param {string} tpqId - ID Cabang TPQ
   * @param {string} pembimbingNama - Nama guru pengajar untuk filter jurnal
   */
  async getTeacherDashboardSummary(tpqId, pembimbingNama) {
    if (!tpqId) return { totalSantri: 0, jurnalHariIniCount: 0, hariIniLogs: [] };

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // 1. KUERI TOTAL SANTRI: Hitung total santri aktif di TPQ cabang ini
      const { count: totalSantri, error: santriError } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .eq('tpq_id', tpqId);

      if (santriError) throw santriError;

      // 2. KUERI JURNAL HARI INI: Cek log mengajar guru bersangkutan pada tanggal hari ini
      const { data: hariIniLogs, error: jurnalError } = await supabase
        .from('jurnal_kelas')
        .select('*')
        .eq('tpq_id', tpqId)
        .eq('tanggal', todayStr);

      if (jurnalError) throw jurnalError;

      // Filter mandiri jurnal yang diampu oleh guru bersangkutan (menghindari limitasi filter RLS teks)
      const jurnalSayaHariIni = hariIniLogs.filter(j => 
        j.pengajar && j.pengajar.toLowerCase().includes(pembimbingNama.toLowerCase())
      );

      return {
        totalSantri: totalSantri || 0,
        jurnalHariIniCount: jurnalSayaHariIni.length,
        allJurnalHariIni: hariIniLogs || []
      };
    } catch (err) {
      console.error("Gagal memuat ringkasan dashboard:", err);
      throw err;
    }
  }
};