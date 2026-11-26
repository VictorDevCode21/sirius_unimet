'use client'

import { Toaster } from 'react-hot-toast'

// Toast container of the whole app, styled with the theme variables so it follows light and dark mode. Error toasts
// are alerts, so screen readers announce them right away; the rest are polite status messages.
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{ top: 20 }}
      toastOptions={{
        duration: 5000,
        className: 'app-toast',
        error: { duration: 6000, iconTheme: { primary: '#d92d20', secondary: '#ffffff' }, ariaProps: { role: 'alert', 'aria-live': 'assertive' } },
        success: { iconTheme: { primary: 'var(--brand-orange)', secondary: '#ffffff' } },
      }}
    />
  )
}
