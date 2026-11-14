const OPEN_LAYER =
  '[data-radix-popper-content-wrapper] [data-state="open"], [role="listbox"][data-state="open"], [role="menu"][data-state="open"]'

// On touch screens Radix reports the tap a little after the press, so a short grace time is kept.
const GRACE_MS = 400

let lastPressWithLayerOpen = 0

function isLayerOpen() {
  return document.querySelector(OPEN_LAYER) !== null
}

if (typeof document !== "undefined") {
  // Capture phase: runs before the dropdown has a chance to close itself.
  document.addEventListener(
    "pointerdown",
    () => {
      if (isLayerOpen()) lastPressWithLayerOpen = Date.now()
    },
    true
  )
}

/** True if a dropdown, date picker or menu is open, or was open a moment ago. */
export function floatingLayerWasOpen() {
  return isLayerOpen() || Date.now() - lastPressWithLayerOpen < GRACE_MS
}