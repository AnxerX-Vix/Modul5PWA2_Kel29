import { Share2, ShoppingCart, Archive } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useCart } from '../../hooks/useCart'
import { formatPrice, truncate } from '../../utils/helpers'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun          - product data
 * @param {Function} props.onSelect     - called with the gun when clicked
 * @param {Function} [props.onEdit]     - called when Edit is clicked
 * @param {Function} [props.onDelete]   - called when Delete is clicked
 * @param {Function} [props.onArchive]  - called when Archive is clicked
 * @param {Function} [props.onFeedback] - callback to show toast notification
 */
export default function GunCard({
  gun,
  onSelect,
  onEdit,
  onDelete,
  onArchive,
  onFeedback,
}) {
  const { addToCart } = useCart()
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Salin link produk unik
  const handleShare = (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}?gunId=${gun.id}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
    } else {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    if (onFeedback) {
      onFeedback('Link produk disalin!')
    }
  }

  // Tambahkan produk ke keranjang
  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(gun, 1)
    if (onFeedback) {
      onFeedback(`"${gun.name}" dimasukkan ke keranjang!`)
    }
  }

  // Arsipkan produk (soft delete lokal)
  const handleArchive = (e) => {
    e.stopPropagation()
    if (onArchive) {
      onArchive(gun)
    }
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
        />
        <span className="name display">{gun.name}</span>
        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>
        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}
        <span className="price">{formatPrice(price)}</span>
      </button>

      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        {/* Tombol Share Link */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title="Share Link Produk"
        >
          <Share2 size={15} />
        </button>

        {/* Tombol + Keranjang */}
        <button
          type="button"
          className="card-act-btn card-act-btn--cart"
          onClick={handleAddToCart}
          aria-label={`Tambah ${gun.name} ke keranjang`}
          title="+ Keranjang"
        >
          <ShoppingCart size={15} />
        </button>

        {/* Tombol Arsipkan (Soft Delete) */}
        {onArchive && (
          <button
            type="button"
            className="card-act-btn"
            onClick={handleArchive}
            aria-label={`Arsipkan ${gun.name}`}
            title="Arsipkan Produk"
          >
            <Archive size={15} />
          </button>
        )}

        {/* Tombol Edit */}
        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {/* Tombol Hapus Permanen */}
        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Delete ${gun.name}`}
            title="Delete Permanen"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
