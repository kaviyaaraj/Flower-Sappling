import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  if (user?.isLoggedIn) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.name.trim() || !form.email || !form.password) {
      setError('Please enter your name, email, and password.')
      return
    }

    login({
      id: 'u-101',
      name: form.name.trim(),
      email: form.email,
      isLoggedIn: true,
    })

    navigate('/')
  }

  return (
    <div className="login-page-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark login-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="brand-name login-brand-name">BloomNest</span>
            <small>Flower nursery</small>
          </div>
        </div>

        <div className="login-copy">
          <p className="eyebrow login-eyebrow">Welcome back</p>
          <h1>Sign in to shop fresh saplings</h1>
          <p>
            Enter your details to explore flower saplings and garden essentials.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Your name</span>
            <div className="input-wrap">
              <UserRound size={16} />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>
          </label>

          <label className="field-group">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>
          </label>

          <label className="field-group">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={16} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="primary-btn login-btn">
            Login to continue <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
