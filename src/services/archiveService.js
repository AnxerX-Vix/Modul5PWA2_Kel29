// ---------------------------------------------------------------------------
// archiveService.js — Manajemen soft-delete / arsip barang berbasis localStorage.
// Database Supabase dipakai bareng-bareng, jadi status arsip disimpan lokal.
// ---------------------------------------------------------------------------

const ARCHIVED_IDS_KEY = 'bore_barrel_archived_ids'

/**
 * Ambil semua ID barang yang diarsipkan dari localStorage
 */
export const getArchivedIds = () => {
  try {
    const raw = localStorage.getItem(ARCHIVED_IDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Cek apakah sebuah barang sedang diarsipkan
 */
export const isArchived = (gunId) => {
  if (!gunId) return false
  const ids = getArchivedIds()
  return ids.some((id) => String(id) === String(gunId))
}

/**
 * Arsipkan barang berdasarkan ID
 */
export const archiveGun = (gunId) => {
  if (!gunId) return false
  try {
    const ids = getArchivedIds()
    const strId = String(gunId)
    if (!ids.some((id) => String(id) === strId)) {
      ids.push(gunId)
      localStorage.setItem(ARCHIVED_IDS_KEY, JSON.stringify(ids))
      // Trigger event custom biar UI lain bisa update otomatis
      window.dispatchEvent(new Event('bore_barrel_archive_changed'))
    }
    return true
  } catch {
    return false
  }
}

/**
 * Pulihkan barang dari arsip kembali ke katalog
 */
export const unarchiveGun = (gunId) => {
  if (!gunId) return false
  try {
    const ids = getArchivedIds()
    const strId = String(gunId)
    const filtered = ids.filter((id) => String(id) !== strId)
    localStorage.setItem(ARCHIVED_IDS_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('bore_barrel_archive_changed'))
    return true
  } catch {
    return false
  }
}

export default {
  getArchivedIds,
  isArchived,
  archiveGun,
  unarchiveGun,
}

