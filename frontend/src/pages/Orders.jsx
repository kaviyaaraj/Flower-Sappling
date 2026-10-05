import { CheckCircle2, Clock3, Truck, PackageCheck } from 'lucide-react'

const orders = [
  {
    id: 'ORD-1024',
    date: '05 Oct, 2026',
    product: 'Aether Pro X Headphones',
    amount: 24999,
    paymentStatus: 'Paid',
    status: 'Confirmed',
  },
  {
    id: 'ORD-9981',
    date: '03 Oct, 2026',
    product: 'Nova Smartwatch Pro',
    amount: 19999,
    paymentStatus: 'Paid',
    status: 'Processing',
  },
]

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

const statuses = [
  { key: 'Confirmed', icon: CheckCircle2 },
  { key: 'Processing', icon: Clock3 },
  { key: 'Shipped', icon: Truck },
  { key: 'Out for Delivery', icon: PackageCheck },
  { key: 'Delivered', icon: CheckCircle2 },
]

export default function Orders() {
  return (
    <div className="container page-section orders-page">
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Orders</span>
          <h2>Recent purchases</h2>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <div className="order-head">
              <div>
                <small>Order ID</small>
                <strong>{order.id}</strong>
              </div>
              <span className="status-pill">{order.paymentStatus}</span>
            </div>

            <div className="order-meta">
              <span>{order.date}</span>
              <span>{order.product}</span>
              <span>{formatPrice(order.amount)}</span>
            </div>

            <div className="timeline">
              {statuses.map((status) => {
                const Icon = status.icon
                const isActive = status.key === order.status || statuses.indexOf(status) < statuses.findIndex((item) => item.key === order.status)

                return (
                  <div key={status.key} className={isActive ? 'timeline-step active' : 'timeline-step'}>
                    <div className="dot-wrap">
                      <Icon size={14} />
                    </div>
                    <span>{status.key}</span>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
