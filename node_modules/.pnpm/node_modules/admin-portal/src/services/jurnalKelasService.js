// src/services/jurnalKelasService.js
import { supabase } from '../utils/supabaseClient';

export const jurnalKelasService = {
  // 1. Ambil daftar rombel kelas berdasarkan Divisi DAN Cabang TPQ aktif
  async getClasses(divisi, tpqId) {
    const { data, error } = await supabase
      .from('master_kelas')
      .select('*')
      .eq('divisi', divisi)
      .eq('tpq_id', tpqId) // <-- FILTER: Membatasi rombel hanya milik TPQ yang bersangkutan
      .order('nama_kelas', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  // 2. Ambil data semua santri aktif khusus di TPQ tersebut
  async getStudents(tpqId) {
    const { data, error } = await supabase
      .from('santri')
      .select('*')
      .eq('tpq_id', tpqId) 
      .order('nama_lengkap', { ascending: true });
      
    if (error) throw error;
    
    // 💡 JALUR AMAN: Map data agar langsung cocok dengan variabel yang diminta oleh UI
    return (data || []).map(s => ({
      ...s,
      name: s.nama_lengkap, // Menyelaraskan nama_lengkap menjadi .name untuk UI Jurnal
      classId: s.classId || s.class_id // Mengantisipasi sensitivitas huruf besar/kecil pada kolom DB
    }));
  },

  // 3. Ambil data guru pengajar yang bertugas di TPQ tersebut
  async getPengajar(tpqId) {
    let query = supabase.from('pengajar').select('*').order('nama', { ascending: true });
    
    // Jika di tabel pengajar Anda ada kolom tpq_id, aktifkan filter ini:
    if (tpqId) {
      query = query.eq('tpq_id', tpqId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 4. Ambil plot target kurikulum harian
  async getJadwalHariIni(periode, hariKe, divisi, arrayJenjangSantri) {
    const { data, error } = await supabase
      .from('jadwal_kurikulum')
      .select('*')
      .eq('periode', periode)
      .eq('target_hari', hariKe)
      .eq('divisi', divisi)
      .in('jenjang', arrayJenjangSantri); // Menyaring baris sesuai komposit jenjang rombel terpilih
      
    if (error) throw error;
    return data || [];
  },

  // 5. Ambil log histori jurnal dalam rentang tanggal khusus untuk TPQ tersebut
  async getHistoryLogs(startDate, endDate, tpqId) {
    let query = supabase
      .from('jurnal_kelas')
      .select('*')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false });
      
    // Jika tabel jurnal_kelas Anda memiliki kolom tpq_id untuk isolasi rekap:
    if (tpqId) {
      query = query.eq('tpq_id', tpqId);
    }
      
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 6. Simpan data rombel kelas baru terikat dengan tpq_id pemiliknya
  async insertClass(namaKelas, divisi, tpqId, jenjangList) {
    const { data, error } = await supabase
      .from('master_kelas')
      .insert([
        { 
          nama_kelas: namaKelas, 
          divisi: divisi,       
          tpq_id: tpqId,          // <-- MENYIMPAN ID TPQ PEMBUAT
          jenjang_list: jenjangList 
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 7. Perbarui konfigurasi rombel kelas lama
  async updateClass(id, namaKelas, jenjangList) {
    const { data, error } = await supabase
      .from('master_kelas')
      .update({ nama_kelas: namaKelas, jenjang_list: jenjangList })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // 8. Mutasi rombel kelas santri di tingkat lapangan
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

  // 9. Terbitkan laporan berkas jurnal kelas & absensi harian
  async insertJurnalKelas(payload) {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .insert([payload]);
      
    if (error) throw error;
    return data;
  }
};