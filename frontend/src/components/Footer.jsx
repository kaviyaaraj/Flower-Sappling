import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div>
          <div className="brand-wrap footer-brand">
            <div className="brand-mark">
              <ArrowRight size={16} />
            </div>
            <div>
              <span className="brand-name">BloomNest</span>
              <small>Fresh flowers, happy gardens</small>
            </div>
          </div>
          <p className="muted-text">
            Premium flower saplings and seasonal blooms for beautiful homes, balconies, and gardens.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/orders">Orders</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/cart">Cart</Link>
            <Link to="/checkout">Checkout</Link>
            <Link to="/orders">Tracking</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© 2026 BloomNest</span>
          <span>Fresh blooms • Safe delivery • Garden care</span>
        </div>
      </div>
    </footer>
  )
}
