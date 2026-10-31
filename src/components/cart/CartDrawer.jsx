import { X, Plus, Minus, Trash2, ShoppingBag, MessageSquare } from 'lucide-react'
import { formatPrice } from '../../utils/helpers'

// Nomor WhatsApp tujuan pemesanan (bisa disesuaikan kebutuhan)
const DEFAULT_WHATSAPP_NUMBER = '6281234567890'

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  totalPrice,
  whatsappNumber = DEFAULT_WHATSAPP_NUMBER,
}) {
  if (!isOpen) return null

  // Susun format pesan WhatsApp sesuai spesifikasi tantangan
  const handleCheckoutWA = () => {
    if (items.length === 0) return

    const lines = items.map((item) => {
      const subtotal = (Number(item.price) || 0) * (item.quantity || 1)
      return `- ${item.name} x ${item.quantity} = $${subtotal.toLocaleString()}`
    })

    const message = `Hi, aku mau pesan:\n${lines.join('\n')}\nTotal: $${totalPrice.toLocaleString()}`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="cart-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div className="cart-title-wrap">
            <ShoppingBag size={20} />
            <h2 className="display">Keranjang Belanja</h2>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Tutup keranjang"
          >
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} stroke="var(--steel)" />
              <p>Keranjang belanja masih kosong.</p>
              <button type="button" className="btn btn--outline btn--sm" onClick={onClose}>
                Lanjut Belanja
              </button>
            </div>
          ) : (
            <ul className="cart-list">
              {items.map((item) => {
                const subtotal = (Number(item.price) || 0) * (item.quantity || 1)
                return (
                  <li key={item.id} className="cart-item">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="cart-item-img"
                      loading="lazy"
                    />
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-type">
                        {item.type} {item.caliber ? `· ${item.caliber}` : ''}
                      </div>
                      <div className="cart-item-price">{formatPrice(item.price)}</div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQty(item.id, (item.quantity || 1) - 1)}
                          title="Kurangi jumlah"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-val">{item.quantity || 1}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQty(item.id, (item.quantity || 1) + 1)}
                          title="Tambah jumlah"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="cart-item-subtotal">${subtotal.toLocaleString()}</div>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => onRemoveItem(item.id)}
                        title="Hapus dari keranjang"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Total Pesanan:</span>
              <span className="cart-total-price">{formatPrice(totalPrice)}</span>
            </div>
            <button
              type="button"
              className="btn btn--primary cart-checkout-btn"
              onClick={handleCheckoutWA}
            >
              <MessageSquare size={18} /> Checkout via WhatsApp
            </button>
            <button
              type="button"
              className="link-btn cart-clear-link"
              onClick={onClearCart}
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

