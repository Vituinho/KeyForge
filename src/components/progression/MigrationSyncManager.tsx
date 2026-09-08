"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/authContext"
import { loadPlayerProfile } from "@/lib/storage/playerStorage"
import { fetchCloudPlayerProfile } from "@/lib/storage/cloudPlayerStorage"
import {
  hasMeaningfulProgress,
  hasSaveConflict,
  autoMigrateLocalToCloud,
  resolveKeepCloud,
  resolveOverwriteCloud,
} from "@/lib/storage/migrationService"
import { ProgressConflictModal } from "./ProgressConflictModal"
import { PlayerProfile } from "@/types/player"
import { useI18n } from "@/lib/i18n/i18nContext"

export function MigrationSyncManager() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const [conflict, setConflict] = useState<{
    localProfile: PlayerProfile
    cloudProfile: PlayerProfile
  } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user || user.isGuest) return

    let cancelled = false

    const checkMigration = async () => {
      try {
        const localProfile = loadPlayerProfile()
        const cloudProfile = await fetchCloudPlayerProfile(user.id)

        if (cancelled) return

        if (!cloudProfile) {
          // If cloud profile doesn't exist yet and local has progress, auto-migrate
          if (hasMeaningfulProgress(localProfile)) {
            await autoMigrateLocalToCloud(user.id, user.username, localProfile)
            setNotice(t("migration.autoMigratedNotice"))
            setTimeout(() => setNotice(null), 5000)
          }
          return
        }

        // Both profiles exist. Check for conflict:
        if (hasSaveConflict(localProfile, cloudProfile)) {
          setConflict({ localProfile, cloudProfile })
          return
        }

        // No conflict: If local has progress and cloud is empty default, auto-migrate
        if (hasMeaningfulProgress(localProfile) && !hasMeaningfulProgress(cloudProfile)) {
          await autoMigrateLocalToCloud(user.id, user.username, localProfile)
          setNotice(t("migration.autoMigratedNotice"))
          setTimeout(() => setNotice(null), 5000)
        } else {
          // Cloud has valid progress, sync to local
          resolveKeepCloud(cloudProfile)
        }
      } catch (err) {
        console.warn("[MigrationSyncManager] Error checking save migration:", err)
      }
    }

    checkMigration()

    return () => {
      cancelled = true
    }
  }, [user, isAuthenticated, t])

  const handleKeepCloud = () => {
    if (!conflict) return
    resolveKeepCloud(conflict.cloudProfile)
    setConflict(null)
  }

  const handleOverwriteCloud = async () => {
    if (!conflict || !user) return
    await resolveOverwriteCloud(user.id, conflict.localProfile)
    setConflict(null)
  }

  return (
    <>
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2">
          <span>{notice}</span>
        </div>
      )}
      {conflict && (
        <ProgressConflictModal
          isOpen={true}
          localProfile={conflict.localProfile}
          cloudProfile={conflict.cloudProfile}
          onKeepCloud={handleKeepCloud}
          onOverwriteCloud={handleOverwriteCloud}
        />
      )}
    </>
  )
}
