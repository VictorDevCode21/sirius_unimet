// Interface zoom levels shown in Settings, as percentages of the default scale.
export const UI_ZOOM_OPTIONS = [90, 100, 110, 125, 150] as const
export type UiZoom = (typeof UI_ZOOM_OPTIONS)[number]

export const DEFAULT_UI_ZOOM: UiZoom = 100
export const UI_ZOOM_STORAGE_KEY = 'ui-zoom'

export function isUiZoom(value: unknown): value is UiZoom {
  return UI_ZOOM_OPTIONS.includes(Number(value) as UiZoom)
}

// Sets the root CSS variable that scales the root font size and therefore every rem-based size.
export function applyUiZoom(zoom: UiZoom) {
  document.documentElement.style.setProperty('--ui-zoom', String(zoom / 100))
}

export function readStoredUiZoom(): UiZoom {
  try {
    const stored = localStorage.getItem(UI_ZOOM_STORAGE_KEY)
    return isUiZoom(stored) ? (Number(stored) as UiZoom) : DEFAULT_UI_ZOOM
  } catch {
    return DEFAULT_UI_ZOOM
  }
}

export function storeUiZoom(zoom: UiZoom) {
  try {
    localStorage.setItem(UI_ZOOM_STORAGE_KEY, String(zoom))
  } catch {}
}
