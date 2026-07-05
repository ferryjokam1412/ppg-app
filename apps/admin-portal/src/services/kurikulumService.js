// src/services/admin-portal/kurikulumService.js
import { supabase } from '../utils/supabaseClient';

export const kurikulumService = {
  // --- JADWAL KANVAS ENGINE ---
  async getSavedTargets(divisi, jenjang, periode) {
    const { data, error } = await supabase.from('jadwal_kurikulum').select('*').eq('divisi', divisi).eq('jenjang', jenjang).eq('periode', periode);
    if (error) throw error; return data || [];
  },
  async upsertTargetKurikulum(payload) {
    const { data, error } = await supabase.from('jadwal_kurikulum').upsert(payload).select();
    if (error) throw error; return data;
  },

  // --- CRUD BANK SILABUS MASTER MATERI (TERBARU) ---
  async getMasterMaterials() {
      const { data, error } = await supabase.from('kurikulum').select('*').order('kategori', { ascending: true }).order('nama_materi', { ascending: true });
      if (error) throw error; return data || [];
    },
    async insertMasterMaterial(payload) {
      const { data, error } = await supabase.from('kurikulum').insert([payload]).select().single();
      if (error) throw error; return data;
    },
    async updateMasterMaterial(id, payload) {
      const { data, error } = await supabase.from('kurikulum').update(payload).eq('id', id).select().single();
      if (error) throw error; return data;
    },
    async deleteMasterMaterial(id) {
      const { error } = await supabase.from('kurikulum').delete().eq('id', id);
      if (error) throw error; return true;
    },
  
    // ─── FUNGSI BARU: CRUD KATEGORI DINAMIS DATABASE ───
    async getKategoriList() {
      const { data, error } = await supabase
        .from('kategori_kurikulum')
        .select('*')
        .order('nama_kategori', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async insertKategori(nama) {
      const { data, error } = await supabase
        .from('kategori_kurikulum')
        .insert([{ nama_kategori: nama.toUpperCase().trim() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async updateKategori(id, nama) {
      const { data, error } = await supabase
        .from('kategori_kurikulum')
        .update({ nama_kategori: nama.toUpperCase().trim() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async deleteKategori(id) {
      const { error } = await supabase
        .from('kategori_kurikulum')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },
};