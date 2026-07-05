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

  // 4. 💡 UPDATE KOREKSI: Mengambil plot target silabus harian secara adaptif berdasarkan rumpun divisi KBM
  async getJadwalHariIni(periode, hariKe, divisi, arrayJenjangSantri) {
    // Dapatkan representasi tanggal riil hari ini (Format: YYYY-MM-DD) untuk pencocokan rentang waktu muda-mudi
    const sekarang = new Date();
    const y = sekarang.getFullYear();
    const m = String(sekarang.getMonth() + 1).padStart(2, '0');
    const d = String(sekarang.getDate()).padStart(2, '0');
    const formatTanggalHariIni = `${y}-${m}-${d}`;

    let query = supabase
      .from('jadwal_kurikulum')
      .select('*')
      .eq('periode', periode)
      .eq('divisi', divisi)
      .in('jenjang', arrayJenjangSantri);
      
    // Jalur kueri kondisional pintar membedakan mekanisme plotting administrasi pengajaran
    if (divisi === 'caberawit') {
      query = query.eq('target_hari', hariKe);
    } else {
      // Mencari baris target rentang di mana: tanggal_mulai <= hari_ini <= tanggal_selesai
      query = query.lte('tanggal_mulai', formatTanggalHariIni).gte('tanggal_selesai', formatTanggalHariIni);
    }

    const { data, error } = await query;
    if (error) throw error; 
    return data || [];
  },

  // 5. Ambil log histori jurnal dalam rentang bulan terpilih khusus untuk TPQ tersebut
  async getHistoryLogs(filterStartDate, filterEndDate, tpqId) {
    let query = supabase
      .from('jurnal_kelas')
      .select(`
        *,
        absensi_santri (
          id,
          status,
          santri (
            nama_lengkap
          )
        ),
        capaian_silabus_jurnal ( * )
      `) // 💡 KOREKSI: Melakukan multidimensional fetch relasional terstruktur
      .gte('tanggal', filterStartDate)
      .lte('tanggal', filterEndDate)
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

  // 8. Hapus berkas data rombel kelas dari pangkalan database
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
      .insert([payload])
      .select()          // 💡 JALUR PERBAIKAN: Tambahkan select agar data dibaca kembali
      .single();         // 💡 Ambil sebagai single object {} bukan array [{}]
      
    if (error) throw error;
    return data;
  },

  // 11. 🌟 TAMBAHKAN: Fungsi Bulk Insert Absensi Santri
  async insertBulkAbsensiSantri(absensiRows) {
    const { data, error } = await supabase
      .from('absensi_santri')
      .insert(absensiRows)
      .select();
      
    if (error) throw error;
    return data;
  },

  // 12. 🌟 TAMBAHKAN: Fungsi Bulk Insert Capaian Silabus Terpisah
  async insertBulkCapaianSilabus(silabusRows) {
    const { data, error } = await supabase
      .from('capaian_silabus_jurnal')
      .insert(silabusRows)
      .select();
      
    if (error) throw error;
    return data;
  }
};