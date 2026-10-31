import { useState } from 'react'
import { ArrowLeft, Save, Check } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — Halaman terpisah untuk memperbarui nama (callsign) dan bio operator.
 */
export default function EditProfilePage({ onBack, onSaveSuccess }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)

    const updatedProfile = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
    }

    const result = userService.saveUserProfile(updatedProfile)
    setSaving(false)

    if (result.success) {
      setProfile(result.data)
      setFeedback('Profil armorer berhasil diperbarui!')
      if (onSaveSuccess) onSaveSuccess(result.data)
      setTimeout(() => {
        setFeedback('')
        if (onBack) onBack()
      }, 1000)
    } else {
      setFeedback('Gagal menyimpan profil: ' + (result.message || 'Coba lagi.'))
    }
  }

  return (
    <div className="page edit-profile-page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className="detail-back"
          onClick={onBack}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={18} /> Kembali ke Profil
        </button>
        <h1 className="display">Edit Data Armorer</h1>
        <p className="lede">
          Sesuaikan identitas callsign dan catatan penugasan unit operator Anda.
        </p>
      </div>

      {feedback && (
        <div className="toast toast--success" style={{ marginBottom: '20px' }}>
          <Check size={18} /> {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form" style={{ maxWidth: '640px' }}>
        <div className="form-group">
          <label htmlFor="edit-prof-name" className="form-label">
            Callsign / Operator Alias
          </label>
          <input
            id="edit-prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Contoh: Operator Delta, Master Gunsmith"
            className="form-input"
            required
          />
          <small className="form-hint">
            Nama ini akan tampil pada ulasan dan tanda tangan amunisi Anda.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="edit-prof-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="edit-prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tulis kualifikasi, kaliber favorit, atau catatan stasiun perakitan..."
            rows={4}
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
