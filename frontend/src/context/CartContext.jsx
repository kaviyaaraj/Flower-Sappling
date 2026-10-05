import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { addToCartApi, normalizeError } from '../services/api'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [toasts, setToasts] = useState([])

  // stockOverrides: { [productId]: availableQuantity }
  // Written on every successful addToCart so ProductCard can show live numbers.
  const [stockOverrides, setStockOverrides] = useState({})

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const notify = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismissToast(id), 2600)
  }

  /**
   * addToCart — calls the backend POST /api/cart.
   *
   * The backend performs an atomic inventory soft-check:
   *   - If cart quantity + new quantity > availableQuantity → 409
   *   - Otherwise → cart updated, response includes availableQuantity
   *
   * On success the local cart state is updated from the backend response
   * so we never drift from the server.
   * stockOverrides is updated with the authoritative availableQuantity
   * returned by the backend so ProductCard re-renders with the real number.
   *
   * @param {object} product  — product object (must have .id and .name)
   * @param {number} quantity — units to add (default 1)
   * @param {string} userId   — authenticated user id
   */
  const addToCart = useCallback(async (product, quantity = 1, userId = 'u-101') => {
    try {
      const result = await addToCartApi({
        userId,
        productId: product.id || product.productId,
        quantity,
      })

      // ── Backend unreachable → fall back to local cart ──────────────────────
      // This keeps Add to Cart working even when the backend server is offline.
      // Inventory enforcement will fire at checkout (reservation step).
      if (result?.backendDown) {
        setCart((current) => {
          const existing = current.find((item) => item.id === (product.id || product.productId))
          if (existing) {
            return current.map((item) =>
              item.id === (product.id || product.productId)
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          }
          return [...current, { ...product, quantity }]
        })
        notify(`${product.name} added to cart`, 'success')
        return
      }
      // ── End fallback ────────────────────────────────────────────────────────

      if (!result.success) {
        notify(result.message || 'Could not add to cart', 'error')
        return
      }

      // Update local cart from backend response
      const backendItems = result.data?.items || []
      setCart((current) => {
        const backendMap = {}
        for (const item of backendItems) {
          backendMap[item.productId] = item
        }

        const existing = current.find(
          (item) => item.id === (product.id || product.productId),
        )

        if (existing) {
          return current.map((item) => {
            const key = item.id || item.productId
            if (backendMap[key]) {
              return { ...item, quantity: backendMap[key].quantity }
            }
            return item
          })
        }

        return [...current, { ...product, quantity }]
      })

      // Update live stock overrides from the backend response
      const newOverrides = {}
      for (const item of backendItems) {
        if (item.availableQuantity !== undefined) {
          newOverrides[item.productId] = item.availableQuantity
        }
      }
      if (Object.keys(newOverrides).length > 0) {
        setStockOverrides((prev) => ({ ...prev, ...newOverrides }))
      }

      notify(`${product.name} added to cart`, 'success')
    } catch (err) {
      const normalized = normalizeError(err)

      // 409 = out of stock or insufficient inventory (backend is up, hard rejection)
      if (normalized.status === 409) {
        const available = err?.response?.data?.availableQuantity ?? 0
        const msg =
          available === 0
            ? `${product.name} is out of stock`
            : `Only ${available} unit(s) left for ${product.name}`
        notify(msg, 'error')

        // Update stockOverrides so the card immediately shows the real number
        if (err?.response?.data?.availableQuantity !== undefined) {
          setStockOverrides((prev) => ({
            ...prev,
            [product.id || product.productId]: available,
          }))
        }
        return
      }

      // Any other backend error
      notify(normalized.message || 'Could not add to cart', 'error')
    }
  }, [])

  const updateQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    )
  }

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const value = useMemo(
    () => ({
      cart,
      toasts,
      itemCount,
      subtotal,
      stockOverrides,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      dismissToast,
      notify,
    }),
    [cart, subtotal, itemCount, toasts, stockOverrides, addToCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
