import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import MedicineSearchSection from '../components/landing/MedicineSearchSection';
import PharmacyDiscoverySection from '../components/landing/PharmacyDiscoverySection';
import MapVisualSection from '../components/landing/MapVisualSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeatureSection from '../components/landing/FeatureSection';
import PharmacyOwnerSection from '../components/landing/PharmacyOwnerSection';
import StatsSection from '../components/landing/StatsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

const Landing = () => {
  const { hash } = useLocation();

  // Supports footer/nav links like "/#pharmacy-owners" landing on this page
  // and scrolling straight to the section, whether arriving fresh or already here.
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar />
      <HeroSection />
      <MedicineSearchSection />
      <PharmacyDiscoverySection />
      <MapVisualSection />
      <HowItWorksSection />
      <FeatureSection />
      <PharmacyOwnerSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
