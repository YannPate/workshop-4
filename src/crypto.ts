import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(base64, "base64")).buffer;
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private/public RSA keys
export async function generateRsaKeyPair(): Promise<{ publicKey: webcrypto.CryptoKey, privateKey: webcrypto.CryptoKey }> {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// Import a base64 string public key to its native format
export async function importPubKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "spki",
    binaryKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Import a base64 string private key to its native format
export async function importPrvKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(plainText: string, strPublicKey: string): Promise<string> {
  const publicKey = await importPubKey(strPublicKey);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plainText); // Encode as UTF-8 before encryption
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );
  return arrayBufferToBase64(encrypted);
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(data: string, privateKey: webcrypto.CryptoKey): Promise<string> {
  const encryptedData = base64ToArrayBuffer(data);
  const decrypted = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedData
  );
  return new TextDecoder().decode(decrypted);
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  const key = await webcrypto.subtle.generateKey(
    { name: "AES-CBC", length: 256 }, // Ensure AES-CBC is used for the test
    true, 
    ["encrypt", "decrypt"]
  );
  return key;
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "raw",
    binaryKey,
    { name: "AES-CBC" }, // Ensure AES-CBC consistency
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message using a symmetric key (AES-CBC)
export async function symEncrypt(key: webcrypto.CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const iv = webcrypto.getRandomValues(new Uint8Array(16)); // AES-CBC requires a 16-byte IV

  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encodedData
  );

  // Combine IV + Encrypted Data
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return arrayBufferToBase64(combined.buffer);
}

// Decrypt a message using a symmetric key (AES-CBC)
export async function symDecrypt(strKey: string, encryptedData: string): Promise<string> {
  const binaryKey = base64ToArrayBuffer(strKey);
  const key = await webcrypto.subtle.importKey("raw", binaryKey, { name: "AES-CBC" }, true, ["decrypt"]);

  const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // Extract IV (first 16 bytes) and Encrypted Data
  const iv = combined.slice(0, 16);
  const data = combined.slice(16);

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}