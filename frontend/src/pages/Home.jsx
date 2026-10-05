import { ArrowRight, Flower2, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import { featureHighlights, sampleProducts } from '../data/mockData'

export default function Home() {
  const featured = sampleProducts.slice(0, 4)

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="flash-badge hero-badge">
              <Sparkles size={14} /> Fresh Blooms Today
            </span>
            <h1>Bring Home Blooming Beauty.</h1>
            <p>
              Discover healthy flower saplings for balconies, gardens, and gifting. Every plant is selected
              for beauty, freshness, and easy care so your home blooms naturally.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="primary-btn hero-btn">
                Shop Flower Saplings <ArrowRight size={16} />
              </Link>
              <Link to="/products" className="secondary-btn hero-btn">
                Explore Collection
              </Link>
            </div>

            <div className="hero-meta">
              <div>
                <strong>5k+</strong>
                <span>happy gardeners</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>plant rating</span>
              </div>
              <div>
                <strong>48 hrs</strong>
                <span>delivery window</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card product-spotlight">
              <div className="spotlight-header">
                <span>Spring pick</span>
                <span className="mini-pill">30% OFF</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80"
                alt="Garden flower sapling"
              />
              <div className="spots-flex">
                <div>
                  <small>Now</small>
                  <strong>₹399</strong>
                </div>
                <div>
                  <small>Healthy bloom</small>
                  <strong>Ready to plant</strong>
                </div>
              </div>
            </div>
            <div className="floating-badge badge-top">Only 7 left</div>
            <div className="floating-badge badge-bottom">Easy care</div>
          </div>
        </div>
      </section>

      <section className="container section-block">
        <div className="section-header-row">
          <div>
            <span className="eyebrow">Spring picks</span>
            <h2>Best sellers this week</h2>
          </div>
          <Link to="/products" className="text-link">See all flowers</Link>
        </div>

        <div className="flash-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} featured />
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-header-row">
          <div>
            <span className="eyebrow">Popular blooms</span>
            <h2>Find your perfect flower</h2>
          </div>
        </div>

        <div className="category-grid">
          {['Rose', 'Jasmine', 'Sunflower', 'Orchid'].map((category, index) => (
            <Link key={category} to="/products" className={`category-card category-${index + 1}`}>
              <span className="category-tag">{category}</span>
              <h3>{category}</h3>
              <p>Fragrant, vibrant, and ready to brighten your space.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <div className="section-header-row">
          <div>
            <span className="eyebrow">Why gardeners love us</span>
            <h2>Care that helps your garden thrive</h2>
          </div>
        </div>

        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="feature-card modern-card">
              <div className="feature-icon">
                {feature.title.includes('Healthy') ? <Flower2 size={18} /> : feature.title.includes('Fast') ? <Truck size={18} /> : <ShieldCheck size={18} />}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container trust-bar section-block">
        <div>
          <span className="eyebrow">Trust & care</span>
          <h2>Garden-ready plants with expert care</h2>
        </div>
        <div className="trust-pills">
          <span><ShieldCheck size={16} /> Healthy saplings</span>
          <span><Truck size={16} /> Safe delivery</span>
          <span><Sparkles size={16} /> Fresh blooms</span>
        </div>
      </section>

      <section className="container section-block search-spotlight">
        <SearchBar value="" onChange={() => {}} placeholder="Search flower saplings" />
      </section>
    </>
  )
}
