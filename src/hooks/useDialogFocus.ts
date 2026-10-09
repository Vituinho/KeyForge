"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

let openDialogs = 0
let previousOverflow = ""
export function useDialogFocus(open: boolean, onClose: () => void, dismissible = true) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const options = useRef({ onClose, dismissible })
  useLayoutEffect(() => { options.current = { onClose, dismissible } }, [onClose, dismissible])
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const dialog = dialogRef.current, previous = document.activeElement as HTMLElement | null
    if (openDialogs++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden" }
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select, textarea, [tabindex="0"]'))
      .filter(element => !element.closest("[hidden], [aria-hidden=true]"))
    ;(controls()[0] ?? dialog).focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && options.current.dismissible) {
        event.preventDefault(); event.stopPropagation(); options.current.onClose()
      }
      if (event.key !== "Tab") return
      const nodes = controls(), first = nodes[0] ?? dialog, last = nodes[nodes.length - 1] ?? dialog
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    dialog.addEventListener("keydown", keydown)
    return () => {
      dialog.removeEventListener("keydown", keydown)
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])
  return dialogRef
}
