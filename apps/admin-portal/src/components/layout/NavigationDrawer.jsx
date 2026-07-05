// src/components/layout/NavigationDrawer.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ambil context auth pusat[cite: 2]

export default function NavigationDrawer({ isSidebarExpanded, toggleSidebar }) {
  const location = useLocation();
  const { role } = useAuth(); // Ambil role aktif user ("kurikulum" / "pengajar")

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { 
      name: 'Jadwal', 
      path: '/jadwal', 
      icon: 'menu_book',
      subMenu: [
        { name: 'Silabus', path: '/jadwal?tab=silabus', icon: 'developer_guide' },
        { name: 'Input Jadwal', path: '/jadwal?tab=jadwal', icon: 'library_add' }
      ]
    },
    { name: 'Journals', path: '/Journals', icon: 'Assignment_Add' },
    { 
      name: 'Guru & Generus', 
      path: '/teachers', 
      icon: 'groups',
      subMenu: [
        { name: 'Data Guru', path: '/teachers?tab=guru', icon: 'badge' },
        { name: 'Data Generus', path: '/teachers?tab=santri', icon: 'child_care' }
      ]
    },
    { name: 'Profile', path: '/profile', icon: 'info' },
  ];

  return (
    <nav 
      className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-55 bg-surface-container-low shadow-lg pt-4 pb-8 transition-all duration-300 border-r border-outline-variant/30 rounded-r-xl ${
        isSidebarExpanded ? 'w-72 overflow-y-auto scrollbar-none' : 'w-20 overflow-visible'
      }`}
    >
      
      {/* BRANDING HEADER: Teks PPG Malbar & Tombol Toggle */}
      <div className={`px-4 mb-6 flex items-center h-12 justify-between border-b border-outline-variant/20 pb-3 mt-1 ${
        isSidebarExpanded ? 'flex-row w-full' : 'flex-col-reverse gap-2 w-full justify-center'
      }`}>
        {isSidebarExpanded && (
          <div className="pl-2 animate-fadeIn select-none">
            <span className="text-base font-black text-primary tracking-tighter uppercase block">
              PPG Malbar
            </span>
            <span className="text-[9px] text-outline font-bold tracking-widest uppercase block -mt-0.5">
              Sistem Pusat
            </span>
          </div>
        )}
        <button 
          type="button" 
          onClick={toggleSidebar} 
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 cursor-pointer flex items-center justify-center outline-none"
        >
          <span className="material-symbols-outlined text-xl">
            {isSidebarExpanded ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 font-body-md">
        {menuItems.map((item) => {
          const isMainActive = location.pathname === item.path;
          
          // 💡 KOREKSI UTAMA: Pengunci role kurikulum HANYA berlaku untuk menu 'Jadwal'
          // Menu lain yang punya subMenu (seperti Guru & Generus) tetap dianggap valid untuk semua role
          const hasValidSubMenu = item.subMenu && (item.name !== 'Jadwal' || role === 'kurikulum');
          
          return (
            <li key={item.name} className="flex flex-col relative group">
              
              <Link
                to={hasValidSubMenu ? item.subMenu[0].path : item.path}
                className={`mx-3 py-3 flex items-center transition-all text-sm font-semibold cursor-pointer ${
                  isSidebarExpanded ? 'px-5 gap-3 rounded-full' : 'justify-center rounded-xl px-0'
                } ${
                  isMainActive 
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
                title={!isSidebarExpanded ? item.name : undefined}
              >
                <span className={`material-symbols-outlined text-xl ${isMainActive ? 'filled-icon' : ''}`}>
                  {item.icon}
                </span>
                
                {isSidebarExpanded && (
                  <span className="truncate flex-1">{item.name}</span>
                )}

                {hasValidSubMenu && isSidebarExpanded && (
                  <span className={`material-symbols-outlined text-sm transition-transform ${isMainActive ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                )}
              </Link>

              {/* 📑 SUB-MENU CONTROLLER DENGAN REKAP DOUBLE KONDISI */}
              {hasValidSubMenu && (
                isSidebarExpanded ? (
                  /* KONDISI 1: SIDEBAR LEBAR (Dropdown kebawah) */
                  isMainActive && (
                    <ul className="mx-6 mt-1 flex flex-col gap-1 pl-6 border-l border-outline-variant/60 animate-fadeIn">
                      {item.subMenu.map((sub) => {
                        const isSubActive = (location.pathname + location.search) === sub.path;
                        return (
                          <li key={sub.path}>
                            <Link to={sub.path} className={`py-2 px-4 flex items-center gap-2 text-xs rounded-xl font-bold transition-all ${isSubActive ? 'text-primary bg-primary/10 font-black' : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-variant/30'}`}>
                              <span className="material-symbols-outlined text-base">{sub.icon}</span>
                              <span>{sub.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : (
                  /* KONDISI 2: SIDEBAR MENGECIL (Dropright Melayang Kesamping) */
                  <ul className="absolute left-[72px] top-0 bg-white border border-outline-variant rounded-2xl shadow-xl p-1.5 min-w-[165px] opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 z-50 flex flex-col gap-0.5">
                    <span className="px-3 py-1 text-[9px] font-black text-outline uppercase tracking-wider border-b mb-1 block select-none">{item.name}</span>
                    {item.subMenu.map((sub) => {
                      const isSubActive = (location.pathname + location.search) === sub.path;
                      return (
                        <li key={sub.path}>
                          <Link to={sub.path} className={`py-2.5 px-3 flex items-center gap-2 text-xs rounded-xl font-bold transition-all ${isSubActive ? 'text-primary bg-primary/10 font-black' : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-variant/30'}`}>
                            <span className="material-symbols-outlined text-base">{sub.icon}</span>
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )
              )}

            </li>
          );
        })}
      </ul>
    </nav>
  );
}