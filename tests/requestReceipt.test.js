import assert from 'node:assert/strict'
import test from 'node:test'
import { createReceipt, readReceipt, rememberReceipt, forgetReceipt } from '../src/lib/requestReceipt.js'
import { dateInPolicy, validatePolicy, slotTimes } from '../src/lib/bookingPolicy.js'

test('receipt uses independent random UUID and 256-bit secret', () => {
  const a = createReceipt(), b = createReceipt()
  assert.match(a.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.match(a.secret, /^[a-f0-9]{64}$/)
  assert.notEqual(a.secret, b.secret)
  assert.notEqual(a.id, b.id)
})

test('browser storage contains only receipt identifiers, never draft data', () => {
  const values = new Map()
  globalThis.sessionStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  const receipt = createReceipt()
  rememberReceipt('contact', { ...receipt, signature: 'private notes', verification_token: 'private code' })
  assert.deepEqual(readReceipt('contact'), receipt)
  assert.equal([...values.values()].join('').includes('private'), false)
  forgetReceipt('contact')
  assert.equal(readReceipt('contact'), null)
  delete globalThis.sessionStorage
})

test('blocked browser storage does not discard in-memory receipt', () => {
  const receipt = createReceipt()
  rememberReceipt('booking', receipt)
  assert.equal(readReceipt('booking'), null)
  assert.match(receipt.secret, /^[a-f0-9]{64}$/)
})

test('calendar uses server horizon and rejects unknown policy, not device date', () => {
  const policy = { first_date: '2026-09-09', last_date: '2026-09-19', server_now: '2026-09-09T03:30:00Z', timezone: 'Asia/Kolkata', duration_minutes: 30, slot_times: slotTimes }
  assert.equal(validatePolicy(policy), policy)
  for (const day of ['2026-09-09', '2026-09-19']) assert.equal(dateInPolicy(day, policy), true)
  for (const day of ['2026-09-08', '2026-09-13', '2026-09-20', '2026-02-30']) assert.equal(dateInPolicy(day, policy), false)
  assert.equal(dateInPolicy('2026-09-09', null), false)
  assert.throws(() => validatePolicy({ ...policy, server_now: 'invalid' }))
  assert.throws(() => validatePolicy({ ...policy, slot_times: ['12:00'] }))
})
