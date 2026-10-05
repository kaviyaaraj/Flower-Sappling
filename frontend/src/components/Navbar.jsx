import { ShoppingBag, Search, Menu, Sparkles, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'Seasonal Sale', to: '/products?flash=true' },
]

export default function Navbar() {
  const { itemCount } = useCart()
  const { user } = useAuth()

  return (
    <header className="topbar">
      <div className="container nav-shell">
        <div className="brand-wrap">
          <div className="brand-mark">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="brand-name">BloomNest</span>
            <small>Flower Nursery</small>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="search-pill" aria-label="Search">
            <Search size={16} />
            <span>Search</span>
          </div>

          <div className="profile-pill">
            <User size={16} />
            <span>{user?.isLoggedIn ? user.name : 'Login'}</span>
          </div>

          <NavLink to="/cart" className="cart-pill" aria-label="View cart">
            <ShoppingBag size={18} />
            <span>Cart</span>
            <strong>{itemCount}</strong>
          </NavLink>

          <button type="button" className="menu-button" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
