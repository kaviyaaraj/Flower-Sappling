export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-card error-state">
      <div className="state-icon">!</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}
