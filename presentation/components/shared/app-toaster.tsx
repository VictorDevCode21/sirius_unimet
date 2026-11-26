'use client'

import { Toaster } from 'react-hot-toast'

// Toast container of the whole app, styled with the theme variables so it follows light and dark mode.
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{ top: 20 }}
      toastOptions={{
        duration: 5000,
        className: 'app-toast',
        error: { duration: 6000, iconTheme: { primary: '#d92d20', secondary: '#ffffff' } },
        success: { iconTheme: { primary: 'var(--brand-orange)', secondary: '#ffffff' } },
      }}
    />
  )
}
