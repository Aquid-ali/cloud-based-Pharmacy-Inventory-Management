import React from 'react';
import { FiHeart, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { loyaltyTiers, customersData } from '../../config/mockData';

const LoyaltyProgram = () => (
  <div className="space-y-6">
    <PageHeader
      title="Loyalty Program"
      description="Manage customer loyalty tiers, points, and reward discounts."
    />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard icon={FiHeart} label="Total Members" value={customersData.length} bgTint="bg-rose-500/10" iconColor="text-rose-600" borderColor="border-rose-500/20" />
      <StatCard icon={FiAward} label="Platinum" value={customersData.filter((c) => c.loyalty === 'Platinum').length} bgTint="bg-purple-500/10" iconColor="text-purple-600" borderColor="border-purple-500/20" />
      <StatCard icon={FiUsers} label="Gold" value={customersData.filter((c) => c.loyalty === 'Gold').length} bgTint="bg-yellow-500/10" iconColor="text-yellow-600" borderColor="border-yellow-500/20" />
      <StatCard icon={FiTrendingUp} label="Points Issued" value="12,450" bgTint="bg-[#346560]/10" iconColor="text-[#346560]" borderColor="border-[#346560]/20" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {loyaltyTiers.map((tier) => (
        <div key={tier.tier} className={`bg-white rounded-3xl border shadow-sm p-6 ${tier.color.split(' ').pop()}`}>
          <div className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold mb-4 ${tier.color}`}>
            {tier.tier}
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{tier.discount}</p>
          <p className="text-xs text-slate-500 mb-3">Discount on purchases</p>
          <div className="flex justify-between text-xs text-slate-600 pt-3 border-t border-slate-100">
            <span>Min. {tier.minPoints} pts</span>
            <span>{tier.members} members</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
      <h3 className="font-serif font-bold text-slate-800 mb-4">Program Settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Points per ₹100 spent</label>
          <input type="number" defaultValue={10} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Points expiry (months)</label>
          <input type="number" defaultValue={12} className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]" />
        </div>
      </div>
      <button className="mt-4 px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
        Save Settings
      </button>
    </div>
  </div>
);

export default LoyaltyProgram;
