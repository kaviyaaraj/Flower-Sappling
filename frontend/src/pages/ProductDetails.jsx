import { useMemo, useState } from 'react'
import { ArrowLeft, ShieldCheck, ShoppingBag, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QuantitySelector from '../components/QuantitySelector'
import StockBadge from '../components/StockBadge'
import { sampleProducts } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { createIdempotencyKey, reserveProduct } from '../services/api'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, notify } = useCart()
  const product = useMemo(
    () => sampleProducts.find((item) => item.id === id) || sampleProducts[0],
    [id],
  )

  const [quantity, setQuantity] = useState(1)
  const [buyState, setBuyState] = useState(product.stock === 0 ? 'SOLD_OUT' : 'AVAILABLE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  const handleBuyNow = async () => {
    if (isSubmitting || product.stock === 0) return

    setIsSubmitting(true)
    setBuyState('RESERVING')

    try {
      const idempotencyKey = createIdempotencyKey()
      await reserveProduct(
        {
          productId: product.id,
          quantity,
          userId: user.id,
        },
        idempotencyKey,
      )

      setBuyState('RESERVED')
      notify('Reservation successful', 'success')
      navigate('/checkout', {
        state: {
          product,
          quantity,
          reserved: true,
        },
      })
    } catch (error) {
      if (error?.status === 409) {
        setBuyState('SOLD_OUT')
        notify('Product is no longer available', 'error')
      } else if (error?.status === 429) {
        setBuyState('RATE_LIMITED')
        notify('You are making requests too quickly. Please wait a moment.', 'warning')
      } else if (error?.status === 503) {
        setBuyState('SERVICE_UNAVAILABLE')
        notify('Our service is temporarily busy. Please try again.', 'info')
      } else {
        setBuyState('NETWORK_ERROR')
        notify('A network issue interrupted the request.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container page-section detail-layout">
      <div className="detail-gallery">
        <Link to="/products" className="back-link">
          <ArrowLeft size={16} /> Back to products
        </Link>
        <div className="main-image-card">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="thumb-row">
          {product.gallery.map((image, index) => (
            <button key={image} type="button" className={index === 0 ? 'thumb active' : 'thumb'}>
              <img src={image} alt={`${product.name} gallery ${index + 1}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="detail-content">
        <div className="eyebrow-row">
          <span className="eyebrow">{product.category}</span>
          <StockBadge stockStatus={buyState} stock={product.stock} />
        </div>

        <h1>{product.name}</h1>

        <div className="rating-row detail-rating">
          <span className="star-rating">
            <Star size={14} fill="currentColor" /> {product.rating}
          </span>
          <span>{product.reviews} reviews</span>
        </div>

        <div className="price-block">
          <div className="price-current">{formatPrice(product.price)}</div>
          <div className="price-stack">
            <span className="price-old">{formatPrice(product.originalPrice)}</span>
            <span className="discount-pill">{discount}% OFF</span>
          </div>
        </div>

        <p className="product-description">{product.description}</p>

        {product.stock > 0 ? (
          <div className="stock-message-row">
            <span>Only {product.stock} left</span>
            <strong>Fast moving</strong>
          </div>
        ) : (
          <div className="stock-message-row sold-out">
            <span>Sold out</span>
            <strong>Secure your next drop</strong>
          </div>
        )}

        <div className="detail-inline-controls">
          <div>
            <label className="tiny-label">Quantity</label>
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(product.stock, 1)} />
          </div>
          <div className="secure-check">
            <ShieldCheck size={16} /> Secure checkout
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="secondary-btn cart-action"
            onClick={() => addToCart(product, quantity)}
          >
            <ShoppingBag size={16} /> Add to cart
          </button>
          <button
            type="button"
            className="primary-btn buy-action"
            disabled={isSubmitting || product.stock === 0}
            onClick={handleBuyNow}
          >
            {isSubmitting ? 'Reserving...' : product.stock === 0 ? 'Sold out' : 'Buy now'}
          </button>
        </div>

        <div className="purchase-status-box">
          {buyState === 'RESERVING' && <p>Reserving your item…</p>}
          {buyState === 'RESERVED' && <p>Reservation successful. Proceeding to checkout.</p>}
          {buyState === 'SOLD_OUT' && <p>Sorry! This item was just purchased by another shopper.</p>}
          {buyState === 'RATE_LIMITED' && <p>You’re making requests too quickly. Please wait a moment.</p>}
          {buyState === 'SERVICE_UNAVAILABLE' && <p>Our service is temporarily busy. Please try again.</p>}
          {buyState === 'NETWORK_ERROR' && <p>A network issue interrupted the request. Please retry.</p>}
        </div>
      </div>
    </div>
  )
}
