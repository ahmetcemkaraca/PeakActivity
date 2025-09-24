import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoUtils } from '../../../src/services/encryption/CryptoUtils';

// Türkçe açıklamalar eklendi

describe('CryptoUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Doğru uzunlukta rastgele IV üretmeli', () => {
    const iv = CryptoUtils.generateIv();
    expect(iv).toBeInstanceOf(Buffer);
    expect(iv.length).toBe(12); // GCM için 96 bit (12 byte)
  });

  it('Doğru uzunlukta rastgele AES anahtarı üretmeli', () => {
    const key = CryptoUtils.generateAesKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32); // AES-256 için 256 bit (32 byte)
  });

  it('Doğru uzunlukta rastgele HMAC anahtarı üretmeli', () => {
    const key = CryptoUtils.generateHmacKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32); // HMAC-SHA256 için 256 bit (32 byte)
  });

  it('String <-> Buffer dönüşümü doğru çalışmalı', () => {
    const testString = 'Merhaba Dünya!';
    const buffer = CryptoUtils.stringToBuffer(testString);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(CryptoUtils.bufferToString(buffer)).toBe(testString);
  });

  it('Buffer <-> base64 dönüşümü doğru çalışmalı', () => {
    const testBuffer = Buffer.from('Bu bir test bufferıdır.');
    const base64 = CryptoUtils.bufferToBase64(testBuffer);
    expect(typeof base64).toBe('string');
    expect(CryptoUtils.base64ToBuffer(base64)).toEqual(testBuffer);
  });

  it('SHA256 ile veri hashlenmeli', async () => {
    const data = 'test verisi';
    const hash = await CryptoUtils.sha256(data);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA256 çıktısı 64 karakter (32 byte) olmalı
  });

  it('Aynı veri için hash çıktısı tutarlı olmalı', async () => {
    const data = 'aynı veri';
    const hash1 = await CryptoUtils.sha256(data);
    const hash2 = await CryptoUtils.sha256(data);
    expect(hash1).toBe(hash2);
  });

  it('UUID üretmeli', () => {
    const uuid = CryptoUtils.generateUuid();
    expect(typeof uuid).toBe('string');
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
