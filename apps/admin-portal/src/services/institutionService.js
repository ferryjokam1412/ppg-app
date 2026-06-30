// src/services/institutionService.js
import { supabase } from '../utils/supabaseClient';

export const institutionService = {
  // 1. Mengambil informasi profil TPQ beserta statistik live dari tabel terkait
  async getProfile(tpqId) {
    // Ambil data profil utama TPQ
    const { data: tpqData, error: tpqError } = await supabase
      .from('tpq')
      .select('*')
      .eq('id', tpqId)
      .single();

    if (tpqError) throw tpqError;

    // AMBIL STATISTIK LIVE DARI TABEL SANTRI & TABEL PENGAJAR YANG BARU
    const [studentsCount, teachersCount] = await Promise.all([
      supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .eq('tpq_id', tpqId)
        .eq('status_aktif', true),
        
      // KOREKSI UTAMA: Mengubah target pencarian dari 'profiles' ke tabel 'pengajar'
      supabase
        .from('pengajar')
        .select('*', { count: 'exact', head: true })
        .eq('tpq_id', tpqId) 
    ]);

    // Format default struktur jika data di DB masih steril
    const defaultJadwal = {
      caberawit: { 
        hari: 'Belum diatur', 
        waktu: 'Belum diatur',
        jumlah_kelas: 0,
        rincian_kelas: []
      },
      muda_mudi: {
        is_serentak: false,
        hari_serentak: '',
        waktu_serentak: '',
        pra_remaja: { hari: 'Belum diatur', waktu: 'Belum diatur' },
        remaja: { hari: 'Belum diatur', waktu: 'Belum diatur' },
        pra_nikah: { hari: 'Belum diatur', waktu: 'Belum diatur' }
      }
    };

    const jadwalFinal = tpqData.jadwal_belajar || defaultJadwal;

    return {
      id: tpqData.id,
      name: tpqData.nama || 'Nama TPQ Belum Diatur',
      bannerColor: tpqData.warna_banner || 'from-primary to-primary-container',
      logoUrl: tpqData.url_logo || '', 
      coverUrl: tpqData.url_sampul || '', 
      address: tpqData.alamat || 'Alamat belum diisi.',
      mapsUrl: tpqData.url_maps || '#',
      sambung: tpqData.sambung || '-',
      facilities: tpqData.fasilitas || [],
      jadwalBelajar: jadwalFinal,
      stats: {
        students: studentsCount.count || 0,
        // Properti ini sekarang otomatis terisi dengan jumlah baris riil di tabel pengajar
        teachers: teachersCount.count || 0, 
        classrooms: jadwalFinal.caberawit?.jumlah_kelas || 0 
      },
      headmaster: {
        name: tpqData.nama_kepala || 'Belum Diatur',
        role: `Kepala ${tpqData.nama || 'TPQ'}`,
        whatsappUrl: tpqData.wa_kepala ? `https://wa.me/${tpqData.wa_kepala}` : '#',
        phoneUrl: tpqData.wa_kepala ? `tel:+${tpqData.wa_kepala}` : '#',
        avatarUrl: tpqData.avatar_kepala || '' 
      }
    };
  },

  // 2. Memperbarui informasi profil lembaga ke database
  async updateProfile(tpqId, updatedData) {
    const { data, error } = await supabase
      .from('tpq')
      .update({
        nama: updatedData.name,
        url_logo: updatedData.logoUrl,
        url_sampul: updatedData.coverUrl,
        avatar_kepala: updatedData.headmasterAvatarUrl,
        alamat: updatedData.address,
        url_maps: updatedData.mapsUrl,
        sambung: updatedData.sambung,
        nama_kepala: updatedData.headmasterName,
        wa_kepala: updatedData.headmasterPhone,
        jadwal_belajar: updatedData.jadwalBelajar 
      })
      .eq('id', tpqId);

    if (error) throw error;
    return data;
  }
};