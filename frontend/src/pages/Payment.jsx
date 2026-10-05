import { useState } from 'react'
import { CreditCard, Download, Landmark, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createIdempotencyKey, createPayment } from '../services/api'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

const paymentOptions = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'net', label: 'Net Banking', icon: Landmark },
]

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const order = location.state || {
    total: 24999,
    items: [{ name: 'Flower sapling', quantity: 1 }],
  }
  const upiId = import.meta.env.VITE_UPI_ID || 'bloomnest@upi'
  const paymentUri = `upi://pay?${new URLSearchParams({
    pa: upiId,
    pn: 'BloomNest',
    am: Number(order.total).toFixed(2),
    cu: 'INR',
    tn: 'BloomNest order payment',
  }).toString()}`

  const downloadQr = () => {
    const qrMarkup = document.getElementById('upi-payment-qr')?.outerHTML
    if (!qrMarkup) return

    const qrFile = new Blob([qrMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(qrFile)
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = `bloomnest-payment-${Math.round(Number(order.total))}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const idempotencyKey = createIdempotencyKey()
      await createPayment(
        {
          orderId: `ORD-${Date.now()}`,
          amount: order.total,
          paymentMethod: selected,
          status: 'SUCCESS',
        },
        idempotencyKey,
      )

      navigate('/order-success', {
        state: {
          orderId: `ORD-${Date.now()}`,
          product: order.items[0]?.name || 'Premium product',
          quantity: order.items[0]?.quantity || 1,
          amount: order.total,
          paymentStatus: 'Paid',
        },
      })
    } catch (requestError) {
      setIsProcessing(false)
      setError('Payment failed. Please retry securely.')
    }
  }

  return (
    <div className="container page-section payment-layout">
      <div className="payment-box">
        <div className="progress-steps">
          <span className="done">Cart</span>
          <span className="done">Checkout</span>
          <span className="current">Payment</span>
          <span>Confirmed</span>
        </div>

        <h2>Secure payment</h2>
        <div className="payment-options">
          {paymentOptions.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                type="button"
                className={selected === method.id ? 'payment-option selected' : 'payment-option'}
                onClick={() => setSelected(method.id)}
              >
                <Icon size={18} />
                {method.label}
              </button>
            )
          })}
        </div>

        {selected === 'upi' ? (
          <div className="upi-qr-panel">
            <div className="upi-qr-frame">
              <QRCodeSVG
                value={paymentUri}
                id="upi-payment-qr"
                size={196}
                level="M"
                title="UPI payment QR code"
                bgColor="#ffffff"
                fgColor="#183126"
              />
            </div>
            <div className="upi-qr-copy">
              <span className="upi-demo-label">Demo UPI QR</span>
              <h3>Scan to pay {formatPrice(order.total)}</h3>
              <p>Scan this code with a UPI app to continue.</p>
              <button type="button" className="secondary-btn upi-download-btn" onClick={downloadQr}>
                <Download size={16} /> Download QR
              </button>
              <div className="upi-recipient">
                <span>Pay to</span>
                <strong>{upiId}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="payment-form-card">
            <label>
              Card number
              <input type="text" defaultValue="4242 4242 4242 4242" />
            </label>
            <div className="inline-fields">
              <label>
                Expiry
                <input type="text" defaultValue="12/29" />
              </label>
              <label>
                CVV
                <input type="text" defaultValue="123" />
              </label>
            </div>
          </div>
        )}

        {error ? <div className="error-banner">{error}</div> : null}

        <button type="button" className="primary-btn full-width-btn" disabled={isProcessing} onClick={handlePayment}>
          {isProcessing ? 'Processing payment...' : `Pay ${formatPrice(order.total)}`}
        </button>
      </div>

      <aside className="summary-panel payment-summary">
        <h3>Order amount</h3>
        <div className="pay-amount">{formatPrice(order.total)}</div>
        <div className="summary-row">
          <span>Items</span>
          <strong>{order.items?.length || 1}</strong>
        </div>
        <div className="summary-row">
          <span>Method</span>
          <strong>{selected.toUpperCase()}</strong>
        </div>
      </aside>
    </div>
  )
}
