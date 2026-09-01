import React from 'react';
import { FiCheck } from 'react-icons/fi';

const POINTS = [
  'A searchable catalog spanning thousands of medicines, with real composition, uses, and safety information',
  'Live stock and pricing from real pharmacies, not a static product list',
  'One account, secured with encrypted authentication, for browsing, ordering, and tracking orders',
];

const AboutSection = () => (
  <section id="about" className="w-full px-4 sm:px-6 lg:px-10 py-14 bg-white scroll-mt-20">
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-4">About MedStock</h2>
        <p className="text-sm text-ink-soft leading-relaxed mb-3">
          MedStock connects an organized medicine catalog with real pharmacy inventory, so you can look up a
          medicine, understand what it's for, and see who actually has it in stock — instead of guessing or
          calling around.
        </p>
        <p className="text-sm text-ink-soft leading-relaxed">
          It was built around two ideas: medicine information should be easy to find and understand, and buying
          medicine shouldn't require more effort than it needs to. Whether you're comparing pharmacies or just
          looking up what a medicine is used for, MedStock keeps that in one convenient place.
        </p>
      </div>

      <div className="bg-primary-50 rounded-3xl p-6 sm:p-8 space-y-4">
        {POINTS.map((point) => (
          <div key={point} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-tealPrimary text-white flex items-center justify-center shrink-0 mt-0.5">
              <FiCheck size={13} />
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
