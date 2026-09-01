import React, { useEffect, useState } from 'react';

// Fades in, stays fully visible for exactly 1 second, then fades out and
// unmounts. The server has already durably recorded that this user has seen
// the medicine's current batch by the time this prop reaches the card (see
// resolveNewBatchFlags), so this component is purely the visual timer - it
// never needs to "mark itself seen" or persist anything itself.
const NewBatchBadge = () => {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    const toVisible = setTimeout(() => setPhase('visible'), 20);
    const toHiding = setTimeout(() => setPhase('hiding'), 1000);
    const toGone = setTimeout(() => setPhase('gone'), 1300);
    return () => {
      clearTimeout(toVisible);
      clearTimeout(toHiding);
      clearTimeout(toGone);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <span
      className={`absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#4ecdc4] text-[#1c3734] shadow-md transition-all duration-300 ${
        phase === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
    >
      New Batch Added
    </span>
  );
};

export default NewBatchBadge;
