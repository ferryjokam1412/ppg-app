// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // State tambahan untuk menampung data tb profiles
  const [loading, setLoading] = useState(true);

  // Fungsi khusus untuk mengambil data dari tabel public.profiles
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nama, role, tpq_id, divisi')
        .eq('id', userId)
        .single(); // Mengambil 1 baris data murni

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Gagal mengambil data dari tb profiles:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Ambil sesi awal saat aplikasi dimuat
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // 2. Dengarkan perubahan status auth (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null); // Bersihkan profile jika logout
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Properti jalan pintas diambil LANGSUNG dari tabel profiles, bukan metadata lagi
  const value = {
    session,
    user,
    tpqId: profile?.tpq_id || null,
    role: profile?.role || 'pengajar',
    namaUser: profile?.nama || '',
    divisi: profile?.divisi || null,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);