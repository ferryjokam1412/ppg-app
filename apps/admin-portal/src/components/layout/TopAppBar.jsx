// src/components/layout/TopAppBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

export default function TopAppBar({ isSidebarExpanded }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
      {/* 💡 PERBAIKAN: Mengubah max-w dan mx-auto menjadi w-full & px-4 agar mepet penuh di HP */}
      <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full h-16 relative">
        
        {/* Sisi Kiri: Identitas Brand */}
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
          <h1 className="font-bold text-lg text-primary tracking-tight">PPG Portal</h1>
        </div>

        {/* Sisi Kanan: Avatar Interaktif */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-variant/40 transition-colors cursor-pointer outline-none"
          >
            <img 
              alt="Admin User" 
              className="w-8 h-8 rounded-full border border-outline-variant object-cover shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSOBV2yMEtItJVZ69iN-MXRQfVP073eQ_MzUKHvwDYGcpGzispUuuu4ZIM1YrGWeXSFWmKScGEijEAnR1ZgXYmWRZWuhs38dtkteAF13yr7Ok253-7w67vUlTGX7gkS5n6PNTWk3dTM0ARtYWQX-m1rtEbB58ZDkwfyxb9fGdxz7TH9d7DtL7HIh742EkRkYeVAgoEyqEZcO4gzngQF41HKqruQ3sZiGtrepHbyWuTYpeTrbsLpM-MHiqo4rBksPrVXl1nfj857vY"
            />
            <span className="material-symbols-outlined text-on-surface-variant text-lg hidden sm:block">
              {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </button>

          {/* PANEL DROPDOWN AKUN */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white border border-outline-variant/60 rounded-xl shadow-lg py-4 z-50 animate-fadeIn">
              <div className="px-5 pb-3 mb-2 border-b border-outline-variant/40 flex items-center gap-3">
                <div className="truncate">
                  <h4 className="font-bold text-sm text-on-surface truncate">Admin User</h4>
                  <p className="text-xs text-on-surface-variant truncate">super.admin@ppg.com</p>
                </div>
              </div>
              <ul className="text-sm font-semibold text-on-surface-variant">
                <li>
                  <a href="#profile" className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                    Profil Saya
                  </a>
                </li>
                <li className="pt-2 mt-2 border-t border-outline-variant/40">
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-5 py-2.5 hover:bg-error-container/30 text-error font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Keluar Sesi
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