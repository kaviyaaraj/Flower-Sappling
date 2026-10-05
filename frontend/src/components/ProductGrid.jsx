import ProductCard from './ProductCard'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

export default function ProductGrid({ products, loading, error, onReset }) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-wrapper">
        <EmptyState
          title="Products unavailable"
          message="The product feed is temporarily unavailable. Please retry in a moment."
          action={onReset}
          actionLabel="Reload"
        />
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="state-wrapper">
        <EmptyState title="No products match" message="Try a different keyword or reset your filters." />
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
