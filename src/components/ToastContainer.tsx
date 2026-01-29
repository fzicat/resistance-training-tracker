'use client'

import { useToast } from '@/contexts/ToastContext'

export function ToastContainer() {
    const { toasts, dismissToast } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
            pointer-events-auto
            flex items-center justify-between gap-3
            px-4 py-3 rounded-lg shadow-lg
            animate-slide-down
            ${toast.type === 'success' ? 'bg-success text-background' : ''}
            ${toast.type === 'error' ? 'bg-destructive text-background' : ''}
            ${toast.type === 'info' ? 'bg-bg2 text-foreground' : ''}
          `}
                >
                    <span className="text-sm font-medium">{toast.message}</span>
                    <div className="flex items-center gap-2">
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className="text-sm font-semibold underline hover:no-underline"
                            >
                                {toast.action.label}
                            </button>
                        )}
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="p-1 rounded hover:bg-black/10"
                            aria-label="Dismiss"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
        </div>
    )
}
