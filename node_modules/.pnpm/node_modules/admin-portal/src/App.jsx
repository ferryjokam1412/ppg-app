// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { AuthProvider } from './context/AuthContext';

// Impor Layout Utama & Halaman
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import JournalsPage from './pages/JournalsPage';
import StudentsPage from './pages/StudentsPage';
import TeacherPage from './pages/TeacherPage';
import LoginPage from './pages/LoginPage';
import InstitutionPage from './pages/InstitutionProfilePage'
import ManagementJurnalKelas from './pages/ManagementJurnalKelas';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil sesi login yang tersimpan di lokal browser saat pertama kali aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Dengarkan perubahan status auth (Login, Logout, Token Expired) secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tampilan loading screen tipis agar halaman tidak berkedip (*flicker*) saat mengecek sesi
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-on-surface-variant animate-pulse">Memverifikasi Sesi...</p>
      </div>
    );
  }

  const isAuthenticated = !!session;

  return (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        
        {/* RUTE PUBLIK: Jika sudah login, tidak boleh masuk ke halaman /login lagi (diarahkan ke root) */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
        />

        {/* RUTE TERPROTEKSI: Jika belum login, paksa tendang ke halaman /login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="jadwal" element={<JournalsPage />} />
          <Route path="journals" element={<ManagementJurnalKelas />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeacherPage />} />
          <Route path="profile" element={<InstitutionPage />} />
          
          {/* Untuk sementara menu setting diarahkan ke beranda */}
          <Route path="settings" element={<Navigate to="/" replace />} />
        </Route>

        {/* CATCH ALL URL */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  </AuthProvider>
  );
}