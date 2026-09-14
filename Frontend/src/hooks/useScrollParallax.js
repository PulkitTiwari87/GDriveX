import { useLayoutEffect, useState } from 'react';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tracks page scroll position as a 0→1 progress value over a fixed pixel
 * range — the basis for the landing page's hero "convergence" effect.
 * Deliberately bound to `window.scrollY` rather than the target element's
 * viewport position: the hero visual already fits in the initial viewport
 * on most screens, so an element-relative "has it scrolled past" formula
 * would resolve to "fully converged" before the user scrolls at all. Tying
 * it to absolute scroll distance instead means progress reliably starts at
 * 0 on page load and completes within the first `triggerDistance` px of
 * scrolling, regardless of layout height.
 *
 * Only ever read to drive transform/opacity (never layout properties), and
 * short-circuits to a static 1 (fully "converged", no motion) when the user
 * prefers reduced motion.
 */
export const useScrollParallax = (triggerDistance = 500) => {
    const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);

    useLayoutEffect(() => {
        if (prefersReducedMotion()) return;

        let ticking = false;

        const update = () => {
            ticking = false;
            setProgress(Math.min(1, Math.max(0, window.scrollY / triggerDistance)));
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [triggerDistance]);

    return { progress };
};

export default useScrollParallax;
