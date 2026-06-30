// src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import NavigationDrawer from './NavigationDrawer';
import BottomNavBar from './BottomNavBar';

export default function DashboardLayout() {
  // State untuk mengontrol apakah sidebar dalam mode lebar (true) atau mini/ikon (false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased selection:bg-secondary/20">
      
      {/* 1. TopAppBar - Menerima state untuk mengatur margin-left secara dinamis */}
      <TopAppBar isSidebarExpanded={isSidebarExpanded} />

      {/* Container Konten */}
      <div className="flex flex-1 relative w-full max-w-container-max mx-auto">
        
        {/* 2. Sidebar - Menerima state dan fungsi toggle */}
        <NavigationDrawer 
          isSidebarExpanded={isSidebarExpanded} 
          toggleSidebar={toggleSidebar} 
        />

        {/* 3. Area Konten Utama Tengah - Margin kiri menyesuaikan lebar sidebar */}
        <main 
          className={`flex-1 w-full px-margin-mobile md:px-margin-desktop py-8 md:py-12 pb-24 md:pb-12 overflow-x-hidden transition-all duration-300 ${
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