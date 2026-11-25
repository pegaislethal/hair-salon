function invalidResult(error, localNumber) {
  return {
    valid: false,
    normalized: null,
    localNumber,
    error,
  };
}

function getNepalPhoneInputValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\s-]/g, '');
  if (compact.startsWith('+977')) {
    return trimmed.replace(/^\+977[\s-]*/, '');
  }
  if (compact.startsWith('977') && compact.length > 10) {
    return trimmed.replace(/^977[\s-]*/, '');
  }
  return trimmed;
}

function normalizeNepalPhone(value) {
  if (typeof value !== 'string') {
    return invalidResult('Enter a 10-digit Nepal mobile number.', '');
  }

  const compact = value.trim().replace(/[\s-]/g, '');
  let localNumber = compact;
  if (compact.startsWith('+977')) {
    localNumber = compact.slice(4);
  } else if (compact.startsWith('977') && compact.length > 10) {
    localNumber = compact.slice(3);
  }

  if (!localNumber) {
    return invalidResult('Enter a 10-digit Nepal mobile number.', localNumber);
  }
  if (!/^\d+$/.test(localNumber)) {
    return invalidResult('Use digits only, with optional spaces or hyphens.', localNumber);
  }
  if (localNumber.length !== 10) {
    return invalidResult('Enter a 10-digit Nepal mobile number.', localNumber);
  }
  if (!/^(98|97)\d{8}$/.test(localNumber)) {
    return invalidResult('Nepal mobile numbers must start with 98 or 97.', localNumber);
  }

  return {
    valid: true,
    normalized: `+977${localNumber}`,
    localNumber,
    error: null,
  };
}

module.exports = { getNepalPhoneInputValue, normalizeNepalPhone };
