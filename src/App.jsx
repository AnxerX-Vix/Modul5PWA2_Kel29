import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import PWABadge from './components/PWABadge.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import GUNS_LOCAL from './data/guns.js'
import { useCart } from './hooks/useCart.js'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy Loading untuk memuat halaman & modal berat secara on-demand (Tantangan 2)
// ---------------------------------------------------------------------------
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const ConfirmModal = lazy(() => import('./components/modals/ConfirmModal.jsx'))
const CartDrawer = lazy(() => import('./components/cart/CartDrawer.jsx'))

// Fallback visual saat komponen dinamis sedang dimuat
function SuspenseFallback() {
  return (
    <div className="state-box" style={{ minHeight: '220px' }}>
      <Loader size={28} className="spin" />
      <p>Memuat modul halaman…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit-profile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // State drawer keranjang belanja
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { items: cartItems, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()

  // ---------------------------------------------------------------------------
  // TANTANGAN 1: Baca URLSearchParams saat inisialisasi aplikasi untuk share link unik (?gunId=...)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gunId = params.get('gunId')
    if (!gunId) return

    const loadSharedProduct = async () => {
      try {
        const res = await gunService.getGunById(gunId)
        if (res.success && res.data) {
          setSelectedGun(res.data)
          setMode('detail')
          return
        }
      } catch {
        // Cek data fallback lokal jika API tidak dapat dijangkau
        const local = GUNS_LOCAL.find(
          (g, idx) => String(g.id || `local-${idx}`) === String(gunId) || g.name === gunId,
        )
        if (local) {
          setSelectedGun({ ...local, id: local.id || gunId })
          setMode('detail')
        }
      }
    }

    loadSharedProduct()
  }, [])

  // Handler navigasi terpusat
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Pindah tab utama (Catalog | Favorites | Profile)
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  const handleBackToProfile = () => {
    setMode('list')
    setTab('Profile')
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="main">
        {/* Suspense membungkus rute yang dimuat secara Lazy (Tantangan 2) */}
        <Suspense fallback={<SuspenseFallback />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {/* Halaman terpisah edit profil (Tantangan 8) */}
          {mode === 'edit-profile' && (
            <EditProfilePage
              onBack={handleBackToProfile}
              onSaveSuccess={() => handleBackToProfile()}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigateEditProfile={() => handleNavigate('EditProfile')}
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation Modal (Lazy Loaded) */}
      <Suspense fallback={null}>
        {Boolean(deleteTarget) && (
          <ConfirmModal
            open={Boolean(deleteTarget)}
            title="Delete Hardware Record"
            message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            danger
            loading={deleting}
            onConfirm={async () => {
              if (!deleteTarget) return
              try {
                setDeleting(true)
                await gunService.deleteGun(deleteTarget.id)
                setDeleteTarget(null)
                handleBackToList()
                setTab('Catalog')
              } catch (err) {
                alert(err.message || 'Failed to delete record.')
              } finally {
                setDeleting(false)
              }
            }}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* Modal Drawer Keranjang Belanja (Tantangan 9) */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQty={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          totalPrice={totalPrice}
        />
      </Suspense>

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
