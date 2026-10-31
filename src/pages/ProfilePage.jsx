import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Camera,
  Play,
  UserCheck,
  Trash2,
  Edit3,
  Archive,
  RotateCcw,
  Info,
  MapPin,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useArchivedGuns } from '../hooks/useArchivedGuns'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import { formatPrice } from '../utils/helpers'

/**
 * ProfilePage — User identity, settings, draft storage, archived items,
 * and armory info (About & Contact sections).
 */
export default function ProfilePage({ onReplaySplash, onNavigateEditProfile, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const { favorites } = useFavorites()

  // Arsip barang
  const { archivedIds, unarchive } = useArchivedGuns()
  const { guns: apiGuns } = useGuns({ limit: 50 })

  // Data barang lengkap untuk mencari detail barang yang diarsipkan
  const allGuns = useMemo(() => {
    const list = [...apiGuns]
    GUNS_LOCAL.forEach((localGun, idx) => {
      const id = localGun.id || `local-${idx}`
      if (!list.some((g) => String(g.id) === String(id))) {
        list.push({ ...localGun, id })
      }
    })
    return list
  }, [apiGuns])

  // Filter daftar barang yang sedang diarsipkan
  const archivedGuns = useMemo(() => {
    if (archivedIds.length === 0) return []
    return archivedIds.map((archId) => {
      return (
        allGuns.find((g) => String(g.id) === String(archId)) || {
          id: archId,
          name: `Item #${archId}`,
          type: 'Hardware',
          price: 0,
          image_url: '/guns/pistol.svg',
        }
      )
    })
  }, [allGuns, archivedIds])

  // State daftar draf
  const [draftList, setDraftList] = useState([])

  const loadDrafts = useCallback(() => {
    const ids = getAllDraftIds()
    const drafts = ids.map((id) => {
      const data = loadDraft(id)
      const ts = getDraftTimestamp(id)
      const isCreate = id === 'create'
      const name = data?.formData?.name || (isCreate ? 'Produk Baru (Tanpa Judul)' : `Hardware #${id}`)
      const type = isCreate ? 'Draf Produk Baru' : 'Draf Edit Hardware'
      return {
        id,
        isCreate,
        name,
        type,
        data,
        timestamp: ts,
        timeAgo: formatDraftTime(ts),
      }
    })
    setDraftList(drafts)
  }, [])

  useEffect(() => {
    loadDrafts()
    // Muat profil terbaru jika ada perubahan
    setProfile(userService.getUserProfile())
  }, [loadDrafts])

  const showToast = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar image must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      showToast('Avatar updated.')
    }
    reader.readAsDataURL(file)
  }

  // Hapus draf dari localStorage
  const handleDeleteDraft = (draftId) => {
    if (!window.confirm('Hapus draf ini dari penyimpanan perangkat?')) return
    deleteDraft(draftId)
    loadDrafts()
    showToast('Draf berhasil dihapus.')
  }

  // Lanjutkan edit draf
  const handleResumeDraft = (draft) => {
    if (!onNavigate) return
    if (draft.isCreate) {
      onNavigate('Create')
    } else {
      onNavigate('Edit', { id: draft.id, ...draft.data?.formData })
    }
  }

  // Pulihkan barang dari arsip
  const handleUnarchive = (gunId, gunName) => {
    unarchive(gunId)
    showToast(`"${gunName || 'Barang'}" berhasil dipulihkan ke katalog!`)
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, draft manager, and armory info.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {feedback && (
        <div className="toast toast--success" style={{ marginBottom: '16px' }}>
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
            {profile.bio && (
              <p className="profile-bio-text" style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--steel)' }}>
                {profile.bio}
              </p>
            )}
            {/* Tombol ke halaman terpisah Edit Profil */}
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={onNavigateEditProfile}
                title="Buka halaman formulir edit profil"
              >
                <UserCheck size={15} /> Edit Profil
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{draftList.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archivedIds.length}</div>
            <div className="stat-label">Archived Hardware</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DAFTAR DRAF TERSIMPAN (Tantangan 5) */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="display" style={{ fontSize: '1.4rem' }}>Draf Tersimpan</h2>
            <p style={{ color: 'var(--steel)', fontSize: '0.88rem' }}>
              Daftar draf formulir yang disimpan secara lokal di perangkat Anda.
            </p>
          </div>
          <span className="count">{draftList.length} draf</span>
        </div>

        {draftList.length === 0 ? (
          <div className="state-box" style={{ padding: '24px' }}>
            <FileText size={24} stroke="var(--steel)" />
            <p>Tidak ada draf yang tersimpan saat ini.</p>
          </div>
        ) : (
          <ul className="profile-draft-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {draftList.map((draft) => (
              <li
                key={draft.id}
                className="profile-draft-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
                    {draft.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--steel)', marginTop: '2px' }}>
                    <span className="badge" style={{ marginRight: '8px', padding: '2px 6px', background: 'rgba(255,123,18,0.15)', color: 'var(--brass)', borderRadius: '4px' }}>
                      {draft.type}
                    </span>
                    Tersimpan: {draft.timeAgo || 'Baru saja'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => handleResumeDraft(draft)}
                    title="Lanjutkan mengedit draf ini"
                  >
                    <Edit3 size={14} /> Lanjutkan Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleDeleteDraft(draft.id)}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444' }}
                    title="Hapus draf ini"
                  >
                    <Trash2 size={14} /> Hapus Draf
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 2: BARANG DIARSIPKAN (Tantangan 6) */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="display" style={{ fontSize: '1.4rem' }}>Barang Diarsipkan</h2>
            <p style={{ color: 'var(--steel)', fontSize: '0.88rem' }}>
              Item yang disembunyikan dari katalog utama (soft delete berbasis localStorage).
            </p>
          </div>
          <span className="count">{archivedGuns.length} item</span>
        </div>

        {archivedGuns.length === 0 ? (
          <div className="state-box" style={{ padding: '24px' }}>
            <Archive size={24} stroke="var(--steel)" />
            <p>Belum ada produk yang diarsipkan.</p>
          </div>
        ) : (
          <ul className="profile-archived-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {archivedGuns.map((item) => (
              <li
                key={item.id}
                className="profile-archived-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={item.image_url || '/guns/pistol.svg'}
                    alt={item.name}
                    style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px' }}
                    loading="lazy"
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--steel)' }}>
                      {item.type} {item.caliber ? `· ${item.caliber}` : ''} · {formatPrice(item.price)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => handleUnarchive(item.id, item.name)}
                  title="Kembalikan barang ini ke katalog utama"
                >
                  <RotateCcw size={14} /> Pulihkan
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 3: ABOUT & CONTACT SECTIONS (Tantangan 4) */}
      <div className="profile-info-blocks" style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* About Section */}
        <div
          className="profile-info-card"
          style={{
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Info size={20} stroke="var(--brass)" />
            <h3 className="display" style={{ fontSize: '1.25rem', margin: 0 }}>
              About Bore &amp; Barrel
            </h3>
          </div>
          <p style={{ color: 'var(--steel)', lineHeight: '1.6', fontSize: '0.93rem', margin: 0 }}>
            A one-room armory. Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
            from the bench — no markup theatre, no filler.
          </p>
        </div>

        {/* Contact Section */}
        <div
          className="profile-info-card"
          style={{
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <MapPin size={20} stroke="var(--brass)" />
            <h3 className="display" style={{ fontSize: '1.25rem', margin: 0 }}>
              Come by the shop
            </h3>
          </div>
          <p style={{ color: 'var(--steel)', lineHeight: '1.6', fontSize: '0.93rem', margin: 0 }}>
            123 Range Road. Open Tuesday to Saturday, 10 to 6. Call (555) 010-0100.
          </p>
        </div>
      </div>
    </div>
  )
}
