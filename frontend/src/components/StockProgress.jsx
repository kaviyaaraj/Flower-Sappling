export default function StockProgress({ stock, total = 24 }) {
  const safeStock = Math.max(0, stock)
  const percent = safeStock === 0 ? 0 : Math.max(0, Math.min(100, (safeStock / total) * 100))

  return (
    <div className="stock-progress" aria-label="Stock remaining progress">
      <div className="stock-progress-bar">
        <span style={{ width: `${percent}%` }} />
      </div>
      <small>{safeStock > 0 ? `${safeStock} units left` : 'Sold out'}</small>
    </div>
  )
}
