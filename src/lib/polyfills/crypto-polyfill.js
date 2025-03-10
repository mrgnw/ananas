// Crypto polyfill using Web Crypto API
export function randomUUID() {
  // Implementation using Web Crypto API
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Format according to RFC4122 UUID v4
  return [
    array.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join(''),
    array.slice(4, 6).map(b => b.toString(16).padStart(2, '0')).join(''),
    // Set version to 4 (random UUID)
    ((array[6] & 0x0f) | 0x40).toString(16).padStart(2, '0') + array[7].toString(16).padStart(2, '0'),
    // Set variant
    ((array[8] & 0x3f) | 0x80).toString(16).padStart(2, '0') + array[9].toString(16).padStart(2, '0'),
    array.slice(10, 16).map(b => b.toString(16).padStart(2, '0')).join('')
  ].join('-');
}

// Export any other crypto functions you might need
export default { randomUUID };
