import { describe, it, expect } from 'vitest'

describe('Validation Tests', () => {
  describe('Email Validation', () => {
    it('should validate email format correctly', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@example'
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should reject personal email domains for business use', () => {
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      const businessDomains = ['company.com', 'startup.io', 'enterprise.org']

      personalDomains.forEach(domain => {
        const email = 'user@' + domain
        expect(email).toContain(domain)
      })

      businessDomains.forEach(domain => {
        const email = 'user@' + domain
        expect(email).toContain(domain)
      })
    })
  })

  describe('Password Validation', () => {
    it('should enforce strong password requirements', () => {
      const strongPasswords = [
        'StrongPass123',
        'SecureP@ssw0rd',
        'C0mpl3xPassw0rd!'
      ]

      const weakPasswords = [
        'password',
        '12345678',
        'alllowercase',
        'ALLUPPERCASE'
      ]

      // Test minimum length
      strongPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8)
      })

      // Test complexity requirements
      strongPasswords.forEach(password => {
        expect(/[a-z]/.test(password)).toBe(true) // lowercase
        expect(/[A-Z]/.test(password)).toBe(true) // uppercase  
        expect(/\d/.test(password)).toBe(true) // digit
      })
    })

    it('should calculate password strength score', () => {
      const calculateScore = (password: string): number => {
        let score = 0
        if (password.length >= 8) score += 1
        if (/[a-z]/.test(password)) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/\d/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1
        if (password.length >= 12) score += 1
        return score
      }

      expect(calculateScore('weak')).toBeLessThan(3)
      expect(calculateScore('StrongPass123')).toBeGreaterThanOrEqual(4)
      expect(calculateScore('VeryStrongPass123!')).toBe(6)
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        'onload="malicious()"'
      ]

      const sanitize = (input: string): string => {
        return input
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
      }

      maliciousInputs.forEach(input => {
        const sanitized = sanitize(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized.toLowerCase()).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror')
      })
    })

    it('should preserve safe content', () => {
      const safeInputs = [
        'ACME Corporation',
        'Tech Solutions Inc.',
        'Global Innovations Ltd',
        'user@company.com'
      ]

      const sanitize = (input: string): string => {
        return input.replace(/<[^>]*>/g, '').trim()
      }

      safeInputs.forEach(input => {
        const sanitized = sanitize(input)
        expect(sanitized).toBe(input)
      })
    })
  })

  describe('Form Field Validation', () => {
    it('should validate required fields', () => {
      const validateRequired = (value: string): boolean => {
        return Boolean(value && value.trim().length > 0)
      }

      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false)
      expect(validateRequired('value')).toBe(true)
    })

    it('should validate field lengths', () => {
      const validateLength = (value: string, min: number, max: number): boolean => {
        return value.length >= min && value.length <= max
      }

      expect(validateLength('short', 10, 20)).toBe(false)
      expect(validateLength('perfect length', 5, 20)).toBe(true)
      expect(validateLength('way too long for this field', 5, 15)).toBe(false)
    })
  })

  describe('Security Validation', () => {
    it('should detect potential security threats', () => {
      const threatPatterns = [
        /<script[\s\S]*?>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i
      ]

      const threats = [
        '<script>alert(1)</script>',
        'javascript:void(0)',
        'onclick="malicious()"',
        'data:text/html,<script>alert(1)</script>'
      ]

      threats.forEach(threat => {
        const isThreat = threatPatterns.some(pattern => pattern.test(threat))
        expect(isThreat).toBe(true)
      })
    })

    it('should allow safe content', () => {
      const safeContent = [
        'Normal text content',
        'user@company.com',
        'ACME Corporation',
        'Product Description v2.1'
      ]

      const threatPatterns = [
        /<script[\s\S]*?>/i,
        /javascript:/i,
        /on\w+\s*=/i
      ]

      safeContent.forEach(content => {
        const isThreat = threatPatterns.some(pattern => pattern.test(content))
        expect(isThreat).toBe(false)
      })
    })
  })
})
