/**
 * End-to-End Encryption (E2EE) Utility
 * 
 * Provides cryptographic functions to encrypt/decrypt chat messages
 * using the browser's native Web Crypto API (SubtleCrypto).
 * 
 * AES-GCM 256-bit encryption is used for authenticated encryption.
 * Keys are derived from the Room ID and an optional password using PBKDF2.
 */

const ALGO = 'AES-GCM';

/**
 * Derives a cryptographic key from a room secret.
 * @param {string} roomId 
 * @param {string} password 
 */
export async function deriveRoomKey(roomId, password = '') {
  const enc = new TextEncoder();
  const salt = enc.encode(`wavemeet-v1-${roomId}`); // Domain separation
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(roomId + password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plain text message.
 * Returns an object containing the base64 encoded ciphertext and IV.
 */
export async function encryptData(text, key) {
  if (!text || !key) return text;
  try {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(text)
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      isEncrypted: true
    };
  } catch (e) {
    console.error('[CRYPTO] Encryption failed:', e);
    return text;
  }
}

/**
 * Decrypts an encrypted message object.
 * Falls back to returning the original content if decryption fails.
 */
export async function decryptData(encryptedObj, key) {
  if (!encryptedObj || typeof encryptedObj !== 'object' || !encryptedObj.isEncrypted || !key) {
    return typeof encryptedObj === 'string' ? encryptedObj : (encryptedObj?.message || '');
  }

  try {
    const { ciphertext, iv } = encryptedObj;
    const dec = new TextDecoder();
    
    // Convert base64 back to Uint8Array
    const cipherBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: ivBuffer },
      key,
      cipherBuffer
    );

    return dec.decode(decrypted);
  } catch (e) {
    console.warn('[CRYPTO] Decryption failed, possibly due to wrong key or tampering.');
    return '🔒 [Encrypted Message]';
  }
}
