const assert = require('node:assert/strict');
const test = require('node:test');
const { getNepalPhoneInputValue, normalizeNepalPhone } = require('./nepalPhone');

test('normalizes local and international Nepal mobile numbers to E.164', () => {
  assert.deepEqual(normalizeNepalPhone('9812345678'), {
    valid: true,
    normalized: '+9779812345678',
    localNumber: '9812345678',
    error: null,
  });
  assert.equal(normalizeNepalPhone('+977 97-1234 5678').normalized, '+9779712345678');
  assert.equal(normalizeNepalPhone('977-9812345678').normalized, '+9779812345678');
  assert.equal(normalizeNepalPhone('9771234567').normalized, '+9779771234567');
});

test('rejects invalid length, prefix, and non-numeric characters', () => {
  for (const phone of ['981234567', '9612345678', '98123456789', '98abc45678']) {
    assert.equal(normalizeNepalPhone(phone).valid, false, phone);
  }
});

test('removes a pasted Nepal country code from the country-prefixed input', () => {
  assert.equal(getNepalPhoneInputValue('+977 98-1234 5678'), '98-1234 5678');
  assert.equal(getNepalPhoneInputValue('9779812345678'), '9812345678');
  assert.equal(getNepalPhoneInputValue('9771234567'), '9771234567');
});
