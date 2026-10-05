export default function StockBadge({ stockStatus, stock }) {
  const config = {
    AVAILABLE: { label: 'Available', className: 'stock-available' },
    RESERVING: { label: 'Reserving', className: 'stock-reserving' },
    RESERVED: { label: 'Reserved', className: 'stock-reserved' },
    SOLD_OUT: { label: 'Sold out', className: 'stock-soldout' },
    PAYMENT_PROCESSING: { label: 'Payment processing', className: 'stock-processing' },
    PAYMENT_SUCCESS: { label: 'Payment success', className: 'stock-success' },
    PAYMENT_FAILED: { label: 'Payment failed', className: 'stock-failed' },
    ORDER_CONFIRMED: { label: 'Order confirmed', className: 'stock-success' },
    RATE_LIMITED: { label: 'Rate limited', className: 'stock-warning' },
    SERVICE_UNAVAILABLE: { label: 'Service unavailable', className: 'stock-warning' },
    NETWORK_ERROR: { label: 'Network error', className: 'stock-warning' },
  }

  const status = config[stockStatus] || config.AVAILABLE

  return (
    <div className={`stock-badge ${status.className}`}>
      <span className="dot" />
      {status.label}
      {stock !== undefined ? <small>{stock} left</small> : null}
    </div>
  )
}
