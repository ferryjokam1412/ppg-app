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
      className={`fixed top-0 right-0 h-16 bg-white border-b border-outline-variant/30 z-30 flex items-center justify-between transition-all duration-300 w-full pl-4 pr-4 ${
        isSidebarExpanded ? 'md:pl-76' : 'md:pl-24'
      }`} // 💡 Mengoptimalkan padding kiri agar konten teks / judul di main workspace mepet rapi ke kiri
    >
      {/* AREA KIRI: Judul Dinamis Halaman (Mepet Kiri) */}
      <div className="flex items-center gap-2 select-none">
        <span className="text-sm font-black text-on-surface tracking-tight uppercase bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/20">
          Internal Portal
        </span>
      </div>

      {/* AREA KANAN: Avatar Profile Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center cursor-pointer overflow-hidden transition-all active:scale-95 hover:border-primary"
          >
            <span className="material-symbols-outlined text-primary font-bold text-xl">person</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white border border-outline-variant/60 rounded-2xl shadow-xl py-3 z-50 animate-scaleUp origin-top-right">
              <div className="px-5 pb-2 mb-2 border-b border-outline-variant/40">
                <p className="text-xs font-black text-on-surface">Otoritas Akun</p>
                <p className="text-[10px] text-on-surface-variant font-medium truncate">Sesi Aktif Portal Pengajar</p>
              </div>
              
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