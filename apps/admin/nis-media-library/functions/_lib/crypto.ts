import { ApiError } from './http';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

export const sha256 = async (value: string): Promise<string> =>
  bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));

const encryptionKey = async (secret: string): Promise<CryptoKey> => {
  if (secret.length < 32) {
    throw new ApiError(503, 'drive_encryption_unconfigured', 'מפתח ההצפנה של Drive אינו מוגדר.');
  }
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt', 'encrypt']);
};

export const encryptSecret = async (value: string, secret: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(secret),
    encoder.encode(value),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
};

export const decryptSecret = async (value: string, secret: string): Promise<string> => {
  const [version, encodedIv, encodedCiphertext] = value.split('.');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext) {
    throw new ApiError(500, 'drive_token_invalid', 'חיבור Drive השמור אינו תקין.');
  }
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(encodedIv)) },
      await encryptionKey(secret),
      toArrayBuffer(base64ToBytes(encodedCiphertext)),
    );
    return decoder.decode(plaintext);
  } catch {
    throw new ApiError(500, 'drive_token_invalid', 'לא ניתן לפענח את חיבור Drive.');
  }
};
