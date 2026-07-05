// src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import NavigationDrawer from './NavigationDrawer';
import BottomNavBar from './BottomNavBar';

export default function DashboardLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  return (
    // 💡 PERBAIKAN: Menghapus p-6 dari container terluar agar full layar di HP
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased selection:bg-secondary/20">
      
      {/* 1. TopAppBar */}
      <TopAppBar isSidebarExpanded={isSidebarExpanded} />

      {/* Container Konten */}
      {/* 💡 PERBAIKAN: Mengubah max-w-container-max menjadi w-full agar layout mepet penuh */}
      <div className="flex flex-1 relative w-full">
        
        {/* 2. Sidebar */}
        <NavigationDrawer 
          isSidebarExpanded={isSidebarExpanded} 
          toggleSidebar={toggleSidebar} 
        />

        {/* 3. Area Konten Utama Tengah */}
        {/* 💡 PERBAIKAN: Mengatur padding agar pas di mobile (px-4) dan memberikan p-6 hanya di desktop (md:p-6) */}
        <main 
          className={`flex-1 w-full px-4 md:px-margin-desktop py-4 md:py-8 pb-24 md:pb-12 overflow-x-hidden transition-all duration-300 ${
            isSidebarExpanded ? 'md:ml-72' : 'md:ml-20'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* 4. Navigasi Bawah (Mobile Only) */}
      <BottomNavBar />

    </div>
  );
}