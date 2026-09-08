"use client"

import React from "react"

export interface KeyboardFrameProps {
  children: React.ReactNode
  layoutName?: string
  className?: string
  footer?: React.ReactNode
}

export function KeyboardFrame({
  children,
  layoutName = "PT-BR · ABNT2",
  className = "",
  footer,
}: KeyboardFrameProps) {
  return (
    <div
      className={`relative p-3 sm:p-4 rounded-3xl border border-white/15 bg-gradient-to-b from-neutral-900/95 via-neutral-950/90 to-black/95 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl max-w-full overflow-x-auto ${className}`}
    >
      {/* Top chassis trim */}
      <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-mono text-white/40 tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
          <span className="font-bold text-white/60">KEYFORGE CHASSIS</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-bold">
          {layoutName}
        </span>
      </div>

      {/* Keys container */}
      <div className="flex flex-col items-center gap-1.5 min-w-fit">{children}</div>

      {/* Optional Frame footer */}
      {footer && <div className="mt-3 pt-2 border-t border-white/10">{footer}</div>}
    </div>
  )
}
