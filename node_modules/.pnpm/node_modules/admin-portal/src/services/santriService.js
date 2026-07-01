// src/services/admin-portal/santriService.js
import { supabase } from '../utils/supabaseClient';

export const santriService = {
  // 1. Ambil data gabungan langsung dari SQL VIEW (Sertakan parameter tpqId)
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
        keterangan_status
      `)
      .eq('tpq_id', tpqId) // 💡 TAMBAHKAN FILTER INI AGAR SANTRI TERSELEKSI PER TPQ
      .order('nama_lengkap', { ascending: true });

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

  // 3. Mutasi tingkat lapangan: Ditambahkan parameter status & keterangan_status
  async updateStudentMutation(studentId, jenjang, divisi, status, keteranganStatus) {
    const { data, error } = await supabase
      .from('santri')
      .update({ 
        jenjang, 
        divisi, 
        status, 
        keterangan_status: keteranganStatus 
      })
      .eq('id', studentId);

    if (error) throw error;
    return data;
  }
};