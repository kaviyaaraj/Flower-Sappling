import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search premium deals' }) {
  return (
    <label className="searchbar" aria-label="Search products">
      <Search size={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
