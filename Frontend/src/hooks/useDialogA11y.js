import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Adds standard modal/dialog behavior to a ref'd container: locks page
// scroll, closes on Escape, traps Tab focus inside, focuses the first
// focusable element on open, and restores focus to the trigger on close.
// Attach the returned ref to the dialog's outer container element.
export const useDialogA11y = (isActive, onClose) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;
        const triggerEl = document.activeElement;
        document.body.style.overflow = 'hidden';

        const node = containerRef.current;
        node?.querySelector(FOCUSABLE)?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
                return;
            }
            if (e.key !== 'Tab' || !node) return;
            const items = node.querySelectorAll(FOCUSABLE);
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            triggerEl?.focus?.();
        };
    }, [isActive, onClose]);

    return containerRef;
};

export default useDialogA11y;
