"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface DashboardNavItem {
  href: string
  icon: ReactNode
  label: string
  description: string
  active: boolean
  color: string
}

interface DashboardNavCardProps {
  item: DashboardNavItem
  index: number
}

export function DashboardNavCard({ item, index }: DashboardNavCardProps) {
  const { t } = useI18n()
  const inner = (
    <motion.div
      className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
        item.active
          ? "border-white/10 bg-[#14161b] hover:bg-[#1b1d24] hover:border-white/25 cursor-pointer"
          : "border-white/5 bg-white/3 opacity-50 cursor-not-allowed"
      }`}
      whileHover={item.active ? { y: -2 } : {}}
      whileTap={item.active ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: item.active ? 1 : 0.5, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}

    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${item.color}22`,
          color: item.color,
        }}
      >
        {item.icon}
      </div>
      <div>
        <p className="font-bold text-white text-sm">{item.label}</p>
        <p className="text-xs text-white/55">{item.description}</p>
      </div>
      {!item.active && (
        <span className="ml-auto text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
          {t("common.soon").toUpperCase()}
        </span>
      )}
    </motion.div>
  )

  if (item.active) {
    return <Link href={item.href}>{inner}</Link>
  }
  return inner
}
