import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDialogA11y } from '../hooks/useDialogA11y';

// Matches index.css's --dur-fast — keep in sync so the unmount timer and the
// CSS transition finish together.
const EXIT_MS = 200;

const Modal = ({ isOpen, onClose, title, children }) => {
    const titleId = useId();
    const containerRef = useDialogA11y(isOpen, onClose);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    // Freeze the last open content — once the parent clears its "pending"
    // state (e.g. `deletePending` -> null) `title`/`children` would otherwise
    // go stale/undefined mid-exit, flashing broken text while the dialog
    // animates out. Only refresh the snapshot while actually open.
    const contentRef = useRef({ title, children });
    if (isOpen) contentRef.current = { title, children };

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setIsVisible(false);
        const timeout = setTimeout(() => setShouldRender(false), EXIT_MS);
        return () => clearTimeout(timeout);
    }, [isOpen]);

    if (!shouldRender) return null;

    const { title: displayTitle, children: displayChildren } = contentRef.current;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-[var(--dur-fast)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] motion-reduce:scale-100 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 id={titleId} className="text-xl font-semibold text-gray-900 dark:text-gray-100">{displayTitle}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-[0.97]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {displayChildren}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
