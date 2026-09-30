"use client"

import { useState } from "react"
import { AcademyLesson } from "@/components/academy/AcademyLesson"
import { KeyMasteryAcademy } from "@/components/academy/KeyMasteryAcademy"

export default function AcademyPage() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  if (activeModuleId) {
    return <AcademyLesson moduleId={activeModuleId} onBack={() => setActiveModuleId(null)} onSelectModule={setActiveModuleId} />
  }
  return <KeyMasteryAcademy onOpenModule={setActiveModuleId} />
}
