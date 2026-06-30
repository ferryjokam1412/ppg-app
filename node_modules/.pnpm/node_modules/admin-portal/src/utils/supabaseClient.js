// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Mengambil variabel environment dari file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi pengaman agar Anda tahu jika ada kredensial yang lupa diinput
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Peringatan: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum terisi di file .env Anda!'
  );
}

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);