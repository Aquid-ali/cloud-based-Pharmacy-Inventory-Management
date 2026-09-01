import { useEffect, useRef } from 'react';

/**
 * Adds an `is-visible` class (paired with the `.reveal` CSS in index.css)
 * once the element scrolls into view. Falls back to always-visible when
 * IntersectionObserver isn't available.
 */
export default function useScrollReveal(options) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible');
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
