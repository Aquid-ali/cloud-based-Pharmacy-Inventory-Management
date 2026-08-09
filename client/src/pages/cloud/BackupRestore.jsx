import React, { useState } from 'react';
import { FiCloud, FiDownload, FiUpload, FiClock, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

const BackupRestore = () => {
  const [backing, setBacking] = useState(false);

  const handleBackup = () => {
    setBacking(true);
    setTimeout(() => {
      setBacking(false);
      toast.success('Backup completed successfully');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Restore"
        description="Secure cloud backups and data restoration for your pharmacy."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={FiCloud} label="Last Backup" value="Today" subtext="2026-08-05 02:00 AM" bgTint="bg-[#346560]/10" iconColor="text-[#346560]" borderColor="border-[#346560]/20" />
        <StatCard icon={FiCheckCircle} label="Status" value="Healthy" bgTint="bg-emerald-500/10" iconColor="text-emerald-600" borderColor="border-emerald-500/20" />
        <StatCard icon={FiClock} label="Backup Size" value="24.5 MB" bgTint="bg-blue-500/10" iconColor="text-blue-600" borderColor="border-blue-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <div className="w-12 h-12 rounded-2xl bg-[#346560]/10 text-[#346560] flex items-center justify-center mb-4">
            <FiDownload size={24} />
          </div>
          <h3 className="font-serif font-bold text-slate-800 mb-2">Create Backup</h3>
          <p className="text-sm text-slate-500 mb-5">Export all pharmacy data including inventory, sales, and customer records.</p>
          <button
            onClick={handleBackup}
            disabled={backing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors disabled:opacity-60"
          >
            <FiCloud size={16} />
            {backing ? 'Backing up...' : 'Backup Now'}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
            <FiUpload size={24} />
          </div>
          <h3 className="font-serif font-bold text-slate-800 mb-2">Restore Data</h3>
          <p className="text-sm text-slate-500 mb-5">Restore from a previous backup. This will overwrite current data.</p>
          <button
            onClick={() => toast.error('Restore requires admin confirmation')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <FiUpload size={16} />
            Restore Backup
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="font-serif font-bold text-slate-800 mb-4">Recent Backups</h3>
        <div className="divide-y divide-slate-100">
          {[
            { date: '2026-08-05 02:00 AM', size: '24.5 MB', type: 'Automatic' },
            { date: '2026-08-04 02:00 AM', size: '24.3 MB', type: 'Automatic' },
            { date: '2026-08-03 14:30 PM', size: '24.1 MB', type: 'Manual' },
          ].map((backup, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-800">{backup.date}</p>
                <p className="text-xs text-slate-500">{backup.type} · {backup.size}</p>
              </div>
              <button className="text-[#346560] text-xs font-semibold hover:underline">Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
