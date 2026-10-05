import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

export default function Checkout() {
  const { cart, subtotal } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const reservation = location.state || {}
  const deliveryFee = subtotal > 20000 ? 0 : 299
  const total = subtotal + deliveryFee

  return (
    <div className="container page-section checkout-layout">
      <div className="checkout-body">
        <div className="progress-steps">
          <span className="done">Cart</span>
          <span className="current">Checkout</span>
          <span>Payment</span>
          <span>Confirmed</span>
        </div>

        <div className="checkout-box">
          <h2>Delivery address</h2>
          <div className="form-grid">
            <label>
              Full name
              <input type="text" defaultValue={user?.name || ''} />
            </label>
            <label>
              Phone
              <input type="text" defaultValue="+91 98765 43210" />
            </label>
            <label className="full-span">
              Address
              <input type="text" defaultValue="42, Horizon Residency, Banjara Hills, Hyderabad" />
            </label>
            <label>
              City
              <input type="text" defaultValue="Hyderabad" />
            </label>
            <label>
              PIN code
              <input type="text" defaultValue="500034" />
            </label>
          </div>
        </div>

        <div className="checkout-box order-box">
          <h2>Order review</h2>
          {cart.map((item) => (
            <div key={item.id} className="checkout-item">
              <div className="checkout-item-main">
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="summary-panel checkout-summary">
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
          <span>Delivery fee</span>
          <strong>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</strong>
        </div>
        <div className="summary-row total-row">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>

        <button
          type="button"
          className="primary-btn full-width-btn"
          onClick={() => navigate('/payment', { state: { ...reservation, total, items: cart } })}
        >
          Continue to Payment
        </button>

        <Link to="/cart" className="text-link secondary-link">Back to cart</Link>
      </aside>
    </div>
  )
}
