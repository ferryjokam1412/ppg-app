// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kegiatanService } from '../services/kegiatanService';

// Sub-komponen InfoCard Global
const InfoCard = ({ icon, color = 'primary', title, description, linkText, linkHref }) => {
  const iconColors = {
    primary: 'bg-primary-container/20 text-primary',
    secondary: 'bg-secondary-container/30 text-secondary'
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-[0_4px_20px_rgba(43,76,155,0.05)] hover:shadow-lg transition-shadow duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColors[color]}`}>
        <span className={`material-symbols-outlined filled-icon ${color === 'primary' ? 'filled-icon' : ''}`}>
          {icon}
        </span>
      </div>
      <h3 className="font-headline-md text-on-primary-fixed mb-2 text-xl font-bold leading-snug">
        {title}
      </h3>
      <p className="font-body-md text-sm text-on-surface-variant mb-4 leading-relaxed">
        {description}
      </p>
      <a className="text-primary font-label-md text-sm font-bold hover:underline" href={linkHref}>
        {linkText}
      </a>
    </div>
  );
};

export default function HomePage() {
  const [kegiatanTerbaru, setKegiatanTerbaru] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil data kegiatan terupdate dari Supabase saat web diakses
  useEffect(() => {
    const loadHeadlineKegiatan = async () => {
      try {
        const data = await kegiatanService.getLatestKegiatan();
        if (data) {
          setKegiatanTerbaru(data);
        }
      } catch (err) {
        console.error('Gagal memuat berita kegiatan:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadHeadlineKegiatan();
  }, []);

  // Format tanggal terlaksana agar lebih rapi dibaca manusia (Contoh: 27 Juni 2026)
  const formatTanggal = (stringTanggal) => {
    if (!stringTanggal) return '';
    const opsi = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
  };

  return (
    <>
      {/* 1. Hero Section */}
      <section className="py-16 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col items-center text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full text-primary border border-outline-variant/30">
            <span className="material-symbols-outlined filled-icon text-sm">school</span>
            <span className="font-label-md text-xs font-semibold">Penggerak Pembina Generus</span>
          </div>
          
          <h1 className="font-headline-lg-mobile text-3xl md:font-headline-xl md:text-5xl text-on-primary-fixed leading-tight font-bold tracking-tight">
            Be the Teacher of the World
          </h1>
          
          <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Mencetak generasi pendidik spiritual yang unggul, profesional, dan berdedikasi tinggi untuk kemajuan umat. Bergabunglah bersama kami dalam perjalanan mulia ini.
          </p>
          
          <div className="pt-4">
            <Link 
              to="/daftar" 
              className="inline-block bg-primary text-on-primary px-8 py-4 rounded-xl font-label-md font-bold hover:bg-primary-container transition-all shadow-[0_4px_20px_rgba(43,76,155,0.2)] hover:shadow-[0_4px_25px_rgba(43,76,155,0.3)] transform hover:-translate-y-1 cursor-pointer">
              Daftar Jadi Santri
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <section className="bg-surface-container-low py-16 md:py-24 px-margin-mobile md:px-margin-desktop flex-grow">
        <div className="max-w-container-max mx-auto space-y-gutter">
          
          {/* Featured Card - KONEKSI SUPABASE DENGAN STATE LIVE */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-[0_4px_20px_rgba(43,76,155,0.05)] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            {isLoading ? (
              // Tampilan Shimmer Loading Status Efek saat kueri database berjalan
              <div className="animate-pulse space-y-4 py-4">
                <div className="h-4 bg-surface-variant rounded w-1/4"></div>
                <div className="h-8 bg-surface-variant rounded w-3/4"></div>
                <div className="h-4 bg-surface-variant rounded w-full"></div>
                <div className="h-4 bg-surface-variant rounded w-5/6"></div>
              </div>
            ) : (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                      KEGIATAN TERBARU
                    </span>
                    {kegiatanTerbaru?.tpq?.nama && (
                      <span className="text-outline text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">holiday_village</span>
                        {kegiatanTerbaru.tpq.nama}
                      </span>
                    )}
                  </div>

                  <h2 className="font-headline-md text-2xl text-on-primary-fixed leading-snug font-bold">
                    {kegiatanTerbaru ? kegiatanTerbaru.nama_kegiatan : 'Penerimaan Santri Baru Gelombang 2 Tahun 2026'}
                  </h2>
                  
                  {kegiatanTerbaru && (
                    <p className="text-primary font-bold text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      {formatTanggal(kegiatanTerbaru.tanggal_terlaksana)} 
                      <span className="text-outline-variant">•</span>
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {kegiatanTerbaru.lokasi}
                    </p>
                  )}

                  <p className="font-body-md text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                    {kegiatanTerbaru ? kegiatanTerbaru.deskripsi : 'TPQ PPG membuka kembali kesempatan bagi putra-putri terbaik untuk bergabung dalam program pendidikan intensif kurikulum generasi unggul kelas mandiri.'}
                  </p>
                  
                  <button className="text-primary font-label-md text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all pt-2 cursor-pointer">
                    Baca Selengkapnya <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {/* Banner Dokumentasi Berita */}
                <div className="h-48 md:h-full min-h-[220px] rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                  {kegiatanTerbaru?.banner_url || !kegiatanTerbaru ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105" 
                      style={{ 
                        backgroundImage: `url('${kegiatanTerbaru ? kegiatanTerbaru.banner_url : 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ww7KnOWC1nACtS0rAJfu3AJKoxxykqU6D--gkgcebnyyMLGeKXjY8wP9VHl532Q7B36Cx6ju1XEKYolIH6PuhJq3zIrL4eIZiizD5qP4sXshEOJUO0jM4wnOSNbkhKVdhD781Y48C-vjvimxa_e7T_fI9TqFz7csnCae3r4KvowVB9WbhiUMAQKIndyODmhYG-udBZ6a8RscCwo_DfwJt-N-O5KsA0nXaYXQIb6J-oZfN7iMaK-wjetCUfkE6j8Kv5e29Jn71fM'}' )` 
                      }}
                    ></div>
                  ) : (
                    // Tampilan default jika user menyalin berita tanpa mengunggah foto banner dokumentasi
                    <div className="text-center p-6 select-none">
                      <span className="material-symbols-outlined text-primary/30 text-5xl mb-2">landscape</span>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Dokumentasi Kegiatan</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Grid Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
            <InfoCard 
              icon="location_on"
              color="primary"
              title="Lokasi TPQ"
              description="Temukan lokasi TPQ terdekat di wilayah Anda untuk memudahkan proses pembelajaran."
              linkText="Lihat Peta"
              linkHref="#map"
            />
            <InfoCard 
              icon="school"
              color="secondary"
              title="Kurikulum"
              description="Standar kurikulum terpadu yang menggabungkan pendidikan agama dan karakter modern."
              linkText="Unduh Silabus"
              linkHref="#syllabus"
            />
          </div>

        </div>
      </section>
    </>
  );
}