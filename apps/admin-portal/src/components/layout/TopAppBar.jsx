// src/components/layout/TopAppBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import  { supabase } from '../../utils/supabaseClient'

export default function TopAppBar({ isSidebarExpanded }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menutup dropdown otomatis jika pengguna mengklik di luar area dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
  try {
    // Memutuskan sesi aktif di Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Setelah signOut berhasil, App.jsx akan mendeteksi perubahan 
    // dan otomatis mengarahkan user kembali ke halaman /login
    console.log("Sesi berhasil diakhiri secara aman.");
  } catch (error) {
    console.error("Gagal melakukan logout:", error.message);
  }
};

  return (
    <header 
      className={`w-full top-0 bg-white border-b border-outline-variant shadow-sm z-50 sticky transition-all duration-300 ${
        isSidebarExpanded ? 'md:pl-72' : 'md:pl-20'
      }`}
    >
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto h-16 relative">
        
        {/* Sisi Kiri: Identitas Brand */}
        <div className="flex items-center gap-3 selection:bg-primary-container/30">
          <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
          <h1 className="font-headline-md text-xl font-bold text-primary">PPG Portal</h1>
        </div>

        {/* Sisi Kanan: Avatar Interaktif dengan Dropdown Konten Akun */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-variant/40 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
          >
            <img 
              alt="Admin User" 
              className="w-9 h-9 rounded-full border border-outline-variant object-cover shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSOBV2yMEtItJVZ69iN-MXRQfVP073eQ_MzUKHvwDYGcpGzispUuuu4ZIM1YrGWeXSFWmKScGEijEAnR1ZgXYmWRZWuhs38dtkteAF13yr7Ok253-7w67vUlTGX7gkS5n6PNTWk3dTM0ARtYWQX-m1rtEbB58ZDkwfyxb9fGdxz7TH9d7DtL7HIh742EkRkYeVAgoEyqEZcO4gzngQF41HKqruQ3sZiGtrepHbyWuTYpeTrbsLpM-MHiqo4rBksPrVXl1nfj857vY"
            />
            <span className="material-symbols-outlined text-on-surface-variant text-lg hidden sm:block">
              {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </button>

          {/* PANEL DROPDOWN AKUN */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white border border-outline-variant/60 rounded-xl shadow-lg py-4 z-50 animate-fadeIn selection:bg-secondary/20">
              
              {/* Info Detail Profil User (Pindahan dari Sidebar) */}
              <div className="px-5 pb-3 mb-2 border-b border-outline-variant/40 flex items-center gap-3">
                <img 
                  alt="Admin Profile Large" 
                  className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAXzBGaPAxG5M2LBWjF8QXCDVyDa9V_LqeXaCmH7MhPauI4_2tudsqYf6at6oo2hf4qApvZiGBb4H6wvG17NgL1A-8C9bA_dGLf9ufTmiXpvJ_jbyVWRmCKQNRY1nlg4Nfh9sA5FXOZV9K87giRzgh-3mcyxEg5CFQ9ILum5JZI9yb8qlNqnBtVErCjEcyDRg5XavzU1GRifrlW8gI57A5lf57Ay7YjpjUsLu6EyIVVGXBBVCDqiBDkpo2RibYVO0IdigF0zVXFxk"
                />
                <div className="truncate">
                  <h4 className="font-bold text-sm text-on-surface truncate">Admin User</h4>
                  <p className="text-xs text-on-surface-variant truncate">super.admin@ppg.com</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-md">
                    Central Admin
                  </span>
                </div>
              </div>

              {/* Pilihan Menu Dropdown */}
              <ul className="text-sm font-semibold text-on-surface-variant">
                <li>
                  <a href="#profile" className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                    Profil Saya
                  </a>
                </li>
                <li>
                  <a href="#help" className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">help</span>
                    Bantuan & Dukungan
                  </a>
                </li>
                <li className="pt-2 mt-2 border-t border-outline-variant/40">
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-5 py-2.5 hover:bg-error-container/30 text-error hover:text-error transition-colors cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Keluar Sesi (Logout)
                  </button>
                </li>
              </ul>
              
            </div>
          )}
        </div>

      </div>
    </header>
  );
}