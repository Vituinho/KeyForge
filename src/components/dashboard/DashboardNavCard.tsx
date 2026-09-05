"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ReactNode } from "react"

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
  const inner = (
    <motion.div
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        item.active
          ? "border-white/20 bg-white/8 hover:bg-white/12 cursor-pointer"
          : "border-white/5 bg-white/3 opacity-50 cursor-not-allowed"
      }`}
      whileHover={item.active ? { scale: 1.02, y: -2 } : {}}
      whileTap={item.active ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: item.active ? 1 : 0.5, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      style={
        item.active
          ? { boxShadow: `0 0 20px ${item.color}22` }
          : undefined
      }
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
        <p className="text-xs text-white/30">{item.description}</p>
      </div>
      {!item.active && (
        <span className="ml-auto text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
          Soon
        </span>
      )}
    </motion.div>
  )

  if (item.active) {
    return <Link href={item.href}>{inner}</Link>
  }
  return inner
}
