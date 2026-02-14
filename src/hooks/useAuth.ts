import { useCallback } from 'react'
import { supabase } from '../lib/supabase-browser'
import { useAuthStore } from '../stores/authStore'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

const API_BASE = '/api'

export function useAuth() {
  const { session, setSession, setFamilyId, logout: storeLogout } = useAuthStore()

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  }, [session])

  // Email + password registration
  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')

    // Exchange token_hash for a Supabase session
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    })

    if (otpError) throw new Error(otpError.message)

    if (otpData.session) {
      setSession(otpData.session)
      // Fetch family ID
      const { data: familyData } = await supabase
        .from('families')
        .select('family_id')
        .eq('user_id', otpData.session.user.id)
        .single()
      if (familyData) {
        setFamilyId(familyData.family_id)
      }
    }

    return otpData
  }, [setSession, setFamilyId])

  // Email + password login
  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)

    if (data.session) {
      setSession(data.session)
      const { data: familyData } = await supabase
        .from('families')
        .select('family_id')
        .eq('user_id', data.session.user.id)
        .single()
      if (familyData) {
        setFamilyId(familyData.family_id)
      }
    }

    return data
  }, [setSession, setFamilyId])

  // Passkey registration (requires authenticated user)
  const registerPasskey = useCallback(async (friendlyName?: string) => {
    // Get registration options from server
    const optionsRes = await fetch(`${API_BASE}/auth/passkey/register-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })

    const options = await optionsRes.json()
    if (!optionsRes.ok) throw new Error(options.error || options.message || 'Failed to get options')

    // Start browser WebAuthn registration ceremony
    const credential = await startRegistration({ optionsJSON: options })

    // Verify with server
    const verifyRes = await fetch(`${API_BASE}/auth/passkey/register-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ credential, friendlyName }),
    })

    const verifyData = await verifyRes.json()
    if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed')

    return verifyData
  }, [getAuthHeaders])

  // Passkey login
  const loginWithPasskey = useCallback(async (email: string) => {
    // Get authentication options
    const optionsRes = await fetch(`${API_BASE}/auth/passkey/login-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const options = await optionsRes.json()
    if (!optionsRes.ok) throw new Error(options.error || 'Failed to get options')

    // Start browser WebAuthn authentication ceremony
    const credential = await startAuthentication({ optionsJSON: options })

    // Verify with server
    const verifyRes = await fetch(`${API_BASE}/auth/passkey/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, credential }),
    })

    const verifyData = await verifyRes.json()
    if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed')

    // Exchange token_hash for a Supabase session
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: verifyData.token_hash,
      type: 'magiclink',
    })

    if (otpError) throw new Error(otpError.message)

    if (otpData.session) {
      setSession(otpData.session)
      const { data: familyData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', otpData.session.user.id)
        .single()
      if (familyData) {
        setFamilyId(familyData.family_id)
      }
    }

    return otpData
  }, [setSession, setFamilyId])

  const logout = useCallback(async () => {
    await storeLogout()
  }, [storeLogout])

  return {
    register,
    login,
    registerPasskey,
    loginWithPasskey,
    logout,
    getAuthHeaders,
  }
}
