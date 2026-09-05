import React, { useEffect, useState } from 'react';
import { FiPackage, FiGrid, FiUsers, FiHome } from 'react-icons/fi';
import { getPublicStats } from '../../services/publicService';
import { CATEGORIES, TRUST_STATEMENTS } from '../../data/landingContent';
import { Reveal, StaggerGroup, StaggerItem } from './motion';

const StatsSection = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicStats()
      .then(({ data }) => {
        if (active) setStats(data.data);
      })
      .catch(() => {
        if (active) setStats({ available: false });
      });
    return () => {
      active = false;
    };
  }, []);

  // Numbers are only ever real counts from the database (see server/controllers/publicController.js).
  // If they aren't available yet, show non-numeric trust statements instead of guessing.
  const numericStats = stats?.available
    ? [
        { label: 'Medicines Available', value: stats.totalMedicines.toLocaleString(), icon: FiPackage },
        { label: 'Healthcare Categories', value: CATEGORIES.length, icon: FiGrid },
        { label: 'Partner Pharmacies', value: stats.totalPharmacies.toLocaleString(), icon: FiHome },
        { label: 'Registered Customers', value: stats.totalCustomers.toLocaleString(), icon: FiUsers },
      ]
    : null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-16 sm:py-20 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-10">
            Trusted by a growing healthcare network
          </p>
        </Reveal>

        {numericStats ? (
          <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {numericStats.map(({ label, value, icon: Icon }) => (
              <StaggerItem key={label} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-electricBlue/10 text-electricBlue flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} />
                </div>
                <p className="font-display text-3xl font-extrabold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <StaggerGroup className="flex flex-wrap items-center justify-center gap-3">
            {TRUST_STATEMENTS.map((statement) => (
              <StaggerItem key={statement}>
                <span className="px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                  {statement}
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
};

export default StatsSection;
