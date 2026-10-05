import { categories } from '../data/mockData'

export default function FilterPanel({ category, setCategory, priceRange, setPriceRange, rating, setRating, availability, setAvailability }) {
  return (
    <aside className="filter-panel">
      <div className="filter-block">
        <h4>Category</h4>
        <div className="chip-group">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={item === category ? 'chip active' : 'chip'}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block">
        <h4>Price range</h4>
        <input
          type="range"
          min="0"
          max="90000"
          step="5000"
          value={priceRange}
          onChange={(event) => setPriceRange(Number(event.target.value))}
        />
        <p className="range-label">Up to ₹{priceRange.toLocaleString('en-IN')}</p>
      </div>

      <div className="filter-block">
        <h4>Rating</h4>
        <div className="chip-group">
          {[4, 4.5, 4.8].map((item) => (
            <button
              key={item}
              type="button"
              className={item === rating ? 'chip active' : 'chip'}
              onClick={() => setRating(item)}
            >
              {item}+ stars
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block">
        <h4>Availability</h4>
        <div className="chip-group">
          {['All', 'In stock', 'Sold out'].map((option) => (
            <button
              key={option}
              type="button"
              className={option === availability ? 'chip active' : 'chip'}
              onClick={() => setAvailability(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
