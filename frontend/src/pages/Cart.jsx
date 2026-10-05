import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart()
  const deliveryFee = subtotal > 20000 ? 0 : 299
  const total = subtotal + deliveryFee

  if (!cart.length) {
    return (
      <div className="container page-section state-wrapper">
        <div className="state-card empty-state">
          <div className="state-icon">🛒</div>
          <h3>Your bag is empty</h3>
          <p>Your flash-sale picks will appear here once you add them.</p>
          <Link to="/products" className="primary-btn">Continue shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container page-section cart-layout">
      <div className="cart-items-panel">
        <div className="section-header-row">
          <div>
            <span className="eyebrow">Your cart</span>
            <h2>{cart.length} items selected</h2>
          </div>
        </div>

        {cart.map((item) => (
          <div key={item.id} className="cart-item-card">
            <img src={item.image} alt={item.name} />
            <div className="cart-item-main">
              <h3>{item.name}</h3>
              <p>{item.category}</p>
              <div className="cart-controls">
                <div className="inline-quantity">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus size={12} />
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus size={12} />
                  </button>
                </div>
                <button type="button" className="remove-btn" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
            <div className="item-price">{formatPrice(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>

      <aside className="summary-panel">
        <h3>Order summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Discount</span>
          <strong>-₹0</strong>
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <strong>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</strong>
        </div>
        <div className="summary-row total-row">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>

        <Link to="/checkout" className="primary-btn full-width-btn">
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  )
}
