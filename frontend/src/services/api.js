import axios from 'axios'
import { sampleProducts } from '../data/mockData'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
})

const getErrorMessage = (status) => {
  if (status === 400) return 'Something went wrong while preparing your request.'
  if (status === 401) return 'Please sign in to continue.'
  if (status === 403) return 'Access restricted for this action.'
  if (status === 404) return 'The requested item could not be found.'
  if (status === 409) return 'Sorry! This item was just purchased by another shopper.'
  if (status === 429) return "You're making requests too quickly. Please wait a moment."
  if (status === 500) return 'We ran into an unexpected issue. Please retry.'
  if (status === 503) return 'Our service is temporarily busy. Please try again.'
  return 'A network issue interrupted the request. Please retry.'
}

export const normalizeError = (error) => {
  const status = error?.response?.status
  const message = getErrorMessage(status)

  return {
    status,
    message,
    raw: error,
  }
}

export const createIdempotencyKey = () => crypto.randomUUID()

export const getProducts = async (params = {}) => {
  try {
    const { data } = await api.get('/products', { params })
    return data.products || data
  } catch (error) {
    return sampleProducts
  }
}

export const getProduct = async (id) => {
  try {
    const { data } = await api.get(`/products/${id}`)
    return data.product || data
  } catch (error) {
    return sampleProducts.find((product) => product.id === id) || sampleProducts[0]
  }
}

export const reserveProduct = async (data, idempotencyKey) => {
  try {
    const response = await api.post('/reservations', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return response.data
  } catch (error) {
    const normalized = normalizeError(error)
    throw normalized
  }
}

export const createPayment = async (data, idempotencyKey) => {
  try {
    const response = await api.post('/payments', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return response.data
  } catch (error) {
    const normalized = normalizeError(error)
    throw normalized
  }
}

export const createOrder = async (data, idempotencyKey) => {
  try {
    const response = await api.post('/orders', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return response.data
  } catch (error) {
    const normalized = normalizeError(error)
    throw normalized
  }
}

export const getOrders = async (userId) => {
  try {
    const { data } = await api.get('/orders', { params: { userId } })
    return data.orders || data
  } catch (error) {
    return [
      {
        id: 'ORD-1024',
        date: '2026-10-05',
        amount: 24999,
        paymentStatus: 'PAID',
        status: 'Confirmed',
        product: 'Aether Pro X Headphones',
        quantity: 1,
      },
    ]
  }
}

/**
 * POST /api/cart
 * Adds an item to the backend cart AND validates against live inventory.
 * Returns { success, data: { items: [{ productId, quantity, availableQuantity, ... }], ... } }
 * or throws a normalised error with availableQuantity on 409.
 */
export const addToCartApi = async ({ userId, productId, quantity }) => {
  try {
    const response = await api.post('/cart', { userId, productId, quantity })
    return response.data
  } catch (err) {
    // err.response exists → backend is up and returned an error (e.g. 409 out of stock)
    // Re-throw so the caller (CartContext) can handle it properly.
    if (err?.response) {
      throw err
    }
    // No err.response → network-level failure (backend not running, CORS, timeout, etc.)
    // Return a sentinel so CartContext can fall back to local cart without an error toast.
    return { backendDown: true }
  }
}

/**
 * GET /api/inventory?productIds=p-1,p-2,...
 * Returns { success, inventory: { [productId]: availableQuantity } }
 * Used to overlay live stock onto the product list without re-fetching products.
 */
export const getInventoryBatch = async (productIds = []) => {
  try {
    const { data } = await api.get('/inventory', {
      params: { productIds: productIds.join(',') },
    })
    return data.inventory || {}
  } catch {
    return {}
  }
}

export default api
