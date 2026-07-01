// src/services/admin-portal/santriService.js
import { supabase } from '../utils/supabaseClient';

export const santriService = {
  // 1. Ambil data gabungan langsung dari SQL VIEW terfilter per cabang TPQ
  async getStudentsList(tpqId) {
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
        nama_tpq,
        jenjang,
        divisi,
        keterangan_status,
        classId,
        nama_kelas
      `)
      .eq('tpq_id', tpqId)
      .order('nama_lengkap', { ascending: true });

    if (error) throw error;
    return data;
  },

  // 2. Ambil master list rombel kelas untuk pilihan drop-down mutasi di halaman pengajar
  async getClassesList(tpqId) {
    const { data, error } = await supabase
      .from('master_kelas')
      .select('id, nama_kelas, divisi, jenjang_list') // 💡 UPDATE: Menyertakan jenjang_list agar dibaca StudentsPage
      .eq('tpq_id', tpqId)
      .order('nama_kelas', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 3. Eksekusi Fungsi RPC untuk memindahkan data approval pendaftaran baru
  async approveStudent(studentId) {
    const { data, error } = await supabase
      .rpc('approve_dan_pindah_santri', { p_santri_id: studentId });

    if (error) throw error;
    return data;
  },

  // 4. KUNCI FIX MUTASI: Hanya diperbolehkan mengubah classId, status, dan keterangan_status saja
  async updateStudentMutation(studentId, classId, status, keteranganStatus) {
    const { data, error } = await supabase
      .from('santri')
      .update({ 
        "classId": classId || null,
        status,
        keterangan_status: keteranganStatus 
      })
      .eq('id', studentId);

    if (error) throw error;
    return data;
  }
};