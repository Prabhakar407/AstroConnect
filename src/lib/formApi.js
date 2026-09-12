// Only an explicitly configured backend may receive customer information.
// A local/static preview must never silently submit to a legacy live server.
import { apiEndpoint } from './apiConfig'
import { createReceipt, readReceipt, rememberReceipt, forgetReceipt } from './requestReceipt'

export async function requestJson(path, payload, method = payload === undefined ? 'GET' : 'POST', options = {}) {
  const endpoint = apiEndpoint(path)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(endpoint, {
      method, signal: controller.signal,
      cache: 'no-store', redirect: 'error',
      headers: { ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data || typeof data !== 'object' || Array.isArray(data)) {
      const error = new Error(typeof data?.detail === 'string' ? data.detail : 'We could not confirm your request. Please try again or call the studio.')
      error.status = response.status
      error.uncertain = response.ok || response.status >= 500
      error.code = typeof data?.code === 'string' ? data.code : 'unconfirmed_response'
      error.fields = Array.isArray(data?.fields) ? data.fields.filter(field => typeof field === 'string') : []
      throw error
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      throw new Error('We could not confirm a response. Your details are still here; please retry or call +91 85277 90801.')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function sendVerification(email, purpose) {
  const data = await requestJson('/api/auth/send-otp', { email, purpose })
  if (data.success !== true) throw new Error('We could not send your verification email. Please try again.')
}

export async function submitInquiry(path, payload, reference) {
  const { verification_token, ...details } = payload
  const signature = JSON.stringify(details)
  if (reference.current?.uncertain && reference.current.signature !== signature) {
    throw new Error('The previous inquiry has not been confirmed. Keep its original details and retry, or call the studio before sending another.')
  }
  if (reference.current?.signature !== signature) {
    reference.current = { signature, ...(readReceipt(path) || createReceipt()) }
    rememberReceipt(path, reference.current)
  }
  const receipt = reference.current
  const options = { headers: { 'X-Astro-Receipt': receipt.secret } }
  let result
  const recover = async () => {
    const saved = await requestJson('/api/inquiry-status', { request_id: receipt.id }, 'POST', options)
    if (saved.status !== 'success' || typeof saved.inquiry_id !== 'string') throw new Error('The earlier inquiry could not be confirmed.')
    return saved
  }
  try {
    if (receipt.uncertain) {
      try { result = await recover() } catch { /* Retry only this same receipt if its status is still unknown. */ }
    }
    if (!result) result = await requestJson(path, { ...details, verification_token, request_id: receipt.id }, 'POST', options)
    if (result.status !== 'success' || typeof result.inquiry_id !== 'string') {
      throw new Error('Your inquiry could not be confirmed. Please retry or call the studio.')
    }
  } catch (error) {
    receipt.uncertain = !error.status || error.uncertain || error.status >= 500
    if (receipt.uncertain) {
      // A lost response can follow a successful save. Recover, never create another inquiry.
      result = null
      try { result = await recover() } catch { /* Preserve the original useful error. */ }
    }
    if (!result) throw error
  }
  receipt.uncertain = false
  forgetReceipt(path)
  return result
}
