import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from './auth-context'

describe('useAuth', () => {
  it('fails clearly when used outside <AuthProvider>', () => {
    // React logs the thrown error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>')
  })
})
