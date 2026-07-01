// src/services/jurnalKelasService.js
import { supabase } from '../utils/supabaseClient';

export const jurnalKelasService = {
  // 1. Ambil daftar rombel kelas berdasarkan Divisi DAN Cabang TPQ aktif
  async getClasses(divisi, tpqId) {
    const { data, error } = await supabase
      .from('master_kelas')
      .select('*')
      .eq('divisi', divisi)
      .eq('tpq_id', tpqId)
      .order('nama_kelas', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  // 2. Ambil data semua santri aktif khusus di TPQ tersebut dengan Auto-Mapping Properti
  async getStudents(tpqId) {
    const { data, error } = await supabase
      .from('santri')
      .select('*')
      .eq('tpq_id', tpqId)
      .order('nama_lengkap', { ascending: true });
      
    if (error) throw error;
    
    // Auto-map data agar langsung cocok dengan variabel yang diminta oleh UI frontend
    return (data || []).map(s => ({
      ...s,
      name: s.nama_lengkap, 
      classId: s.classId || s.class_id 
    }));
  },

  // 3. Ambil data guru pengajar yang bertugas di TPQ tersebut
  async getPengajar(tpqId) {
    let query = supabase.from('pengajar').select('*').order('nama', { ascending: true });
    
    if (tpqId) {
      query = query.eq('tpq_id', tpqId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 4. Ambil plot target kurikulum hari ini
  async getJadwalHariIni(periode, hariKe, divisi, arrayJenjangSantri) {
    const { data, error } = await supabase
      .from('jadwal_kurikulum')
      .select('*')
      .eq('periode', periode)
      .eq('target_hari', hariKe)
      .eq('divisi', divisi)
      .in('jenjang', arrayJenjangSantri);
      
    if (error) throw error;
    return data || [];
  },

  // 5. Ambil log histori jurnal dalam rentang bulan terpilih khusus untuk TPQ tersebut
  async getHistoryLogs(startDate, endDate, tpqId) {
    let query = supabase
      .from('jurnal_kelas')
      .select('*')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false });
      
    if (tpqId) {
      query = query.eq('tpq_id', tpqId);
    }
      
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 6. Simpan data rombel kelas baru (Mendukung parameter jam_mulai & jam_selesai)
  async insertClass(namaKelas, divisi, tpqId, jenjangList, jamMulai, jamSelesai) {
    const { data, error } = await supabase
      .from('master_kelas')
      .insert([
        { 
          nama_kelas: namaKelas, 
          divisi: divisi,       
          tpq_id: tpqId,
          jenjang_list: jenjangList,
          jam_mulai: jamMulai || '15:30',
          jam_selesai: jamSelesai || '17:00'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 7. Perbarui konfigurasi rombel kelas lama termasuk perubahan jam operasional
  async updateClass(id, namaKelas, jenjangList, jamMulai, jamSelesai) {
    const { data, error } = await supabase
      .from('master_kelas')
      .update({ 
        nama_kelas: namaKelas, 
        jenjang_list: jenjangList,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // 8. 💡 BARU: Hapus berkas data rombel kelas dari pangkalan database
  async deleteClass(id) {
    const { error } = await supabase
      .from('master_kelas')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },

  // 9. Mutasi rombel kelas siswa santri di tingkat lapangan (dikunci oleh sistem)
  async mutateStudentClass(studentId, targetClassId, optionalJenjang, optionalDivisi) {
    const payload = { "classId": targetClassId };
    
    if (optionalJenjang) payload.jenjang = optionalJenjang;
    if (optionalDivisi) payload.divisi = optionalDivisi;

    const { error } = await supabase
      .from('santri')
      .update(payload)
      .eq('id', studentId);
      
    if (error) throw error;
    return true;
  },

  // 10. Terbitkan laporan berkas jurnal kelas & manifes absensi harian
  async insertJurnalKelas(payload) {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .insert([payload]);
      
    if (error) throw error;
    return data;
  }
};