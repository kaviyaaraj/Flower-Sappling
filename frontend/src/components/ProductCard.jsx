import { useState } from 'react'
import { Heart, Loader2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import StockProgress from './StockProgress'

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

export default function ProductCard({ product, featured = false }) {
  const { addToCart, stockOverrides } = useCart()
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  )

  // Use backend-authoritative stock if we have it (set after any addToCart),
  // otherwise fall back to what was loaded on the product object.
  const productId = product.id || product.productId
  const liveStock =
    stockOverrides[productId] !== undefined ? stockOverrides[productId] : product.stock

  const stockValue = liveStock === 0 ? 0 : Math.max(1, liveStock)
  const isSoldOut = liveStock === 0

  const handleAddToCart = async () => {
    if (adding || isSoldOut) return
    setAdding(true)
    try {
      await addToCart(product, 1, user?.id || 'u-101')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className={`product-card ${featured ? 'feature-card' : ''}`}>
      <div className="product-image-box">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="card-badges">
          <span className="discount-badge">-{discount}%</span>
          <button type="button" className="wishlist-btn" aria-label={`Save ${product.name}`}>
            <Heart size={14} />
          </button>
        </div>
      </div>

      <div className="product-body">
        <div className="rating-row">
          <span className="star-rating">
            <Star size={14} fill="currentColor" /> {product.rating}
          </span>
          <small>{product.reviews} reviews</small>
        </div>

        <Link to={`/product/${productId}`} className="product-name-link">
          {product.name}
        </Link>

        <div className="price-row">
          <strong>{formatPrice(product.price)}</strong>
          <span>{formatPrice(product.originalPrice)}</span>
        </div>

        <div className="stock-meta-row">
          <span>{isSoldOut ? 'Sold out' : `${liveStock} left`}</span>
          <span>{product.category}</span>
        </div>

        {/* StockProgress uses the live stock value — updates automatically */}
        <StockProgress stock={stockValue} total={product.totalStock || 24} />

        <button
          type="button"
          className="primary-btn product-btn"
          disabled={isSoldOut || adding}
          onClick={handleAddToCart}
        >
          {adding ? (
            <>
              <Loader2 size={14} className="spin" /> Adding…
            </>
          ) : isSoldOut ? (
            'Sold Out'
          ) : (
            'Add to cart'
          )}
        </button>
      </div>
    </article>
  )
}
