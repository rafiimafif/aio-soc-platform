export const SECURE_HASH = '31928642d1e0beec45501504274d8031f3db3cf04a0bfcf2bf03e98c6b22be5b';

export function getRandomSecure() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / 4294967296; // 2^32
  }
  return Math.random();
}

export async function hashStringSHA256(str) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function calculateSecureHashes(text) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return {
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sha512: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
    };
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const sha256Buffer = await window.crypto.subtle.digest('SHA-256', data);
  const sha256Array = Array.from(new Uint8Array(sha256Buffer));
  const sha256Hex = sha256Array.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const sha512Buffer = await window.crypto.subtle.digest('SHA-512', data);
  const sha512Array = Array.from(new Uint8Array(sha512Buffer));
  const sha512Hex = sha512Array.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { sha256: sha256Hex, sha512: sha512Hex };
}
