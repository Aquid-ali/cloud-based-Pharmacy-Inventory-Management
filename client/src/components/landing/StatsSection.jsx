import React, { useEffect, useState } from 'react';
import { FiPackage, FiGrid, FiUsers, FiHome } from 'react-icons/fi';
import { getPublicStats } from '../../services/publicService';
import { CATEGORIES, TRUST_STATEMENTS } from '../../data/landingContent';

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
    <section className="w-full px-4 sm:px-6 lg:px-10 py-12 bg-brandDark">
      {numericStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {numericStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-mintAccent flex items-center justify-center mx-auto mb-3">
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-white font-serif">{value}</p>
              <p className="text-xs text-white/60 mt-1">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {TRUST_STATEMENTS.map((statement) => (
            <span
              key={statement}
              className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10"
            >
              {statement}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default StatsSection;
