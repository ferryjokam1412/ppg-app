// src/components/layout/TopAppBar.jsx
import { Link, useLocation } from 'react-router-dom';

export default function TopAppBar() {
  // Gunakan useLocation untuk mendeteksi rute aktif
  const location = useLocation();

  return (
    <header className="bg-white w-full border-b border-outline-variant shadow-sm sticky top-0 z-50">
  <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-20 transition-all duration-200">
    <div className="flex items-center gap-4">
      <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
        <img 
          alt="PPG Portal Logo" 
          className="h-12 w-auto object-contain" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB4ZmKw673_CbQssbtymOHtV6jpd7zUCzL5x7Gyt2Fe3Rucwjb-D_FUYLO3DHBHdLpbWr76jFrRZOEEEHO_XtrI--uoJMrg9yV2L9JzMCy7zo9chaSV_4ca4XkjnQkigZAktQ-qXuSURCIl0iRR4JBrW7VeHohZpijLcpRpRycUoIiAeKgKD7L7Ajl8raDzNh8EZOWahjh7_z3XY6yK7mCdf7-A5wMWXxorP4GApCYRi8gJEYbaTOayhX6TtPV6qVO81ghGZnM37g"
        />
        <span className="font-headline-md text-2xl font-bold text-primary hidden md:block">PPG Portal</span>
      </Link>
    </div>
    
    <button className="font-label-md text-sm bg-primary text-on-primary px-6 py-2 rounded-full hover:bg-primary-container transition-colors shadow-sm cursor-pointer">
      Login
    </button>
  </div>
</header>
  );
}