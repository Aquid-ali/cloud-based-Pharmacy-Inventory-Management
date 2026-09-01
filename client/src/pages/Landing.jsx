import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import CategorySection from '../components/landing/CategorySection';
import FeatureSection from '../components/landing/FeatureSection';
import HealthcareTipsSection from '../components/landing/HealthcareTipsSection';
import AboutSection from '../components/landing/AboutSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import StatsSection from '../components/landing/StatsSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';

const Landing = () => {
  const { hash } = useLocation();

  // Supports footer/nav links like "/#categories" landing on this page and
  // scrolling straight to the section, whether arriving fresh or already here.
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <FeatureSection />
      <CategorySection />
      <HealthcareTipsSection />
      <AboutSection />
      <TestimonialsSection />
      <StatsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
