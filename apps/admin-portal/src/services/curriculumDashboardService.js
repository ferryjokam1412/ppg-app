// src/services/curriculumDashboardService.js
import { supabase } from '../utils/supabaseClient';

export const curriculumDashboardService = {
  /**
   * Mengambil data analitik dan ringkasan kendali untuk Tim Kurikulum
   * @param {string} tpqId - ID Multi-tenant cabang
   */
  async getCurriculumDashboardSummary(tpqId) {
    if (!tpqId) return { totalSantri: 0, totalPengajar: 0, totalRombel: 0, jurnalHariIni: [] };

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Jalankan kueri penghitungan (count) secara paralel agar loading dashboard instan
      const [santriRes, pengajarRes, rombelRes, jurnalRes] = await Promise.all([
        supabase
          .from('santri')
          .select('*', { count: 'exact', head: true })
          .eq('tpq_id', tpqId),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tpq_id', tpqId)
          .eq('role', 'pengajar'),
        supabase
          .from('master_kelas')
          .select('*', { count: 'exact', head: true })
          .eq('tpq_id', tpqId),
        supabase
          .from('jurnal_kelas')
          .select('*')
          .eq('tpq_id', tpqId)
          .eq('tanggal', todayStr)
      ]);

      if (santriRes.error) throw santriRes.error;
      if (pengajarRes.error) throw pengajarRes.error;
      if (rombelRes.error) throw rombelRes.error;
      if (jurnalRes.error) throw jurnalRes.error;

      return {
        totalSantri: santriRes.count || 0,
        totalPengajar: pengajarRes.count || 0,
        totalRombel: rombelRes.count || 0,
        jurnalHariIni: jurnalRes.data || []
      };
    } catch (err) {
      console.error("Gagal memuat dokumen analitik kurikulum:", err);
      throw err;
    }
  }
};