import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingCart, Check } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ReviewItem from './ReviewItem'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import { useCart } from '../../hooks/useCart'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       - product data
 * @param {Function} props.onBack    - return to catalog
 * @param {Function} [props.onEdit]  - navigate to edit page
 * @param {Function} [props.onDelete]- trigger delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { addToCart } = useCart()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length
  const currentUserId = getUserIdentifier()

  // Salin link produk unik ke clipboard
  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?gunId=${gun.id}`
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
    } else {
      // Fallback manual jika clipboard API tidak tersedia
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setToastMessage('Link produk disalin!')
    setTimeout(() => setToastMessage(''), 2500)
  }

  // Tambah produk ke keranjang belanja
  const handleAddToCart = () => {
    addToCart(gun, 1)
    setToastMessage('Berhasil ditambahkan ke keranjang!')
    setTimeout(() => setToastMessage(''), 2500)
  }

  // Submit ulasan baru
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: currentUserId,
      user_id: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  // Edit ulasan pengguna
  const handleUpdateReview = async (reviewId, updatedData) => {
    try {
      await reviewService.updateReview(reviewId, updatedData)
      setToastMessage('Ulasan berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 2500)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui ulasan.')
    }
  }

  // Hapus ulasan pengguna
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId)
      setToastMessage('Ulasan berhasil dihapus!')
      setTimeout(() => setToastMessage(''), 2500)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal menghapus ulasan.')
    }
  }

  // Cek apakah user yang sedang aktif adalah pemilik ulasan
  const checkIsOwner = (rev) => {
    if (!currentUserId) return false
    return (
      String(rev.user_id) === String(currentUserId) ||
      String(rev.user_identifier) === String(currentUserId) ||
      String(rev.user_identifier) === `Operator ${String(currentUserId).substring(0, 8)}`
    )
  }

  return (
    <div className="detail">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {toastMessage && (
        <div className="toast toast--success" style={{ marginBottom: '16px' }}>
          <Check size={18} /> {toastMessage}
        </div>
      )}

      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>
          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <FavoriteButton gunId={gun.id || gun.name} />

            <button
              type="button"
              className="btn btn--outline"
              onClick={handleShareLink}
              title="Share Link Produk"
            >
              <Share2 size={16} /> Share Link
            </button>

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAddToCart}
              title="Tambah ke Keranjang"
            >
              <ShoppingCart size={16} /> + Keranjang
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="detail-section">
        <h2>Reviews</h2>
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>
          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>
          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <ReviewItem
                key={rev.id}
                review={rev}
                isOwner={checkIsOwner(rev)}
                onUpdateReview={handleUpdateReview}
                onDeleteReview={handleDeleteReview}
              />
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
