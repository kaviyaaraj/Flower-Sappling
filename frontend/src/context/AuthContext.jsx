import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'u-101',
    name: '',
    email: '',
    isLoggedIn: false,
  })

  const value = useMemo(
    () => ({
      user,
      login: (nextUser) => setUser({ ...nextUser, isLoggedIn: true }),
      logout: () => setUser((current) => ({ ...current, isLoggedIn: false })),
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
