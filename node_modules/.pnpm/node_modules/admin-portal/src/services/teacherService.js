// src/services/teacherService.js
import { supabase } from '../utils/supabaseClient';

export const teacherService = {
  // 1. Ambil daftar semua pengajar di TPQ terkait
  async getTeachers(tpqId) {
    const { data, error } = await supabase
      .from('pengajar')
      .select('*')
      .eq('tpq_id', tpqId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(t => ({
      id: t.id,
      nip: t.nip,
      name: t.nama,
      pob: t.tempat_lahir || '-',
      dob: t.tanggal_lahir || '',
      gender: t.jenis_kelamin || 'L',
      statusMubaligh: t.status_mubaligh || 'MS',
      startDuty: t.mulai_tugas || '',
      teachingType: t.tipe_mengajar || 'flexible',
      assignedClass: t.ploting_kelas || ''
    }));
  },

  // 2. Tambah data pengajar baru
  async createTeacher(tpqId, teacherData) {
    const { data, error } = await supabase
      .from('pengajar')
      .insert([
        {
          tpq_id: tpqId,
          nama: teacherData.name,
          jenis_kelamin: teacherData.gender,
          tempat_lahir: teacherData.pob,
          tanggal_lahir: teacherData.dob || null,
          status_mubaligh: teacherData.statusMubaligh,
          mulai_tugas: teacherData.statusMubaligh === 'MT' ? teacherData.startDuty : null,
          tipe_mengajar: teacherData.teachingType,
          ploting_kelas: teacherData.teachingType === 'spesifik' ? teacherData.assignedClass : null
        }
      ]);

    if (error) throw error;
    return data;
  },

  // 3. KOREKSI TAMBAHAN: Fungsi Hapus Data Pengajar dari Tabel
  async deleteTeacher(id) {
    const { data, error } = await supabase
      .from('pengajar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  }
};