import toast from 'react-hot-toast'

type ToastType = 'success' | 'error' | 'info' | 'default'

interface HRCToastProps {
  type?: ToastType
  title: string
  description?: string
}

const accentColors = {
  success: '#3ECF8E',
  error: '#FF6B35',
  info: '#F5C518',
  default: '#ADB1B8',
}

export const hrToast = {
  show: (props: HRCToastProps) => {
    const { type = 'default', title, description } = props
    const accent = accentColors[type]

    return toast(
      () => (
        <div className="flex items-start gap-3">
          <div
            className="w-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent, minHeight: '40px' }}
          />
          <div className="flex-1">
            <div className="text-text-hi font-body font-medium">{title}</div>
            {description && (
              <div className="text-text-mid text-sm mt-1 font-body">{description}</div>
            )}
            <div className="text-text-low font-mono text-xs mt-2">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ),
      {
        style: {
          background: '#14171D',
          border: '1px solid #262B33',
          minWidth: '280px',
        }
      }
    )
  },

  success: (title: string, description?: string) => hrToast.show({ type: 'success', title, description }),
  error: (title: string, description?: string) => hrToast.show({ type: 'error', title, description }),
  info: (title: string, description?: string) => hrToast.show({ type: 'info', title, description }),
}