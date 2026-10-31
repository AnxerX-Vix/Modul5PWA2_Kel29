import { useState, useEffect, useCallback } from 'react'
import { getArchivedIds, archiveGun as serviceArchive, unarchiveGun as serviceUnarchive, isArchived as serviceIsArchived } from '../services/archiveService'

/**
 * Hook untuk memantau dan mengelola daftar ID barang yang diarsipkan.
 */
export function useArchivedGuns() {
  const [archivedIds, setArchivedIds] = useState(() => getArchivedIds())

  const refreshArchived = useCallback(() => {
    setArchivedIds(getArchivedIds())
  }, [])

  useEffect(() => {
    // Sinkronisasi jika ada perubahan arsip dari tab lain atau komponen lain
    const handleStorageChange = () => refreshArchived()
    window.addEventListener('bore_barrel_archive_changed', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('bore_barrel_archive_changed', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshArchived])

  const archive = (gunId) => {
    const ok = serviceArchive(gunId)
    if (ok) refreshArchived()
    return ok
  }

  const unarchive = (gunId) => {
    const ok = serviceUnarchive(gunId)
    if (ok) refreshArchived()
    return ok
  }

  const isGunArchived = (gunId) => {
    return serviceIsArchived(gunId)
  }

  return {
    archivedIds,
    archive,
    unarchive,
    isGunArchived,
    refreshArchived,
  }
}

export default useArchivedGuns

