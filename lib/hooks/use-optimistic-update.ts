import { useState, useCallback } from 'react'

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>,
  onError?: (error: Error, rollbackData: T) => void
) {
  const [data, setData] = useState<T>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const optimisticUpdate = useCallback(async (newData: T) => {
    const previousData = data
    setData(newData)
    setIsUpdating(true)
    setError(null)

    try {
      const result = await updateFn(newData)
      setData(result)
    } catch (err) {
      const error = err as Error
      setData(previousData)
      setError(error)
      onError?.(error, previousData)
    } finally {
      setIsUpdating(false)
    }
  }, [data, updateFn, onError])

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setIsUpdating(false)
  }, [initialData])

  return {
    data,
    optimisticUpdate,
    isUpdating,
    error,
    reset
  }
}

export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  updateFn: (items: T[]) => Promise<T[]>,
  onError?: (error: Error, rollbackItems: T[]) => void
) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const optimisticUpdate = useCallback(async (newItems: T[]) => {
    const previousItems = [...items]
    setItems(newItems)
    setIsUpdating(true)
    setError(null)

    try {
      const result = await updateFn(newItems)
      setItems(result)
    } catch (err) {
      const error = err as Error
      setItems(previousItems)
      setError(error)
      onError?.(error, previousItems)
    } finally {
      setIsUpdating(false)
    }
  }, [items, updateFn, onError])

  const addItem = useCallback((item: T) => {
    optimisticUpdate([...items, item])
  }, [items, optimisticUpdate])

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    optimisticUpdate(newItems)
  }, [items, optimisticUpdate])

  const removeItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id)
    optimisticUpdate(newItems)
  }, [items, optimisticUpdate])

  const reset = useCallback(() => {
    setItems(initialItems)
    setError(null)
    setIsUpdating(false)
  }, [initialItems])

  return {
    items,
    optimisticUpdate,
    addItem,
    updateItem,
    removeItem,
    isUpdating,
    error,
    reset
  }
}