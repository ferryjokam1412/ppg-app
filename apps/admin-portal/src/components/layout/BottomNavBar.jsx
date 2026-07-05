// src/components/layout/BottomNavBar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // 💡 1. Import AuthContext Anda

export default function BottomNavBar() {
  const location = useLocation();
  const { role } = useAuth(); // 💡 2. Ambil role user ("kurikulum" / "pengajar")
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [activeDropUp, setActiveDropUp] = useState(null); 

  useEffect(() => {
    const handleToggleNav = (e) => setIsNavHidden(e.detail);
    window.addEventListener('hide-bottom-nav', handleToggleNav);
    return () => window.removeEventListener('hide-bottom-nav', handleToggleNav);
  }, []);

  useEffect(() => {
    setActiveDropUp(null); 
  }, [location]);

  const navItems = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Jadwal', path: '/jadwal', icon: 'menu_book', subKey: 'jadwal' }, 
    { name: 'Journals', path: '/Journals', icon: 'Assignment_Add' },
    { name: 'Guru & Generus', path: '/teachers', icon: 'groups', subKey: 'master' },  
    { name: 'Profile', path: '/profile', icon: 'info' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
      
      {/* 🌤️ 1. DROP-UP MENU JADWAL (Hanya Aktif Jika Role Kurikulum) */}
      {role === 'kurikulum' && (
        <div className={`mx-4 mb-2 p-1.5 bg-white border border-outline-variant rounded-2xl shadow-xl flex flex-col gap-1 transition-all duration-300 ease-out-back ${
          activeDropUp === 'jadwal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'
        }`}>
          <Link to="/jadwal?tab=silabus" className={`py-3 px-4 rounded-xl flex items-center gap-3 font-bold text-xs ${(location.pathname + location.search) === '/jadwal?tab=silabus' ? 'bg-primary/10 text-primary font-black' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">developer_guide</span> Acuan Silabus
          </Link>
          <Link to="/jadwal?tab=jadwal" className={`py-3 px-4 rounded-xl flex items-center gap-3 font-bold text-xs ${(location.pathname + location.search) === '/jadwal?tab=jadwal' ? 'bg-primary/10 text-primary font-black' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">library_add</span> Input Ploting Jadwal
          </Link>
        </div>
      )}

      {/* 🌤️ 2. DROP-UP MENU GURU & GENERUS */}
      <div className={`mx-4 mb-2 p-1.5 bg-white border border-outline-variant rounded-2xl shadow-xl flex flex-col gap-1 transition-all duration-300 ease-out-back ${
        activeDropUp === 'master' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'
      }`}>
        <Link to="/teachers?tab=guru" className={`py-3 px-4 rounded-xl flex items-center gap-3 font-bold text-xs ${(location.pathname + location.search) === '/teachers?tab=guru' ? 'bg-primary/10 text-primary font-black' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-sm">badge</span> Kelola Data Guru
        </Link>
        <Link to="/teachers?tab=santri" className={`py-3 px-4 rounded-xl flex items-center gap-3 font-bold text-xs ${(location.pathname + location.search) === '/teachers?tab=santri' ? 'bg-primary/10 text-primary font-black' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-sm">child_care</span> Kelola Data Generus
        </Link>
      </div>

      {/* BAR NAVIGASI UTAMA */}
      <nav className={`flex justify-around items-center px-2 py-2 pb-safe bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] border-t border-outline-variant rounded-t-2xl transition-all duration-300 ${isNavHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          // 💡 JIKA ITEM ADALAH JADWAL & USER BUKAN KURIKULUM, UBAH JADI LINK BIASA (TANPA PANEL DROP-UP)
          if (item.subKey === 'jadwal' && role !== 'kurikulum') {
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container font-black text-[10px]' : 'text-on-surface-variant font-semibold text-[9px]'}`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="truncate mt-0.5">{item.name}</span>
              </Link>
            );
          }

          // Item dengan pemicu sub-menu normal untuk kurikulum
          if (item.subKey) {
            const isSubOpened = activeDropUp === item.subKey;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveDropUp(isSubOpened ? null : item.subKey)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${isActive || isSubOpened ? 'bg-secondary-container text-on-secondary-container font-black text-[10px]' : 'text-on-surface-variant font-semibold text-[9px]'}`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="truncate mt-0.5">{item.name}</span>
              </button>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${isActive && !activeDropUp ? 'bg-secondary-container text-on-secondary-container font-black text-[10px]' : 'text-on-surface-variant font-semibold text-[9px]'}`}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="truncate mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}