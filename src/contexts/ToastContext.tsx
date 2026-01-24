'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastContextType {
    toasts: Toast[]
    showToast: (message: string, type?: Toast['type'], action?: Toast['action']) => void
    dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((
        message: string,
        type: Toast['type'] = 'info',
        action?: Toast['action']
    ) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const toast: Toast = { id, message, type, action }

        setToasts(prev => [...prev, toast])

        // Auto-dismiss after 4 seconds (unless it has an action)
        if (!action) {
            setTimeout(() => {
                dismissToast(id)
            }, 4000)
        }
    }, [dismissToast])

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
