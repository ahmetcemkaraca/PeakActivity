// aw-webui/src/services/encryption/WebEncryptionWorker.ts

// Bu dosya doğrudan bir Web Worker olarak çalıştırılacaktır.
// Bu nedenle, modül bağımlılıkları doğrudan import edilmez,
// bunun yerine worker mesajları aracılığıyla veri alışverişi yapılır.

// WebCryptoService'i burada doğrudan import edemediğimiz için,
// şifreleme/şifre çözme mantığını doğrudan bu worker içinde uygulayacağız
// veya ana thread'den gerekli parametreleri alacağız.
// Şimdilik, Web Crypto API'yi doğrudan kullanacağız.

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

function generateRandomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

self.onmessage = async (event: MessageEvent) => {
  const { type, data, key, iv, id } = event.data;

  try {
    if (type === 'encrypt') {
      const encodedData = textEncoder.encode(data);
      const importedKey = await importKey(key);
      const ivBytes = base64ToBytes(iv);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
        },
        importedKey,
        encodedData
      );
      self.postMessage({
        id,
        status: 'completed',
        result: bytesToBase64(new Uint8Array(encrypted)),
      });
    } else if (type === 'decrypt') {
      const encryptedBytes = base64ToBytes(data);
      const importedKey = await importKey(key);
      const ivBytes = base64ToBytes(iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes,
        },
        importedKey,
        encryptedBytes
      );
      self.postMessage({ id, status: 'completed', result: textDecoder.decode(decrypted) });
    } else if (type === 'generateIv') {
      const iv = generateRandomBytes(16);
      self.postMessage({ id, status: 'completed', result: bytesToBase64(iv) });
    } else {
      self.postMessage({ id, status: 'error', error: 'Bilinmeyen işlem türü: ' + type });
    }
  } catch (error: any) {
    self.postMessage({ id, status: 'error', error: error.message });
  }
};
