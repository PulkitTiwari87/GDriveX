import { useEffect, useState } from 'react';

// Keeps a conditionally-rendered element mounted for `delay`ms after `active`
// goes false, so a CSS exit transition has time to play before it leaves the
// DOM (React unmounts immediately otherwise, which is why toasts/bars/menus
// driven by `{condition && <X/>}` normally can't animate out).
// Returns [shouldRender, isVisible] — render while `shouldRender`, and toggle
// enter/exit classes off `isVisible`.
export const useDelayedUnmount = (active, delay) => {
    const [shouldRender, setShouldRender] = useState(active);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (active) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setIsVisible(false);
        const timeout = setTimeout(() => setShouldRender(false), delay);
        return () => clearTimeout(timeout);
    }, [active, delay]);

    return [shouldRender, isVisible];
};

export default useDelayedUnmount;
