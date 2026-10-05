import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  error: TriangleAlert,
  info: Info,
}

export default function Toast({ toasts = [], onClose }) {
  if (!toasts.length) return null

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || CheckCircle2

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              <Icon size={18} />
            </div>
            <p>{toast.message}</p>
            <button type="button" aria-label="Dismiss toast" onClick={() => onClose(toast.id)}>
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
