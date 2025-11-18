import { encryptAPIKey, decryptAPIKey } from '@/lib/encryption';

process.env.AI_ENCRYPTION_KEY = '24bf1814a4e78643ff6a1d735327caf0c335947e32dd02108a9cfa6d1d155f61';

describe('Encryption Service', () => {
  const testApiKey = 'sk-test-1234567890abcdef';

  it('should encrypt and decrypt API key', () => {
    const { encrypted, iv, authTag } = encryptAPIKey(testApiKey);
    
    expect(encrypted).toBeDefined();
    expect(iv).toBeDefined();
    expect(authTag).toBeDefined();
    
    const decrypted = decryptAPIKey(encrypted, iv, authTag);
    expect(decrypted).toBe(testApiKey);
  });

  it('should produce different encrypted values for same input', () => {
    const result1 = encryptAPIKey(testApiKey);
    const result2 = encryptAPIKey(testApiKey);
    
    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);
  });

  it('should throw error with wrong auth tag', () => {
    const { encrypted, iv } = encryptAPIKey(testApiKey);
    const wrongAuthTag = 'wrong'.repeat(8);
    
    expect(() => {
      decryptAPIKey(encrypted, iv, wrongAuthTag);
    }).toThrow();
  });
});
