export default function EmptyState({ title = 'No items found', message = 'Try another search or filter.', action, actionLabel = 'Reset' }) {
  return (
    <div className="state-card empty-state">
      <div className="state-icon">○</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? (
        <button type="button" className="primary-btn" onClick={action}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
