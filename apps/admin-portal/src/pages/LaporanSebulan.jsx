// src/pages/pengajar-portal/MonthlyReportKBM.jsx
import { useState, useMemo, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function MonthlyReportKBM({ classesList = [] }) {
  const { tpqId } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('absensi');
  const [isLoading, setIsLoading] = useState(false);
  const [reportPayload, setReportPayload] = useState({ jurnalRows: [], absensiRows: [], silabusRows: [], santriRows: [] });

  useEffect(() => {
    if (classesList.length > 0 && !selectedClassId) {
      setSelectedClassId(classesList[0].id);
    }
  }, [classesList, selectedClassId]);

  const loadReportFromDatabase = async (targetClassId, targetMonth) => {
    const classObj = classesList.find(c => c.id === (targetClassId || selectedClassId));
    if (!classObj || !tpqId) return;

    setIsLoading(true);
    try {
      // 💡 PERBAIKAN: Kirim targetClassId dan nama_kelas sekaligus ke backend service
      const data = await reportService.getMonthlyReportData(
        targetMonth || selectedMonth,
        tpqId,
        classObj.id,
        classObj.nama_kelas
      );
      setReportPayload(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat rekap database Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) loadReportFromDatabase(selectedClassId, selectedMonth);
  }, [selectedClassId, selectedMonth, tpqId]);

  const computedReport = useMemo(() => {
    const { jurnalRows = [], absensiRows = [], silabusRows = [], santriRows = [] } = reportPayload;

    const summary = { totalKbm: jurnalRows.length, avgAttendance: 0, avgSyllabusProgress: 0, materiCount: 0 };
    const absensiMap = {};
    const silabusMap = {};

    let totalHadirPctSum = 0;
    let totalCapaianPctSum = 0;
    const uniqueMateriIds = new Set();

    // 💡 PERBAIKAN: Masukkan seluruh santri yang dikembalikan oleh database tanpa filter id tambahan
    santriRows.forEach(s => {
      absensiMap[s.id] = { nama: s.nama_lengkap, H: 0, I: 0, S: 0, A: 0, totalRow: 0 };
    });

    jurnalRows.forEach(row => {
      totalHadirPctSum += row.hadir_pct || 0;
      totalCapaianPctSum += row.capaian_pct || 0;
    });

    if (summary.totalKbm > 0) {
      summary.avgAttendance = Math.round(totalHadirPctSum / summary.totalKbm);
      summary.avgSyllabusProgress = Math.round(totalCapaianPctSum / summary.totalKbm);
    }

    absensiRows.forEach(abs => {
      const sId = abs.santri_id;
      if (!absensiMap[sId]) return;

      absensiMap[sId].totalRow++;
      if (abs.status === 'Hadir') absensiMap[sId].H++;
      if (abs.status === 'Izin') absensiMap[sId].I++;
      if (abs.status === 'Sakit') absensiMap[sId].S++;
      if (abs.status === 'Alfa') absensiMap[sId].A++;
    });

    silabusRows.forEach(sil => {
      if (!sil.materi_id) return;
      uniqueMateriIds.add(sil.materi_id);

      if (!silabusMap[sil.materi_id]) {
        silabusMap[sil.materi_id] = { materi: sil.nama_materi, kategori: sil.kategori, tipe: sil.tipe_pelacakan, records: [] };
      }
      silabusMap[sil.materi_id].records.push(sil);
    });

    summary.materiCount = uniqueMateriIds.size;

    const absensiSantri = Object.values(absensiMap).map(item => {
      const pct = item.totalRow > 0 ? Math.round((item.H / item.totalRow) * 100) : 0;
      return { ...item, pct };
    }).sort((a, b) => a.nama.localeCompare(b.nama));

    const silabusCapaian = Object.values(silabusMap).map(group => {
      const lastRec = group.records[group.records.length - 1];
      let barPct = lastRec.capaian_pct || 0;
      
      if (['halaman', 'ayat', 'hadist'].includes(group.tipe)) {
        const spanTarget = Math.max(1, (lastRec.capaian_akhir - lastRec.capaian_awal) + 1);
        barPct = Math.min(100, Math.round((spanTarget / spanTarget) * 100)); 
      }

      return {
        id: lastRec.materi_id,
        materi: group.materi,
        kategori: group.kategori,
        tipe: group.tipe,
        capaian: lastRec.tipe_pelacakan === 'persentase' ? lastRec.capaian_pct : barPct,
        awal_target: lastRec.capaian_awal,
        akhir_target: lastRec.capaian_akhir
      };
    });

    return { summary, absensiSantri, silabusCapaian };
  }, [reportPayload]);

  // ================= 💾 ENGINE DOWNLOAD REPORT EXPORT TO CSV =================
  const handleDownloadCSVReport = () => {
    if (reportPayload.jurnalRows.length === 0) {
      toast.error('Tidak ada data laporan KBM pada bulan ini untuk diunduh.');
      return;
    }

    const targetClassLabel = classesList.find(c => c.id === selectedClassId)?.nama_kelas || 'Kelas';
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeReportTab === 'absensi') {
      csvContent += `REKAPITULASI PRESENSI BULANAN TPQ\n`;
      csvContent += `Rombel Kelas: ${targetClassLabel}, Periode Bulan: ${selectedMonth}\n\n`;
      csvContent += `No,Nama Lengkap Santri,Hadir (H),Izin (I),Sakit (S),Alfa (A),Persentase Kelayakan (%)\n`;
      
      computedReport.absensiSantri.forEach((row, i) => {
        csvContent += `${i + 1},"${row.nama}",${row.H},${row.I},${row.S},${row.A},${row.pct}%\n`;
      });
    } else {
      csvContent += `REKAPITULASI CAPAIAN SILABUS BELAJAR\n`;
      csvContent += `Rombel Kelas: ${targetClassLabel}, Periode Bulan: ${selectedMonth}\n\n`;
      csvContent += `No,Nama Pokok Bahasan Silabus,Kategori Bidang,Metode Pelacak,Status Capaian Akhir\n`;
      
      computedReport.silabusCapaian.forEach((sil, i) => {
        const statusLabel = sil.tipe === 'persentase' 
          ? `${sil.capaian}% Selesai` 
          : `Tingkat ${sil.tipe} Posisi Akhir: ${sil.awal_target}-${sil.akhir_target}`;
        csvContent += `${i + 1},"${sil.materi}","${sil.kategori}",${sil.tipe},"${statusLabel}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `REPORT_KBM_${targetClassLabel.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Berhasil Diunduh!');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 select-none animate-fadeIn pb-16 text-xs font-semibold">
      
      {/* HEADER & PANEL FILTER CONTROLLER */}
      <div className="bg-white border border-outline-variant/60 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-primary tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">insert_chart</span>
            Rekapitulasi KBM Bulanan
          </h1>
          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Analisis performa presensi santri dan ketuntasan silabus kurikulum per bulan.</p>
        </div>

        {/* INPUT CONTROL PANEL */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 font-mono font-bold text-on-surface outline-none focus:border-primary h-10"
          />
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-outline-variant/60 rounded-xl px-3 py-2 font-bold text-on-surface outline-none focus:border-primary h-10 min-w-[140px]"
          >
            {classesList.map(c => <option key={c.id} value={c.id}>{c.nama_kelas}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-outline animate-pulse">Menghubungkan & mengalkulasi relasional database...</div>
      ) : (
        <>
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-xl">calendar_month</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Total Tatap Muka</span><span className="text-lg font-black text-on-surface font-mono">{computedReport.summary.totalKbm} <span className="text-xs font-sans font-bold text-outline">Kali</span></span></div>
            </div>
            <div className="bg-white border border-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-xl">how_to_reg</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Rata Presensi</span><span className="text-lg font-black text-green-700 font-mono">{computedReport.summary.avgAttendance}%</span></div>
            </div>
            <div className="bg-white border border-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-xl">menu_book</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Serapan Silabus</span><span className="text-lg font-black text-blue-700 font-mono">{computedReport.summary.avgSyllabusProgress}%</span></div>
            </div>
            <div className="bg-white border border-outline-variant/50 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-xl">import_contacts</span></div>
              <div><span className="text-[9px] uppercase font-black text-outline block">Materi Diajarkan</span><span className="text-lg font-black text-purple-700 font-mono">{computedReport.summary.materiCount} <span className="text-xs font-sans font-bold text-outline">Item</span></span></div>
            </div>
          </div>

          {/* SUB MENU: TABS SWITCH & CONTROL BUTTON EXPORT */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex bg-surface-container-high p-1 rounded-2xl max-w-xs border border-outline-variant/40 w-full sm:w-auto">
              <button type="button" onClick={() => setActiveReportTab('absensi')} className={`flex-1 sm:flex-initial py-2.5 px-5 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1 cursor-pointer ${activeReportTab === 'absensi' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-sm">checklist_rtl</span> Rekap Absen</button>
              <button type="button" onClick={() => setActiveReportTab('silabus')} className={`flex-1 sm:flex-initial py-2.5 px-5 text-center text-xs font-black rounded-xl flex items-center justify-center gap-1 cursor-pointer ${activeReportTab === 'silabus' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'}`}><span className="material-symbols-outlined text-sm">menu_book</span> Progres Silabus</button>
            </div>
            
            <button 
              type="button" 
              onClick={handleDownloadCSVReport}
              className="h-10 px-4 border-2 border-primary/20 hover:border-primary text-primary font-black bg-white rounded-xl shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-base">download_for_offline</span> 
              Unduh Berkas (.CSV)
            </button>
          </div>

          {/* RENDER KONTEN TAB UTAMA */}
          {activeReportTab === 'absensi' ? (
            <div className="bg-white border border-outline-variant/60 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 border-b bg-surface-container-low/40 flex justify-between items-center">
                <h3 className="text-sm font-black text-on-surface">Matriks Presensi Kumulatif</h3>
                <span className="text-[10px] bg-outline-variant/40 text-outline px-2 py-0.5 rounded-md font-mono">Total KBM Sebulan: {computedReport.summary.totalKbm}x</span>
              </div>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-container-low text-outline font-black text-[10px] uppercase tracking-wider border-b border-outline-variant/30">
                      <th className="p-4 w-12 text-center font-mono">No</th>
                      <th className="p-4">Nama Lengkap Santri</th>
                      <th className="p-4 text-center w-14 text-green-700">Hadir</th>
                      <th className="p-4 text-center w-14 text-blue-700">Izin</th>
                      <th className="p-4 text-center w-14 text-orange-600">Sakit</th>
                      <th className="p-4 text-center w-14 text-red-600">Alfa</th>
                      <th className="p-4 text-right w-24">Rasio (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-bold text-on-surface-variant">
                    {computedReport.absensiSantri.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-4 text-center font-mono text-outline">{idx + 1}.</td>
                        <td className="p-4 font-black text-on-surface text-sm">{row.nama || 'Santri Tanpa Nama'}</td>
                        <td className="p-4 text-center font-mono bg-green-50/20 text-green-700">{row.H}</td>
                        <td className="p-4 text-center font-mono bg-blue-50/20 text-blue-700">{row.I}</td>
                        <td className="p-4 text-center font-mono bg-orange-50/20 text-orange-600">{row.S}</td>
                        <td className="p-4 text-center font-mono bg-red-50/20 text-red-600">{row.A}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${row.pct >= 85 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{row.pct}%</span>
                        </td>
                      </tr>
                    ))}
                    {computedReport.absensiSantri.length === 0 && (
                      <tr><td colSpan="7" className="text-center py-12 text-outline italic">Tidak ditemukan manifes presensi santri bulan ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant/60 rounded-3xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-on-surface border-b border-outline-variant/20 pb-2">Log Ketuntasan Materi & Hafalan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computedReport.silabusCapaian.map((sil, sIdx) => (
                  <div key={sIdx} className="p-4 border border-outline-variant/40 rounded-2xl bg-surface-container-lowest flex flex-col justify-between space-y-3 shadow-3xs">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-on-surface text-sm leading-tight">• {sil.materi}</h4>
                        <span className="text-[9px] font-black tracking-wider text-outline uppercase bg-surface-container-high px-2 py-0.5 rounded shrink-0">{sil.kategori}</span>
                      </div>
                      {sil.tipe !== 'persentase' ? (
                        <div className="mt-2 text-[11px] text-outline font-medium space-y-0.5">
                          <p>🎯 Posisi Capaian Akhir Bulan: <span className="font-bold text-primary uppercase">{sil.tipe} {sil.awal_target} - {sil.akhir_target}</span></p>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-outline font-medium">Metode Pelacakan: <span className="font-bold text-on-surface">Ceklis Persentase (%) KBM</span></p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                        <span className="text-outline">Rasio Ketuntasan</span>
                        <span className="text-primary font-black">{sil.capaian}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${sil.capaian}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {computedReport.silabusCapaian.length === 0 && (
                  <p className="col-span-2 text-center py-12 text-outline italic">Tidak ditemukan riwayat serapan silabus kurikulum bulan ini.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}