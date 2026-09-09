import React from "react"
import { EyeOff } from "lucide-react"
import type { KeyboardSkinVisual } from "@/types/cosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface KeyboardFrameProps {
  children: React.ReactNode
  layoutName?: string
  className?: string
  footer?: React.ReactNode
  skinVisual?: KeyboardSkinVisual
  effectIntensity?: "full" | "reduced" | "off"
  onToggleHide?: () => void
}

export function KeyboardFrame({
  children,
  layoutName = "PT-BR · ABNT2",
  className = "",
  footer,
  skinVisual,
  effectIntensity = "full",
  onToggleHide,
}: KeyboardFrameProps) {
  const { t } = useI18n()
  const frameBg = skinVisual?.frameBg ?? "bg-gradient-to-b from-neutral-900/95 via-neutral-950/90 to-black/95"
  const frameBorder = skinVisual?.frameBorder ?? "border-white/15"
  const accentColor = skinVisual?.accentColor ?? "#f97316"
  const effects = skinVisual?.effects
  const frameGlow = effects?.frameBorderGlow ?? effects?.glowColor

  const hasGlow = effectIntensity !== "off" && Boolean(frameGlow)
  const hasPulse =
    effectIntensity === "full" &&
    Boolean(effects?.pulseGlow || effects?.borderEffect === "pulse" || effects?.borderEffect === "neon")
  const hasShimmer =
    effectIntensity === "full" &&
    Boolean(
      effects?.particleGlow ||
        effects?.borderEffect === "fire" ||
        effects?.borderEffect === "lightning" ||
        effects?.borderEffect === "rgb-flow"
    )

  return (
    <div
      className={`relative p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border ${frameBorder} ${frameBg} transition-all duration-300 max-w-full overflow-x-auto touch-pan-x ${
        hasPulse ? "animate-pulse" : ""
      } ${className}`}
      style={{
        boxShadow: hasGlow
          ? `0 20px 50px rgba(0,0,0,0.8), 0 0 35px ${frameGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : "0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Shimmer background ambient if particleGlow is active */}
      {hasShimmer && (
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-3xl opacity-25 pointer-events-none blur-xl animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${accentColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Top chassis trim */}
      <div className="relative z-10 flex items-center justify-between px-2 mb-2 text-[10px] font-mono text-white/40 tracking-wider">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${effectIntensity !== "off" ? "animate-pulse" : ""}`}
            style={{
              backgroundColor: accentColor,
              boxShadow: effectIntensity !== "off" ? `0 0 8px ${accentColor}` : undefined,
            }}
          />
          <span className="font-bold text-white/60">{t("keyboard.chassis")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-bold">
            {layoutName}
          </span>
          {onToggleHide && (
            <button
              type="button"
              onClick={onToggleHide}
              title={t("keyboard.hideKeyboard")}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-white/40 hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              <EyeOff size={11} />
              <span className="hidden sm:inline">{t("keyboard.hide")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Keys container */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 min-w-fit">{children}</div>

      {/* Optional Frame footer */}
      {footer && <div className="relative z-10 mt-3 pt-2 border-t border-white/10">{footer}</div>}
    </div>
  )
}

