// src/components/layout/BottomNavBar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function BottomNavBar() {
  const location = useLocation();
  const [isNavHidden, setIsNavHidden] = useState(false);

  // LOGIKA BARU: Dengarkan sinyal trigger dari modal kurikulum
  useEffect(() => {
    const handleToggleNav = (e) => {
      setIsNavHidden(e.detail); // e.detail bernilai true (sembunyi) atau false (muncul)
    };

    window.addEventListener('hide-bottom-nav', handleToggleNav);
    return () => {
      window.removeEventListener('hide-bottom-nav', handleToggleNav);
    };
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Jadwal', path: '/jadwal', icon: 'menu_book' },
    { name: 'Journals', path: '/Journals', icon: 'Assignment_Add' },
    { name: 'Student', path: '/students', icon: 'person_search' },
    { name: 'Teacher', path: '/teachers', icon: 'workspace_premium' },
    { name: 'Profile', path: '/profile', icon: 'info' },
  ];

  return (
    <nav 
      className={`md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] border-t border-outline-variant rounded-t-2xl transition-all duration-300 transform ${
        isNavHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all active:scale-95 ${
              isActive 
                ? 'bg-primary-container text-on-primary-container font-bold' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}