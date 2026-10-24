import { useEffect, type ReactNode } from 'react';

interface Props {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ titleId, onClose, children, maxWidth = 'max-w-md' }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-board-950/80 px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${maxWidth} border-t-4 border-amber-400 bg-board-800 p-6`}
      >
        {children}
      </div>
    </div>
  );
}
