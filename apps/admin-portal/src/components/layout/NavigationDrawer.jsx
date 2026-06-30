// src/components/layout/NavigationDrawer.jsx
import { Link, useLocation } from 'react-router-dom';

export default function NavigationDrawer({ isSidebarExpanded, toggleSidebar }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Jadwal', path: '/jadwal', icon: 'menu_book' },
    { name: 'Journals', path: '/Journals', icon: 'Assignment_Add' },
    { name: 'Students', path: '/students', icon: 'group' },
    { name: 'Teachers', path: '/teachers', icon: 'school' },
    { name: 'Profile', path: '/profile', icon: 'info' },
  ];

  return (
    <nav 
      className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-surface-container-low shadow-lg pt-20 pb-8 transition-all duration-300 border-r border-outline-variant/30 rounded-r-xl ${
        isSidebarExpanded ? 'w-72' : 'w-20'
      }`}
    >
      {/* Tombol Toggle Lebar/Kecil Sidebar */}
      <div className={`px-4 mb-6 flex ${isSidebarExpanded ? 'justify-end' : 'justify-center'}`}>
        <button 
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant cursor-pointer transition-colors"
          title={isSidebarExpanded ? "Sembunyikan Menu" : "Tampilkan Menu"}
        >
          <span className="material-symbols-outlined text-xl">
            {isSidebarExpanded ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 font-body-md">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`mx-3 py-3 flex items-center transition-all text-sm font-semibold cursor-pointer ${
                  isSidebarExpanded ? 'px-5 gap-3 rounded-full' : 'justify-center rounded-xl px-0'
                } ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
                title={!isSidebarExpanded ? item.name : undefined}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? 'filled-icon' : ''}`}>
                  {item.icon}
                </span>
                
                {/* Teks menu hanya muncul jika sidebar dilebarkan */}
                {isSidebarExpanded && (
                  <span className="truncate transition-opacity duration-200">
                    {item.name}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}