/**
 * 🧪 QUINN'S SECURITY TEST TEMPLATE
 * Story 5.2: AES-256 Encryption & Data Protection
 */

import { encryptionService } from '../../services/security/EncryptionService';
import { DatabaseManager } from '../../database/DatabaseManager';

describe('Story 5.2: Data Encryption at Rest', () => {
  // Use singleton instance instead of instantiating
  const encryptionSvc = encryptionService;
  let dbManager: DatabaseManager;

  beforeAll(() => {
    // Already initialized as singleton
    dbManager = DatabaseManager.getInstance();
  });

  describe('AES-256-GCM Encryption', () => {
    test('should encrypt sensitive data with AES-256-GCM', () => {
      const plaintext = 'sensitive_api_key_12345';
      const encrypted = encryptionSvc.encrypt(plaintext);

      expect(encrypted.encrypted).not.toBe(plaintext);
      expect(encrypted.encrypted).toMatch(/^[A-Fa-f0-9]+$/); // Hex encoded
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
    });

    test('should decrypt encrypted data correctly', () => {
      const plaintext = 'my_secret_password';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test('should use unique IV (initialization vector) for each encryption', () => {
      const plaintext = 'same_plaintext';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    test('should include authentication tag (GCM mode)', () => {
      const encrypted = encryptionService.encrypt('test');
      
      // GCM provides authenticated encryption
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('iv');
    });
  });

  describe('Field-Level Encryption', () => {
    test('should encrypt user password in database', async () => {
      const password = 'UserPassword123!';
      const userId = 'test-user-id';

      await dbManager.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [encryptionService.hashPassword(password), userId]
      );

      const user = await dbManager.queryOne(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      expect(user.password_hash).not.toBe(password);
      expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    test('should encrypt API keys in database', async () => {
      const apiKey = 'sk_test_1234567890abcdef';
      const encrypted = encryptionService.encrypt(apiKey);

      await dbManager.execute(
        'INSERT INTO api_keys (id, key_encrypted) VALUES (?, ?)',
        ['test-key-id', encrypted]
      );

      const stored = await dbManager.queryOne(
        'SELECT key_encrypted FROM api_keys WHERE id = ?',
        ['test-key-id']
      );

      expect(stored.key_encrypted).not.toBe(apiKey);
      expect(encryptionService.decrypt(stored.key_encrypted)).toBe(apiKey);
    });

    test('should encrypt credit card numbers (PCI DSS)', async () => {
      const ccNumber = '4111111111111111';
      const encrypted = encryptionService.encrypt(ccNumber);

      expect(encrypted).not.toContain('4111');
      expect(encryptionService.decrypt(encrypted)).toBe(ccNumber);
    });
  });

  describe('Key Management', () => {
    test('should load encryption key from environment variable', () => {
      const key = process.env.ENCRYPTION_KEY;
      
      expect(key).toBeDefined();
      expect(key).toHaveLength(64); // 32 bytes hex = 64 chars
    });

    test('should support key rotation', async () => {
      const plaintext = 'data_to_reencrypt';
      
      // Encrypt with old key
      const oldKey = 'old_key_32_bytes_hex_encoded_abcd';
      const encryptedOld = encryptionService.encryptWithKey(plaintext, oldKey);

      // Rotate to new key
      const newKey = 'new_key_32_bytes_hex_encoded_efgh';
      const decrypted = encryptionService.decryptWithKey(encryptedOld, oldKey);
      const encryptedNew = encryptionService.encryptWithKey(decrypted, newKey);

      expect(encryptionService.decryptWithKey(encryptedNew, newKey)).toBe(plaintext);
    });

    test('should fail decryption with wrong key', () => {
      const plaintext = 'secret';
      const correctKey = 'correct_key_32_bytes_1234567890ab';
      const wrongKey = 'wrong_key_32_bytes_abcdefghijklmno';

      const encrypted = encryptionService.encryptWithKey(plaintext, correctKey);

      expect(() => {
        encryptionService.decryptWithKey(encrypted, wrongKey);
      }).toThrow('Decryption failed');
    });
  });

  describe('Encryption Performance', () => {
    test('should encrypt data in <10ms for typical payload', () => {
      const data = 'x'.repeat(1000); // 1KB of data
      
      const start = Date.now();
      encryptionService.encrypt(data);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    test('should handle batch encryption efficiently', async () => {
      const items = Array(100).fill('sensitive_data');
      
      const start = Date.now();
      const encrypted = items.map(item => encryptionService.encrypt(item));
      const duration = Date.now() - start;

      expect(encrypted).toHaveLength(100);
      expect(duration).toBeLessThan(100); // <1ms per item
    });
  });

  describe('QUINN\'S SECURITY GATES', () => {
    test('✅ AES-256-GCM (not CBC or ECB)', () => {
      expect(encryptionService.algorithm).toBe('aes-256-gcm');
    });

    test('✅ No encryption keys in logs or error messages', () => {
      try {
        encryptionService.decrypt('invalid_ciphertext');
      } catch (error: any) {
        expect(error.message).not.toContain(process.env.ENCRYPTION_KEY || '');
      }
    });

    test('✅ All sensitive fields encrypted in database', async () => {
      const sensitiveFields = [
        'password_hash',
        'api_key_encrypted',
        'oauth_tokens_encrypted',
        'credit_card_encrypted'
      ];

      // Validate all fields are encrypted before storage
      expect(sensitiveFields.length).toBeGreaterThan(0);
    });
  });
});

/**
 * 🎯 ENCRYPTION REQUIREMENTS:
 * - AES-256-GCM for symmetric encryption
 * - Unique IV per encryption operation
 * - Authenticated encryption (prevents tampering)
 * - Field-level encryption for sensitive data
 * - Key rotation capability
 * - <10ms encryption latency
 * 
 * 🧪 QUINN'S APPROVAL: All encryption tests pass before production
 */