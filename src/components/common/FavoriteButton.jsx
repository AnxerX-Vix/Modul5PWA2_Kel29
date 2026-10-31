import { Heart } from 'lucide-react'
import { useIsFavorited, useToggleFavorite } from '../../hooks/useFavorites'

/**
 * A toggleable heart button. Works with both server-backed and
 * localStorage-only favourites.
 *
 * Mendukung penerimaan status `isFavorited` langsung dari parent untuk
 * menghindari N+1 fetch saat dirender di list/katalog.
 *
 * @param {Object}   props
 * @param {string}   props.gunId            - product UUID (or local id)
 * @param {boolean}  [props.isFavorited]    - status favorit dari parent (opsional)
 * @param {Function} [props.onToggle]       - callback setelah toggle
 */
export default function FavoriteButton({ gunId, isFavorited: propIsFavorited, onToggle }) {
  const hasProp = typeof propIsFavorited === 'boolean'

  // Jika parent sudah mengoper isFavorited, hindari pemanggilan useIsFavorited yang fetch sendiri
  const fallback = useIsFavorited(hasProp ? null : gunId)
  const { toggleFavorite: hookToggle, loading: toggleLoading } = useToggleFavorite()

  const isFavorited = hasProp ? propIsFavorited : fallback.isFavorited
  const loading = hasProp ? toggleLoading : fallback.loading

  const handleClick = async (e) => {
    e.stopPropagation() // don't bubble into card click
    let result
    if (hasProp) {
      result = await hookToggle(gunId)
    } else {
      result = await fallback.toggleFavorite()
    }
    if (result && onToggle) onToggle(result)
  }

  return (
    <button
      type="button"
      className={`fav-btn${isFavorited ? ' fav-btn--active' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={18}
        fill={isFavorited ? 'var(--brass)' : 'none'}
        stroke={isFavorited ? 'var(--brass)' : 'var(--steel)'}
      />
    </button>
  )
}
