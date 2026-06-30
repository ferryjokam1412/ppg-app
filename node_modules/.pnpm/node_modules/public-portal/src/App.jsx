// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Impor komponen Layout dan Pages Anda
import MainLayout from './components/layout/MainLayout'; // Layout utama Anda
import HomePage from './pages/HomePage';               // Halaman landing page Anda
import PendaftaranPage from './pages/PendaftaranPage';


// Komponen rute placeholder kosong untuk mensimulasikan rute baru nanti (Privacy, Terms, dll)
function PlaceholderPage({ title }) {
  return (
    <div className="p-margin-desktop text-center flex-grow flex flex-col justify-center items-center bg-surface-container-low">
      <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/20 shadow-lg">
        <h1 className="text-4xl font-bold text-primary font-headline-md">{title}</h1>
        <p className="mt-4 text-on-surface-variant font-body-lg max-w-md">
          Ini adalah halaman *placeholder* dinamis untuk simulasi rute `{window.location.pathname}`. Konten front-end sebenarnya akan didesain di sini.
        </p>
        <button className="mt-8 bg-primary text-on-primary px-6 py-2 rounded-full font-label-md">
          Kembali
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    // 1. Membungkus seluruh aplikasi dengan BrowserRouter untuk mengaktifkan navigasi
    <BrowserRouter>
      <Routes>
        
        {/* 2. Rute INDUK (Parent Route)
          Kita meletakkan MainLayout di sini. Karena MainLayout berisi TopAppBar dan Footer,
          kedua komponen tersebut akan SELALU muncul di semua rute anak di dalamnya.
        */}
        <Route path="/" element={<MainLayout />}>
          
          {/* 3. Rute ANAK (Child Routes)
            Konten dari komponen di bawah ini akan dirender DI DALAM komponen <Outlet />
            yang ada di dalam MainLayout Anda.
          */}

          {/* Rute default untuk path "/" (Halaman Landing Page Anda) */}
          <Route index element={<HomePage />} />
          
          {/* Contoh Menambahkan Rute Baru Nanti:
            Anda tinggal membuat file page baru (misal PendaftaranPage.jsx)
            lalu menambahkannya di sini.
          */}
          <Route path="daftar" element={<PendaftaranPage />} />

          {/* Rute Placeholder untuk link di Footer (Simulasi) */}
          <Route path="privacy" element={<PlaceholderPage title="Privacy Policy" />} />
          <Route path="terms" element={<PlaceholderPage title="Terms of Service" />} />
          <Route path="support" element={<PlaceholderPage title="Contact Support" />} />
          
          {/* Menangani Rute Salah (404 Not Found) */}
          <Route path="*" element={<PlaceholderPage title="Halaman Tidak Ditemukan (404)" />} />
        
        </Route>

      </Routes>
    </BrowserRouter>
  );
}