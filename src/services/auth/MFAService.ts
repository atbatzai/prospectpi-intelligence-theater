/**
 * Multi-Factor Authentication Service
 * Story 5.1: Enterprise Authentication
 */

import * as crypto from 'crypto';
import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

// TOTP Implementation (Time-based One-Time Password)
class TOTPService {
  private readonly TOTP_WINDOW = 30; // 30 seconds
  private readonly TOTP_DIGITS = 6;

  generateSecret(): string {
    // Generate 20 random bytes and convert to hex (base32 alternative for now)
    // TODO: Install base32-encode library for true base32 encoding
    return crypto.randomBytes(20).toString('hex').toUpperCase();
  }

  generateTOTP(secret: string, time?: number): string {
    const epoch = Math.floor((time || Date.now()) / 1000);
    const counter = Math.floor(epoch / this.TOTP_WINDOW);
    
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    
    // Use hex encoding instead of base32 for now
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    );
    
    const otp = binary % Math.pow(10, this.TOTP_DIGITS);
    return otp.toString().padStart(this.TOTP_DIGITS, '0');
  }

  verifyTOTP(secret: string, token: string): boolean {
    const now = Date.now();
    
    // Check current window
    if (this.generateTOTP(secret, now) === token) {
      return true;
    }
    
    // Check previous window (time skew tolerance)
    if (this.generateTOTP(secret, now - this.TOTP_WINDOW * 1000) === token) {
      return true;
    }
    
    // Check next window (time skew tolerance)
    if (this.generateTOTP(secret, now + this.TOTP_WINDOW * 1000) === token) {
      return true;
    }
    
    return false;
  }

  generateQRCode(secret: string, email: string, issuer: string = 'ProspectPI'): string {
    const otpauthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
    return otpauthUrl;
  }
}

class MFAService {
  private dbManager: DatabaseManager;
  private totpService: TOTPService;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.totpService = new TOTPService();
    // Don't call async in constructor - call init() explicitly when needed
  }

  async init(): Promise<void> {
    await this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    await this.dbManager.execute(`
      CREATE TABLE IF NOT EXISTS mfa_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        method TEXT NOT NULL,
        secret TEXT NOT NULL,
        backup_codes TEXT,
        enabled BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        verified_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  async setupTOTP(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    // Ensure table exists
    await this.initializeDatabase();
    
    // Get user email
    const user = await this.dbManager.get('SELECT email FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate TOTP secret
    const secret = this.totpService.generateSecret();
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store MFA settings (not enabled yet - requires verification)
    await this.dbManager.execute(`
      INSERT INTO mfa_settings (id, user_id, method, secret, backup_codes, enabled)
      VALUES (?, ?, 'totp', ?, ?, 0)
      ON CONFLICT (user_id) DO UPDATE SET
        secret = excluded.secret,
        backup_codes = excluded.backup_codes,
        enabled = 0,
        verified_at = NULL
    `, [uuidv4(), userId, secret, JSON.stringify(backupCodes)]);

    // Generate QR code URL
    const qrCodeUrl = this.totpService.generateQRCode(secret, user.email);

    return { secret, qrCodeUrl, backupCodes };
  }

  async verifyAndEnableTOTP(userId: string, token: string): Promise<boolean> {
    const mfa = await this.dbManager.get(
      'SELECT secret FROM mfa_settings WHERE user_id = ? AND method = "totp"',
      [userId]
    );

    if (!mfa) {
      throw new Error('MFA not set up for this user');
    }

    // Verify TOTP token
    const isValid = this.totpService.verifyTOTP(mfa.secret, token);
    
    if (isValid) {
      // Enable MFA
      await this.dbManager.execute(
        'UPDATE mfa_settings SET enabled = 1, verified_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [userId]
      );
    }

    return isValid;
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const mfa = await this.dbManager.get(
      'SELECT secret, enabled FROM mfa_settings WHERE user_id = ? AND method = "totp"',
      [userId]
    );

    if (!mfa || !mfa.enabled) {
      return false;
    }

    return this.totpService.verifyTOTP(mfa.secret, token);
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const mfa = await this.dbManager.get(
      'SELECT backup_codes FROM mfa_settings WHERE user_id = ? AND enabled = 1',
      [userId]
    );

    if (!mfa || !mfa.backup_codes) {
      return false;
    }

    const backupCodes = JSON.parse(mfa.backup_codes);
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await this.dbManager.execute(
      'UPDATE mfa_settings SET backup_codes = ? WHERE user_id = ?',
      [JSON.stringify(backupCodes), userId]
    );

    return true;
  }

  async isMFAEnabled(userId: string): Promise<boolean> {
    const mfa = await this.dbManager.get(
      'SELECT enabled FROM mfa_settings WHERE user_id = ?',
      [userId]
    );
    return mfa?.enabled === 1;
  }

  async disableMFA(userId: string): Promise<void> {
    await this.dbManager.execute(
      'DELETE FROM mfa_settings WHERE user_id = ?',
      [userId]
    );
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const mfaService = new MFAService();
export { TOTPService };
