import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  return (
    <div className="quantity-selector" aria-label="Select quantity">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={14} />
      </button>
    </div>
  )
}
