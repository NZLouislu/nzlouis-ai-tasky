import { encryptAPIKey, decryptAPIKey } from '@/lib/encryption';

describe('Encryption Service', () => {
  const testApiKey = 'test-api-key-12345';

  beforeAll(() => {
    process.env.AI_ENCRYPTION_KEY = '24bf1814a4e78643ff6a1d735327caf0c335947e32dd02108a9cfa6d1d155f61';
  });

  describe('encryptAPIKey', () => {
    it('should encrypt an API key', () => {
      const result = encryptAPIKey(testApiKey);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');
      expect(result.encrypted).toBeTruthy();
      expect(result.iv).toBeTruthy();
      expect(result.authTag).toBeTruthy();
    });

    it('should produce different encrypted values for same input', () => {
      const result1 = encryptAPIKey(testApiKey);
      const result2 = encryptAPIKey(testApiKey);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });
  });

  describe('decryptAPIKey', () => {
    it('should decrypt an encrypted API key', () => {
      const encrypted = encryptAPIKey(testApiKey);
      const decrypted = decryptAPIKey(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBe(testApiKey);
    });

    it('should handle different API keys', () => {
      const key1 = 'api-key-1';
      const key2 = 'api-key-2';

      const encrypted1 = encryptAPIKey(key1);
      const encrypted2 = encryptAPIKey(key2);

      const decrypted1 = decryptAPIKey(
        encrypted1.encrypted,
        encrypted1.iv,
        encrypted1.authTag
      );
      const decrypted2 = decryptAPIKey(
        encrypted2.encrypted,
        encrypted2.iv,
        encrypted2.authTag
      );

      expect(decrypted1).toBe(key1);
      expect(decrypted2).toBe(key2);
    });

    it('should throw error with invalid auth tag', () => {
      const encrypted = encryptAPIKey(testApiKey);

      expect(() => {
        decryptAPIKey(encrypted.encrypted, encrypted.iv, 'invalid-auth-tag');
      }).toThrow();
    });
  });

  describe('Security', () => {
    it('should use different IVs for each encryption', () => {
      const results = Array.from({ length: 10 }, () => encryptAPIKey(testApiKey));
      const ivs = results.map(r => r.iv);
      const uniqueIvs = new Set(ivs);

      expect(uniqueIvs.size).toBe(10);
    });

    it('should produce encrypted values that are different from original', () => {
      const encrypted = encryptAPIKey(testApiKey);

      expect(encrypted.encrypted).not.toContain(testApiKey);
    });
  });
});
