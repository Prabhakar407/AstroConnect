import assert from 'node:assert/strict'
import test from 'node:test'
import { canSelectDate, todayInIndia, slotTimes, slotLabel, formatFee } from '../src/lib/bookingPolicy.js'

test('Indian date changes at Indian midnight, not the device timezone', () => {
  assert.equal(todayInIndia(new Date('2026-09-09T18:29:59Z')), '2026-09-09')
  assert.equal(todayInIndia(new Date('2026-09-09T18:30:00Z')), '2026-09-10')
})
test('Only valid, non-Sunday dates through day ten can be selected', () => {
  const now = new Date('2026-09-09T03:30:00Z')
  for (const date of ['2026-09-09', '2026-09-10', '2026-09-19']) assert.equal(canSelectDate(date, now), true)
  for (const date of ['2026-09-08', '2026-09-13', '2026-09-20', '2026-02-30', 'garbage']) assert.equal(canSelectDate(date, now), false)
})
test('All ten slots last half an hour and fees use Indian formatting', () => {
  assert.equal(slotTimes.length, 10)
  assert.equal(slotLabel('11:30'), '11:30 AM – 12:00 PM')
  assert.equal(slotLabel('17:30'), '5:30 PM – 6:00 PM')
  assert.equal(formatFee(1100000), '₹11,000')
  assert.equal(formatFee(310000), '₹3,100')
})
