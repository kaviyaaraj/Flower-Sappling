export default function LoadingSkeleton({ type = 'card' }) {
  if (type === 'detail') {
    return (
      <div className="skeleton-shell detail-skeleton">
        <div className="skeleton skeleton-image large" />
        <div className="skeleton-stack">
          <div className="skeleton skeleton-line w-80" />
          <div className="skeleton skeleton-line w-60" />
          <div className="skeleton skeleton-line w-40" />
          <div className="skeleton skeleton-line w-70" />
          <div className="skeleton skeleton-box" />
        </div>
      </div>
    )
  }

  return (
    <div className="product-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-line w-70" />
      <div className="skeleton skeleton-line w-50" />
      <div className="skeleton skeleton-line w-80" />
      <div className="skeleton skeleton-button" />
    </div>
  )
}
