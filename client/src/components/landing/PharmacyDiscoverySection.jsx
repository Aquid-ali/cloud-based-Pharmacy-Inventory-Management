import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiArrowRight, FiMessageCircle, FiCheckCircle } from 'react-icons/fi';
import { TbBuildingHospital } from 'react-icons/tb';
import { Reveal, StaggerGroup, StaggerItem } from './motion';
import { SkeletonBlock } from '../Skeleton';
import { getPublicPharmacies } from '../../services/publicService';
import { startConversation } from '../../services/conversationService';
import useAuth from '../../hooks/useAuth';

/**
 * Real, active pharmacies pulled from the database (see
 * server/controllers/publicController.getPublicPharmacies) - never
 * placeholder/fabricated entries. If there are none yet, says so honestly
 * instead of inventing example pharmacies.
 */
const PharmacyDiscoverySection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, pharmacies: [] });
  const [messagingId, setMessagingId] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicPharmacies()
      .then(({ data }) => {
        if (active) setState({ loading: false, pharmacies: data.data || [] });
      })
      .catch(() => {
        if (active) setState({ loading: false, pharmacies: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleMessage = async (pharmacyId) => {
    setMessagingId(pharmacyId);
    try {
      await startConversation(pharmacyId, { navigate, user, currentPath: '/' });
    } catch {
      toast.error("Couldn't start a conversation. Please try again.");
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Reveal>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-lavender/10 text-lavender text-xs font-semibold">
                Pharmacy Network
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
                Real pharmacies, ready to help
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <button
              onClick={() => navigate('/shop/stores')}
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-electricBlue hover:text-lavender transition-colors"
            >
              View all pharmacies <FiArrowRight size={15} />
            </button>
          </Reveal>
        </div>

        {state.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-100 p-6 space-y-3">
                <SkeletonBlock className="h-10 w-10 rounded-xl" />
                <SkeletonBlock className="h-4 w-2/3" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-9 w-full mt-2" />
              </div>
            ))}
          </div>
        ) : state.pharmacies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
            <TbBuildingHospital className="mx-auto text-slate-300" size={36} />
            <p className="text-sm text-slate-500 mt-3">
              No pharmacies have joined the network yet — be the first to register yours.
            </p>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.pharmacies.map((pharmacy) => (
              <StaggerItem key={pharmacy._id}>
                <div className="h-full flex flex-col rounded-3xl border border-slate-100 hover:border-electricBlue/30 hover:shadow-xl hover:shadow-slate-200/60 transition-all p-6 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electricBlue/10 to-lavender/10 text-electricBlue flex items-center justify-center shrink-0">
                      <TbBuildingHospital size={20} />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <FiCheckCircle size={11} /> Active
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-900 mt-4">{pharmacy.name}</h3>
                  <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-2 leading-relaxed flex-1">
                    <FiMapPin size={13} className="mt-0.5 shrink-0" />
                    <span>
                      {pharmacy.city}, {pharmacy.state} {pharmacy.pincode}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 mt-5">
                    <button
                      onClick={() => navigate('/shop/stores')}
                      className="flex-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl py-2.5 transition-colors"
                    >
                      Get Directions
                    </button>
                    <button
                      onClick={() => handleMessage(pharmacy._id)}
                      disabled={messagingId === pharmacy._id}
                      className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:border-electricBlue/40 hover:text-electricBlue transition-colors disabled:opacity-50"
                      title="Message this pharmacy"
                    >
                      <FiMessageCircle size={15} />
                    </button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}

        <div className="sm:hidden mt-8 text-center">
          <button
            onClick={() => navigate('/shop/stores')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-electricBlue"
          >
            View all pharmacies <FiArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PharmacyDiscoverySection;
