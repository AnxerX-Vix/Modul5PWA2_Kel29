import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeProduct } from './gunService'

// ---------------------------------------------------------------------------
// In-flight Promise Caching & Memory Cache untuk mencegah N+1 Fetch
// Jika banyak komponen me-request data favorit dalam waktu bersamaan,
// hanya TEPAT SATU network request yang akan ditembakkan.
// ---------------------------------------------------------------------------
const inFlightRequests = new Map()
const favoritesMemoryCache = new Map()
const FAV_CACHE_TTL = 30 * 1000 // 30 detik

export const clearFavoriteCache = () => {
  inFlightRequests.clear()
  favoritesMemoryCache.clear()
}

// ---------------------------------------------------------------------------
// FavoriteService — server-side favourites.
// Supports both Supabase (public.favorites with products foreign key join)
// and university API (/api/v1/favorites).
// ---------------------------------------------------------------------------
class FavoriteService {
  /**
   * Retrieve all favourited products for the given user.
   * Dilengkapi in-flight promise deduplication & memory cache.
   */
  async getFavorites(userIdentifier) {
    if (!userIdentifier) return { success: true, data: [] }

    const cacheKey = `favs_${userIdentifier}`

    // 1. Cek memory cache yang masih valid
    const cached = favoritesMemoryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < FAV_CACHE_TTL) {
      return cached.data
    }

    // 2. Cek in-flight promise: jika request serupa sedang berjalan, tumpangi promise yang sama
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)
    }

    // 3. Buat request baru dan simpan promise-nya
    const fetchPromise = (async () => {
      try {
        let result
        if (IS_SUPABASE) {
          const data = await apiClient.get(
            `/rest/v1/favorites?user_id=eq.${userIdentifier}&select=product_id,created_at,products(*)`,
          )
          const list = Array.isArray(data)
            ? data.map((fav) => {
                const prod = fav.products ? normalizeProduct(fav.products) : null
                return {
                  ...(prod || {}),
                  id: fav.product_id,
                  recipe_id: fav.product_id,
                  product_id: fav.product_id,
                  created_at: fav.created_at,
                }
              })
            : []
          result = { success: true, data: list }
        } else {
          result = await apiClient.get('/api/v1/favorites', {
            params: { user_identifier: userIdentifier },
          })
        }

        // Simpan ke memory cache
        favoritesMemoryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        })

        return result
      } finally {
        // Hapus dari in-flight setelah selesai
        inFlightRequests.delete(cacheKey)
      }
    })()

    inFlightRequests.set(cacheKey, fetchPromise)
    return fetchPromise
  }

  /**
   * Toggle a product's favourite state (add ↔ remove).
   * @param {Object} data  { recipe_id, user_identifier }
   */
  async toggleFavorite(data) {
    // Reset cache memori dan request in-flight agar data terupdate
    clearFavoriteCache()

    let result
    if (IS_SUPABASE) {
      const targetId = Number(data.recipe_id || data.gun_id)
      const userId = data.user_identifier

      // Check if already favorited
      const existing = await apiClient.get(
        `/rest/v1/favorites?product_id=eq.${targetId}&user_id=eq.${userId}&select=*`,
      )
      if (Array.isArray(existing) && existing.length > 0) {
        // Remove from favorites
        await apiClient.delete(
          `/rest/v1/favorites?product_id=eq.${targetId}&user_id=eq.${userId}`,
        )
        result = { success: true, data: { is_favorited: false } }
      } else {
        // Add to favorites
        await apiClient.post(
          '/rest/v1/favorites',
          { product_id: targetId, user_id: userId },
          { headers: { Prefer: 'return=minimal' } },
        )
        result = { success: true, data: { is_favorited: true } }
      }
    } else {
      result = await apiClient.post('/api/v1/favorites/toggle', data)
    }

    // Trigger event agar hook di komponen lain otomatis sinkron
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bore_barrel_favorites_changed'))
    }

    return result
  }
}

export default new FavoriteService()
