import React from 'react';
import { FiLock, FiShield, FiSmartphone } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

const Security = () => {
  const handleSave = () => toast.success('Security settings updated');

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Configure authentication, session, and security policies." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={FiShield} label="Security Score" value="Strong" bgTint="bg-emerald-500/10" iconColor="text-emerald-600" borderColor="border-emerald-500/20" />
        <StatCard icon={FiLock} label="2FA Status" value="Enabled" bgTint="bg-[#346560]/10" iconColor="text-[#346560]" borderColor="border-[#346560]/20" />
        <StatCard icon={FiSmartphone} label="Active Sessions" value={2} bgTint="bg-blue-500/10" iconColor="text-blue-600" borderColor="border-blue-500/20" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <h3 className="font-serif font-bold text-slate-800">Security Settings</h3>

        <div className="space-y-4">
          {[
            { label: 'Two-Factor Authentication (2FA)', desc: 'Require OTP on login', defaultChecked: true },
            { label: 'Session Timeout', desc: 'Auto logout after 30 minutes of inactivity', defaultChecked: true },
            { label: 'Login Notifications', desc: 'Email alert on new device login', defaultChecked: false },
            { label: 'IP Whitelist', desc: 'Restrict access to known IP addresses', defaultChecked: false },
            { label: 'Password Expiry', desc: 'Force password change every 90 days', defaultChecked: true },
          ].map((setting) => (
            <label key={setting.label} className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <input type="checkbox" defaultChecked={setting.defaultChecked} className="w-4 h-4 mt-0.5 rounded accent-[#346560]" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{setting.label}</p>
                <p className="text-xs text-slate-500">{setting.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Minimum Password Length</label>
          <select defaultValue="8" className="w-full sm:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]">
            <option value="6">6 characters</option>
            <option value="8">8 characters</option>
            <option value="12">12 characters</option>
          </select>
        </div>

        <button onClick={handleSave} className="px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
          Save Security Settings
        </button>
      </div>
    </div>
  );
};

export default Security;
