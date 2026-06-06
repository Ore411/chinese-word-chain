'use client';

import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmClassName,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when modal opens (safer default)
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      {/* Panel — stop click propagation so tapping inside doesn't close */}
      <div
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{message}</p>

        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={onConfirm}
            className={
              confirmClassName ??
              'w-full py-3 rounded-xl font-semibold text-white transition-colors bg-red-600 hover:bg-red-500'
            }
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="w-full py-3 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
