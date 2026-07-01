// src/pages/LoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient'; 
// Impor toast dan kontainer Toaster
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const watermarkRef = useRef(null);

  // 1. State Manajemen Form & UI
  const [formData, setFormData] = useState({ username: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState('idle'); // idle, loading, success

  const PUBLIC_PORTAL_URL = import.meta.env.VITE_PUBLIC_PORTAL_URL || 'http://localhost:5173';

  // Handle Perubahan Input Form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 2. Efek Parallaks Tikus untuk Watermark Background
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (watermarkRef.current) {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        watermarkRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3. Fungsi Submit Terhubung ke Supabase Auth + Toast
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus('loading');
    
    // Menampilkan toast loading awal
    const toastId = toast.loading('Sedang memverifikasi akun...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.username,
        password: formData.password,
      });

      if (error) {
        setLoginStatus('idle');
        // Jika password salah atau server eror 500, tampilkan pesan eror via Toast
        toast.error(error.message || 'Gagal masuk. Periksa kembali email & password.', { id: toastId });
        return;
      }

      if (data?.user) {
        setLoginStatus('success');
        toast.success('Selamat Datang! Login Berhasil.', { id: toastId });
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setLoginStatus('idle');
      toast.error('Terjadi kesalahan jaringan sistem.', { id: toastId });
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed relative overflow-hidden">
      
      {/* Komponen Wadah Toast penyedia animasi notifikasi */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Background Decoration Pattern */}
      <div className="fixed inset-0 z-0 bg-pattern opacity-40"></div>
      <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

      {/* Asymmetric Academic Watermark Background */}
      <div 
        ref={watermarkRef}
        className="fixed top-0 left-0 w-full h-full academic-watermark flex items-center justify-center transition-transform duration-75 ease-out"
      >
        <span className="material-symbols-outlined text-[600px] rotate-12 opacity-5 select-none pointer-events-none">school</span>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-margin-mobile relative z-10">
        <div className="w-full max-w-md">
          
          {/* Brand & Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-xl">
              <img 
              alt="PPG Portal Logo" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB4ZmKw673_CbQssbtymOHtV6jpd7zUCzL5x7Gyt2Fe3Rucwjb-D_FUYLO3DHBHdLpbWr76jFrRZOEEEHO_XtrI--uoJMrg9yV2L9JzMCy7zo9chaSV_4ca4XkjnQkigZAktQ-qXuSURCIl0iRR4JBrW7VeHohZpijLcpRpRycUoIiAeKgKD7L7Ajl8raDzNh8EZOWahjh7_z3XY6yK7mCdf7-A5wMWXxorP4GApCYRi8gJEYbaTOayhX6TtPV6qVO81ghGZnM37g"
            />
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2 font-bold text-3xl">
              Selamat Datang Kembali
            </h1>
            <p className="text-on-surface-variant font-body-md text-sm">
              Silakan masuk ke akun Anda untuk melanjutkan.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 soft-glow-card shadow-md">
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              
              {/* Email/Username Field */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant px-1 font-semibold" htmlFor="username">
                  Email Akun Pengajar
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-md text-on-surface text-sm" 
                    id="username" 
                    name="username" 
                    type="email"
                    placeholder="nama@email.com" 
                    required 
                    disabled={loginStatus === 'loading' || loginStatus === 'success'}
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1 text-sm">
                  <label className="block font-label-md text-on-surface-variant font-semibold" htmlFor="password">
                    Password
                  </label>
                  <a className="font-label-md text-primary hover:text-primary-container transition-colors font-semibold" href="#forgot">
                    Lupa Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3.5 pl-11 pr-12 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body-md text-on-surface text-sm" 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    required 
                    disabled={loginStatus === 'loading' || loginStatus === 'success'}
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button 
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-3 px-1">
                <input 
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                  id="remember" 
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                />
                <label className="font-label-md text-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">
                  Ingat saya di perangkat ini
                </label>
              </div>

              {/* Primary Action Button */}
              <button 
                className={`w-full font-label-md py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-bold border ${loginStatus === 'success' ? 'bg-green-600 text-white border-green-700' : 'bg-primary text-white hover:shadow-xl hover:bg-primary-container active:scale-[0.98] border-primary/20'}`}
                type="submit"
                disabled={loginStatus === 'loading' || loginStatus === 'success'}
              >
                {loginStatus === 'idle' && (
                  <>
                    Masuk
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
                {loginStatus === 'loading' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                )}
                {loginStatus === 'success' && (
                  <>
                    <span className="material-symbols-outlined text-[18px] filled-icon">check_circle</span>
                    Berhasil
                  </>
                )}
              </button>
            </form>

            {/* Divider Statement */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-surface-container-lowest text-outline italic">Be the Teacher of the World</span>
              </div>
            </div>

            {/* Link Navigasi Lintas Aplikasi Monorepo */}
            <a 
              href={PUBLIC_PORTAL_URL} 
              className="text-on-surface-variant hover:text-primary justify-center transition-colors font-label-md text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-variant/50 font-semibold"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Kembali ke Beranda Publik
            </a>
          </div>

          {/* Language/Support Footer */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 text-on-surface-variant font-label-md text-xs opacity-70">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span>Bahasa Indonesia</span>
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <a className="hover:text-primary transition-colors font-semibold" href="#help">Pusat Bantuan</a>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <a className="hover:text-primary transition-colors font-semibold" href="#terms">Syarat & Ketentuan</a>
          </div>

        </div>
      </main>
    </div>
  );
}