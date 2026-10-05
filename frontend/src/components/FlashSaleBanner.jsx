import { Flame, ArrowRight } from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import { Link } from 'react-router-dom'

export default function FlashSaleBanner() {
  return (
    <section className="flash-sale-banner">
      <div className="flash-copy">
        <span className="flash-badge">
          <Flame size={14} /> FLASH SALE
        </span>
        <h2>Limited stock. Hurry!</h2>
        <p>Premium tech deals that disappear fast. Secure your pick before the timer hits zero.</p>
      </div>

      <div className="flash-meta">
        <CountdownTimer target="2026-10-15T18:00:00" />
        <Link to="/products" className="secondary-btn small-btn">
          View deals <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}
