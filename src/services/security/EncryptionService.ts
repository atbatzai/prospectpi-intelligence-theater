/**
 * AES-256-GCM Encryption Service
 * Story 5.2: Security Hardening
 */

import crypto from 'crypto';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly TAG_LENGTH = 16;
  private readonly KEY: Buffer;

  constructor() {
    // Get encryption key from environment or generate random one
    const keyHex = process.env.ENCRYPTION_KEY;
    if (keyHex) {
      this.KEY = Buffer.from(keyHex, 'hex');
      if (this.KEY.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
      }
    } else {
      // Generate random key for development
      this.KEY = crypto.randomBytes(32);
      console.warn('WARNING: Using random encryption key. Set ENCRYPTION_KEY in production!');
    }
  }

  encrypt(plaintext: string): EncryptionResult {
    // Generate unique IV for each encryption
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    
    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.KEY,
        Buffer.from(iv, 'hex')
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - data may be tampered');
    }
  }

  encryptField(plaintext: string): string {
    const result = this.encrypt(plaintext);
    // Combine all components into single string for database storage
    return `${result.iv}:${result.authTag}:${result.encrypted}`;
  }

  decryptField(combined: string): string {
    const [iv, authTag, encrypted] = combined.split(':');
    if (!iv || !authTag || !encrypted) {
      throw new Error('Invalid encrypted field format');
    }
    return this.decrypt(encrypted, iv, authTag);
  }
}

export const encryptionService = new EncryptionService();
