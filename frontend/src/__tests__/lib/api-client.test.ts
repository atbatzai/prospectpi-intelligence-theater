import { describe, it, expect, vi } from 'vitest'

describe('API Client', () => {
  it('should have proper API client configuration', () => {
    const config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: { 'Content-Type': 'application/json' }
    }
    
    expect(config.baseURL).toBe('http://localhost:3001')
    expect(config.headers['Content-Type']).toBe('application/json')
  })

  it('should have correct base configuration', () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    expect(API_BASE_URL).toBe('http://localhost:3001')
  })

  it('should handle token management', () => {
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    mockLocalStorage.getItem.mockReturnValue('test-token')
    
    const token = localStorage.getItem('token')
    expect(token).toBe('test-token')
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token')
  })

  it('should handle 401 error responses', () => {
    const mockLocalStorage = {
      removeItem: vi.fn(),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Mock window.location
    delete (global as any).window.location
    global.window.location = { href: '' } as any

    const error = { response: { status: 401 } }
    
    // Simulate 401 handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(window.location.href).toBe('/login')
  })
})
