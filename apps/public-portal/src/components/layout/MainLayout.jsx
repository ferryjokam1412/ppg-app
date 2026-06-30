import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col selection:bg-primary-container/30 overflow-x-hidden">
      <TopAppBar />
      <main className="flex-grow flex flex-col">
        {/* Konten halaman yang dinamis akan dirender di sini */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}