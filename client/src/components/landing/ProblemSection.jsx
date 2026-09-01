import React from 'react';

const PROBLEMS = [
  'Calling around three different pharmacies just to find out if a medicine is even in stock.',
  "Composition, uses, and side effects buried in fine print — or not available at all.",
  'No easy way to compare price and availability across nearby pharmacies before you commit to one.',
];

const ProblemSection = () => (
  <section className="w-full px-4 sm:px-6 lg:px-10 py-14">
    <div className="max-w-3xl mx-auto">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-8">
        Finding the right medicine shouldn&apos;t feel like guesswork.
      </h2>
      <ul className="space-y-5">
        {PROBLEMS.map((text) => (
          <li key={text} className="border-l-2 border-tealPrimary/30 pl-5 py-0.5">
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ProblemSection;
