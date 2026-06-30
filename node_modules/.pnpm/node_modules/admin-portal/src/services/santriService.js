// src/services/admin-portal/santriService.js
import { supabase } from '../utils/supabaseClient';

export const santriService = {
  // 1. Ambil data gabungan langsung dari SQL VIEW
  async getStudentsList() {
    const { data, error } = await supabase
      .from('vw_direktori_santri')
      .select(`
        id,
        nis_display,
        nama_lengkap,
        tanggal_lahir,
        jenis_kelamin,
        nomor_telepon,
        status,
        sudah_mt,
        pernah_mondok,
        tpq_id,
        nama_tpq
      `) // <-- Mengambil data jenjang dan divisi dari database
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 2. Eksekusi Fungsi RPC untuk memindahkan data approval
  async approveStudent(studentId) {
    const { data, error } = await supabase
      .rpc('approve_dan_pindah_santri', { p_santri_id: studentId });

    if (error) throw error;
    return data;
  },

  // 3. Mutasi khusus Jenjang dan Divisi oleh Pengajar di lapangan
  async updateStudentMutation(studentId, jenjang, divisi) {
    const { data, error } = await supabase
      .from('santri')
      .update({ jenjang, divisi })
      .eq('id', studentId);

    if (error) throw error;
    return data;
  }
};