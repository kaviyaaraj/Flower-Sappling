import { CheckCircle2, PackageCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

export default function OrderSuccess() {
  const location = useLocation()
  const order = location.state || {
    orderId: 'ORD-1042',
    product: 'Aether Pro X Headphones',
    quantity: 1,
    amount: 24999,
    paymentStatus: 'Paid',
  }

  return (
    <div className="container page-section success-section">
      <div className="success-card">
        <div className="success-icon-wrap">
          <CheckCircle2 size={52} />
        </div>
        <span className="eyebrow success-eyebrow">Order confirmed</span>
        <h1>Order Confirmed!</h1>
        <p>Your premium order is locked in and being processed.</p>

        <div className="success-grid">
          <div>
            <small>Order ID</small>
            <strong>{order.orderId}</strong>
          </div>
          <div>
            <small>Product</small>
            <strong>{order.product}</strong>
          </div>
          <div>
            <small>Quantity</small>
            <strong>{order.quantity}</strong>
          </div>
          <div>
            <small>Amount</small>
            <strong>{formatPrice(order.amount)}</strong>
          </div>
          <div>
            <small>Payment status</small>
            <strong>{order.paymentStatus}</strong>
          </div>
          <div>
            <small>Delivery estimate</small>
            <strong>2-4 days</strong>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/orders" className="primary-btn">
            <PackageCheck size={16} /> View Orders
          </Link>
          <Link to="/products" className="secondary-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
