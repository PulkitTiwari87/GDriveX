import { useEffect, useRef, useState } from 'react';

// Attaches to an element and flips `visible` to true the first time it
// scrolls into view. Pair with the `.reveal` / `.is-visible` CSS classes
// in index.css for a fade-up entrance animation.
export const useReveal = (options = {}) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, ...options }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
};

export default useReveal;
