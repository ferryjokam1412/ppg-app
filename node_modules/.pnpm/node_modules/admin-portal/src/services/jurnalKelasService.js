// src/services/jurnalKelasService.js
import { supabase } from '../utils/supabaseClient';

export const jurnalKelasService = {
  // Ambil semua daftar rombel kelas caberawit
  async getClasses(divisi) {
    const { data, error } = await supabase
      .from('master_kelas')
      .select('*')
      .eq('divisi', divisi)
      .order('nama_kelas', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Ambil data semua santri aktif
  async getStudents() {
    const { data, error } = await supabase
      .from('santri')
      .select('*')
      .order('nama_lengkap', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Ambil data guru pengajar
  async getPengajar() {
    const { data, error } = await supabase
      .from('pengajar')
      .select('*')
      .order('nama', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Ambil plot target kurikulum hari ini
  // Contoh jika ke depan ingin memfilter jadwal kurikulum persis berdasarkan isi jenjang_list rombel
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

  // Ambil log histori jurnal dalam rentang bulan terpilih
  async getHistoryLogs(startDate, endDate) {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .select('*')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Simpan data rombel kelas baru (Menyimpan array jenjang_list)
  // ISI URUTANNYA: namaKelas, divisi, baru jenjangList
async insertClass(namaKelas, divisi, jenjangList) {
  const { data, error } = await supabase
    .from('master_kelas')
    .insert([
      { 
        nama_kelas: namaKelas, 
        divisi: divisi,       // <-- Masuk ke kolom teks biasa
        jenjang_list: jenjangList // <-- Masuk ke kolom Array TEXT[]
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
},

  // Perbarui konfigurasi rombel kelas lama
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

  // Mutasi kelas/rombel siswa santri
  // Tambahkan/timpa fungsi mutateStudentClass di src/services/jurnalKelasService.js Anda
async mutateStudentClass(studentId, targetClassId, optionalJenjang, optionalDivisi) {
  const payload = { "classId": targetClassId };
  
  // Jika di lapangan pengajar ingin memaksa merubah jenjang/divisi di luar standar umur lahirnya:
  if (optionalJenjang) payload.jenjang = optionalJenjang;
  if (optionalDivisi) payload.divisi = optionalDivisi;

  const { error } = await supabase
    .from('santri')
    .update(payload)
    .eq('id', studentId);
    
  if (error) throw error;
  return true;
},

  // Terbitkan laporan berkas jurnal kelas & manifes absensi harian
  async insertJurnalKelas(payload) {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .insert([payload]);
    if (error) throw error;
    return data;
  }
};