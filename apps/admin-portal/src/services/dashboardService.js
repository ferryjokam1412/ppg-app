// src/services/dashboardService.js
import { supabase } from '../utils/supabaseClient';

export const dashboardService = {
  // 1. Mengambil hitungan agregat untuk 3 kartu bento grid
  async getMetrics(tpqId) {
    const [students, journals, teachers] = await Promise.all([
      supabase.from('santri').select('*', { count: 'exact', head: true }).eq('tpq_id', tpqId).eq('status_aktif', true),
      supabase.from('jurnal_harian').select('*', { count: 'exact', head: true }).eq('tpq_id', tpqId),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tpq_id', tpqId).eq('role', 'pengajar')
    ]);

    if (students.error) throw students.error;
    if (journals.error) throw journals.error;
    if (teachers.error) throw teachers.error;

    return {
      activeStudents: students.count || 0,
      completedJournals: journals.count || 0,
      activeTeachers: teachers.count || 0
    };
  },

  // 2. Mengambil 3 log aktivitas mengajar terbaru
  async getRecentActivities(tpqId) {
    const { data, error } = await supabase
      .from('jurnal_harian')
      .select('id, tanggal, sesi, kurikulum(judul_materi)')
      .eq('tpq_id', tpqId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data;
  }
};