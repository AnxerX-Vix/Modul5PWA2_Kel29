import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Edit2, Trash2, Check, X, Loader } from 'lucide-react'

/**
 * ReviewItem — Komponen satu item ulasan dengan dukungan:
 * 1. Tombol Edit & Hapus jika reviewer adalah user saat ini.
 * 2. Reaksi Thumbs Up (👍) & Thumbs Down (👎) tersimpan di localStorage.
 */
export default function ReviewItem({ review, isOwner, onUpdateReview, onDeleteReview }) {
  const storageKey = `review_reactions_${review.id}`

  // Baca status reaksi dari localStorage
  const [reactionData, setReactionData] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          likes: Number(parsed.likes) || 0,
          dislikes: Number(parsed.dislikes) || 0,
          userReaction: parsed.userReaction || null, // 'up' | 'down' | null
        }
      }
    } catch {
      // jika gagal baca storage
    }
    return { likes: 0, dislikes: 0, userReaction: null }
  })

  // State untuk mode edit ulasan pemilik
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating || 5)
  const [editComment, setEditComment] = useState(review.comment || '')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Handler toggle Thumbs Up
  const handleToggleUp = () => {
    setReactionData((prev) => {
      let nextLikes = prev.likes
      let nextDislikes = prev.dislikes
      let nextReaction = prev.userReaction

      if (prev.userReaction === 'up') {
        // Batalkan up
        nextLikes = Math.max(0, nextLikes - 1)
        nextReaction = null
      } else if (prev.userReaction === 'down') {
        // Pindah dari down ke up
        nextDislikes = Math.max(0, nextDislikes - 1)
        nextLikes += 1
        nextReaction = 'up'
      } else {
        // Belum ada reaksi
        nextLikes += 1
        nextReaction = 'up'
      }

      const nextState = { likes: nextLikes, dislikes: nextDislikes, userReaction: nextReaction }
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextState))
      } catch {
        // ignore storage quota error
      }
      return nextState
    })
  }

  // Handler toggle Thumbs Down
  const handleToggleDown = () => {
    setReactionData((prev) => {
      let nextLikes = prev.likes
      let nextDislikes = prev.dislikes
      let nextReaction = prev.userReaction

      if (prev.userReaction === 'down') {
        // Batalkan down
        nextDislikes = Math.max(0, nextDislikes - 1)
        nextReaction = null
      } else if (prev.userReaction === 'up') {
        // Pindah dari up ke down
        nextLikes = Math.max(0, nextLikes - 1)
        nextDislikes += 1
        nextReaction = 'down'
      } else {
        // Belum ada reaksi
        nextDislikes += 1
        nextReaction = 'down'
      }

      const nextState = { likes: nextLikes, dislikes: nextDislikes, userReaction: nextReaction }
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextState))
      } catch {
        // ignore
      }
      return nextState
    })
  }

  // Simpan perubahan ulasan
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!onUpdateReview) return
    try {
      setSavingEdit(true)
      await onUpdateReview(review.id, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setIsEditing(false)
    } finally {
      setSavingEdit(false)
    }
  }

  // Hapus ulasan
  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus ulasan ini?')) return
    if (!onDeleteReview) return
    try {
      setDeleting(true)
      await onDeleteReview(review.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li className="review-item">
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="review-edit-form">
          <div className="review-edit-rating" style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-btn"
                onClick={() => setEditRating(star)}
              >
                <Star
                  size={18}
                  fill={star <= editRating ? 'var(--brass)' : 'none'}
                  stroke={star <= editRating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>
          <textarea
            className="form-textarea"
            rows={2}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Edit ulasan Anda..."
            style={{ width: '100%', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={savingEdit}
            >
              {savingEdit ? <Loader size={14} className="spin" /> : <Check size={14} />} Simpan
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setIsEditing(false)
                setEditComment(review.comment || '')
                setEditRating(review.rating || 5)
              }}
              disabled={savingEdit}
            >
              <X size={14} /> Batal
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="review-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="review-user">{review.user_identifier || 'Anonymous'}</span>
              {isOwner && (
                <span className="badge-owner" title="Ulasan dari Anda">
                  Anda
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="review-stars-display">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? 'var(--brass)' : 'none'}
                    stroke={i < review.rating ? 'var(--brass)' : 'var(--line)'}
                  />
                ))}
              </span>
              {isOwner && (
                <div className="review-owner-actions" style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => setIsEditing(true)}
                    title="Edit ulasan ini"
                    aria-label="Edit review"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn icon-action-btn--danger"
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Hapus ulasan ini"
                    aria-label="Delete review"
                  >
                    {deleting ? <Loader size={13} className="spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {review.comment && <p className="review-comment">{review.comment}</p>}

          {/* Reaksi Thumbs Up / Down */}
          <div className="review-reactions-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className={`reaction-btn ${reactionData.userReaction === 'up' ? 'reaction-btn--active' : ''}`}
              onClick={handleToggleUp}
              title="Suka ulasan ini (Thumbs Up)"
            >
              <ThumbsUp size={13} />
              <span>{reactionData.likes}</span>
            </button>
            <button
              type="button"
              className={`reaction-btn ${reactionData.userReaction === 'down' ? 'reaction-btn--active' : ''}`}
              onClick={handleToggleDown}
              title="Tidak suka ulasan ini (Thumbs Down)"
            >
              <ThumbsDown size={13} />
              <span>{reactionData.dislikes}</span>
            </button>
          </div>
        </>
      )}
    </li>
  )
}

