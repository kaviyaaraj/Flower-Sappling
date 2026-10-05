import { useMemo, useState } from 'react'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import ProductGrid from '../components/ProductGrid'
import useProducts from '../hooks/useProducts'
import { useCart } from '../context/CartContext'

export default function Products() {
  // stockOverrides from CartContext: { [productId]: availableQuantity }
  // Written by CartContext whenever addToCart succeeds or gets a 409.
  const { stockOverrides } = useCart()

  const { products, loading, error } = useProducts()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [priceRange, setPriceRange] = useState(90000)
  const [rating, setRating] = useState(0)
  const [availability, setAvailability] = useState('All')
  const [sort, setSort] = useState('recommended')

  // Merge live stock overrides into the product list before filtering/sorting.
  // This means ProductCard always receives the most up-to-date stock value
  // without any extra API call — it flows directly from CartContext.
  const productsWithLiveStock = useMemo(() => {
    if (!Object.keys(stockOverrides).length) return products
    return products.map((p) => {
      const id = p.id || p.productId
      if (stockOverrides[id] !== undefined) {
        return { ...p, stock: stockOverrides[id] }
      }
      return p
    })
  }, [products, stockOverrides])

  const visibleProducts = useMemo(() => {
    const filtered = productsWithLiveStock.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'All' || product.category === category
      const matchesPrice = product.price <= priceRange
      const matchesRating = rating === 0 || product.rating >= rating
      const matchesAvailability =
        availability === 'All' ||
        (availability === 'In stock' && product.stock > 0) ||
        (availability === 'Sold out' && product.stock === 0)

      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesAvailability
    })

    const sorted = [...filtered]
    if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (sort === 'newest') sorted.sort((a, b) => b.stock - a.stock)

    return sorted
  }, [productsWithLiveStock, search, category, priceRange, rating, availability, sort])

  return (
    <div className="container page-section products-layout">
      <aside className="filter-column">
        <FilterPanel
          category={category}
          setCategory={setCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          rating={rating}
          setRating={setRating}
          availability={availability}
          setAvailability={setAvailability}
        />
      </aside>

      <div className="products-results">
        <div className="toolbar-row">
          <SearchBar value={search} onChange={setSearch} />
          <label className="sort-select">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
              <option value="rating">Highest rated</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        <div className="results-summary">
          <h2>Premium picks</h2>
          <span>{visibleProducts.length} products</span>
        </div>

        <ProductGrid products={visibleProducts} loading={loading} error={error} onReset={() => window.location.reload()} />
      </div>
    </div>
  )
}
