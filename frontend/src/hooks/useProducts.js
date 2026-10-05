import { useCallback, useEffect, useState } from 'react'
import { getProducts, getInventoryBatch } from '../services/api'
import { sampleProducts } from '../data/mockData'

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Merge live inventory into a product list.
   * inventoryMap: { [productId]: availableQuantity }
   * Returns a new array — originals are not mutated.
   */
  const applyInventory = (productList, inventoryMap) => {
    if (!Object.keys(inventoryMap).length) return productList
    return productList.map((p) => {
      const id = p.id || p.productId
      if (inventoryMap[id] !== undefined) {
        return { ...p, stock: inventoryMap[id] }
      }
      return p
    })
  }

  /**
   * Refreshes live inventory for the current product list and merges it in.
   * Call this after a cart operation to keep the product grid in sync.
   */
  const refreshInventory = useCallback(async (currentProducts) => {
    const ids = currentProducts.map((p) => p.id || p.productId).filter(Boolean)
    if (!ids.length) return
    const inventoryMap = await getInventoryBatch(ids)
    setProducts((prev) => applyInventory(prev, inventoryMap))
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      try {
        const data = await getProducts()
        const list = data && data.length ? data : sampleProducts

        if (isMounted) {
          // First render: use whatever stock is on the product objects
          setProducts(list)
          setError(null)

          // Then fetch live inventory and overlay it
          const ids = list.map((p) => p.id || p.productId).filter(Boolean)
          const inventoryMap = await getInventoryBatch(ids)
          if (isMounted) {
            setProducts(applyInventory(list, inventoryMap))
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setProducts(sampleProducts)
          setError(requestError?.message || 'Unable to load products at the moment.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  return { products, setProducts, loading, error, refreshInventory }
}
