import { useState, useEffect, useCallback } from 'react'
import { getCartItems, saveCartItems } from '../services/cartService'

/**
 * Hook untuk mengelola keranjang belanja (Cart).
 * Tersinkronisasi dengan localStorage dan event window.
 */
export function useCart() {
  const [items, setItems] = useState(() => getCartItems())

  const refreshCart = useCallback(() => {
    setItems(getCartItems())
  }, [])

  useEffect(() => {
    const handleCartChange = () => refreshCart()
    window.addEventListener('bore_barrel_cart_changed', handleCartChange)
    window.addEventListener('storage', handleCartChange)

    return () => {
      window.removeEventListener('bore_barrel_cart_changed', handleCartChange)
      window.removeEventListener('storage', handleCartChange)
    }
  }, [refreshCart])

  // Tambah item ke keranjang (kalau udah ada, tambahin qty)
  const addToCart = (gun, quantity = 1) => {
    if (!gun) return
    const current = getCartItems()
    const gunId = gun.id || gun.name
    const existingIndex = current.findIndex((item) => String(item.id) === String(gunId))

    let updated
    if (existingIndex > -1) {
      updated = [...current]
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: (updated[existingIndex].quantity || 1) + quantity,
      }
    } else {
      updated = [
        ...current,
        {
          id: gunId,
          name: gun.name || 'Hardware Piece',
          price: Number(gun.price ?? gun.cook_time ?? 0),
          type: gun.type || gun.category || 'Hardware',
          caliber: gun.caliber || '',
          image_url: gun.image_url || gun.image || '/guns/pistol.svg',
          quantity: quantity > 0 ? quantity : 1,
        },
      ]
    }

    saveCartItems(updated)
    setItems(updated)
  }

  // Update kuantitas item tertentu
  const updateQuantity = (gunId, qty) => {
    const current = getCartItems()
    let updated
    if (qty <= 0) {
      // Hapus kalau qty 0 atau kurang
      updated = current.filter((item) => String(item.id) !== String(gunId))
    } else {
      updated = current.map((item) => {
        if (String(item.id) === String(gunId)) {
          return { ...item, quantity: qty }
        }
        return item
      })
    }
    saveCartItems(updated)
    setItems(updated)
  }

  // Hapus item dari keranjang
  const removeFromCart = (gunId) => {
    const current = getCartItems()
    const updated = current.filter((item) => String(item.id) !== String(gunId))
    saveCartItems(updated)
    setItems(updated)
  }

  // Bersihkan seluruh isi keranjang
  const clearCart = () => {
    saveCartItems([])
    setItems([])
  }

  // Hitung total jumlah barang
  const totalCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0)

  // Hitung total harga
  const totalPrice = items.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0,
  )

  return {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCount,
    totalPrice,
  }
}

export default useCart

