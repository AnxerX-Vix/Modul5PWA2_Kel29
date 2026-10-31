// ---------------------------------------------------------------------------
// cartService.js — Penyimpanan keranjang belanja berbasis localStorage.
// ---------------------------------------------------------------------------

const CART_STORAGE_KEY = 'bore_barrel_cart'

export const getCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCartItems = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('bore_barrel_cart_changed'))
    return true
  } catch {
    return false
  }
}

export default {
  getCartItems,
  saveCartItems,
}

