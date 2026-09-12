import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiEndpoint } from '../src/lib/apiConfig.js'

test('no configuration cannot silently select a server', () => {
  assert.throws(() => apiEndpoint('/api/contact', {}), /not connected/)
  assert.throws(() => apiEndpoint('/api/contact', { VITE_API_MODE: 'unknown' }))
})

test('same-origin preserves the API prefix and query exactly once', () => {
  for (const path of ['/api/contact', '/api/admin/session', '/api/availability?date=2026-09-09']) {
    assert.equal(apiEndpoint(path, { VITE_API_MODE: 'same-origin' }), path)
  }
  assert.throws(() => apiEndpoint('/api/contact', { VITE_API_MODE: 'same-origin', VITE_API_URL: 'https://old.example' }), /conflicting/)
})

test('explicit HTTPS and local testing addresses retain compatibility', () => {
  for (const base of ['https://studio.example', 'https://studio.example/', 'http://127.0.0.1:8000', 'http://localhost:8000/']) {
    assert.equal(apiEndpoint('/api/contact', { VITE_API_URL: base }), `${new URL(base).origin}/api/contact`)
  }
})

test('unsafe or prefix-doubling configurations are rejected without disclosing them', () => {
  for (const base of ['http://studio.example', '/api', '//studio.example', 'https://studio.example/api', 'https://secret@studio.example', 'https://studio.example/?secret=hidden', 'javascript:alert(1)']) {
    assert.throws(() => apiEndpoint('/api/contact', { VITE_API_URL: base }), error => !error.message.includes('secret'))
  }
  for (const path of ['//evil.example', '/api/../contact', '/api\\contact', '/contact', '/api/contact#secret']) {
    assert.throws(() => apiEndpoint(path, { VITE_API_MODE: 'same-origin' }))
  }
})
