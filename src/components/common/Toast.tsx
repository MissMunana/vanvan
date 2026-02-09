import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastItem {
  id: number
  message: string
  action?: { label: string; onClick: () => void }
}

interface ToastContextType {
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, action }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        width: '90%',
        maxWidth: 400,
      }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{
                background: 'rgba(51,51,51,0.92)',
                color: 'white',
                padding: '12px 18px',
                borderRadius: 12,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                pointerEvents: 'auto',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>{toast.message}</span>
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  style={{
                    color: '#FFB800',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
