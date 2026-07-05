// src/services/reportService.js
import { supabase } from '../utils/supabaseClient';

export const reportService = {
  /**
   * Mengambil data laporan bulanan aman dari blokir RLS
   * @param {string} yearMonth - "YYYY-MM"
   * @param {string} tpqId - ID Cabang
   * @param {string} classId - ID Rombel Kelas Langsung dari Frontend
   * @param {string} namaKelas - Nama literal teks kelas untuk tabel jurnal
   */
  async getMonthlyReportData(yearMonth, tpqId, classId, namaKelas) {
    if (!yearMonth || !tpqId || !classId || !namaKelas) {
      return { jurnalRows: [], absensiRows: [], silabusRows: [], santriRows: [] };
    }

    const startDate = `${yearMonth}-01`;
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      // 💡 SOLUSI RLS: Ambil santri langsung menggunakan classId bawaan login session rombel
      const { data: santriRows, error: santriError } = await supabase
        .from('santri')
        .select('*')
        .or(`class_id.eq.${classId},classId.eq.${classId}`);

      if (santriError) throw santriError;

      // 2. Ambil data pertemuan dari jurnal_kelas
      const { data: jurnalRows, error: jurnalError } = await supabase
        .from('jurnal_kelas')
        .select('*')
        .eq('tpq_id', tpqId)
        .eq('kelas', namaKelas)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: true });

      if (jurnalError) throw jurnalError;

      // Jika tatap muka kosong, langsung balikkan data nama master santri saja
      if (!jurnalRows || jurnalRows.length === 0) {
        return { jurnalRows: [], absensiRows: [], silabusRows: [], santriRows: santriRows || [] };
      }

      const jurnalIds = jurnalRows.map(j => j.id);

      // 3. Ambil data absensi dan silabus secara paralel
      const [absensiRes, silabusRes] = await Promise.all([
        supabase.from('absensi_santri').select('*').in('jurnal_id', jurnalIds),
        supabase.from('capaian_silabus_jurnal').select('*').in('jurnal_id', jurnalIds)
      ]);

      if (absensiRes.error) throw absensiRes.error;
      if (silabusRes.error) throw silabusRes.error;

      return {
        jurnalRows,
        absensiRows: absensiRes.data || [],
        silabusRows: silabusRes.data || [],
        santriRows: santriRows || []
      };
    } catch (err) {
      console.error("Gagal memuat dokumen laporan:", err);
      throw err;
    }
  }
};