export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationRules {
  required?: boolean
  minLength?: number
  maxLength?: number
  email?: boolean
  password?: boolean
  pattern?: RegExp
}

export class FormValidator {
  static validateField(value: string, rules: ValidationRules): ValidationResult {
    const errors: string[] = []

    // Required validation
    if (rules.required && (!value || value.trim().length === 0)) {
      errors.push('This field is required')
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
      return { isValid: errors.length === 0, errors }
    }

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      errors.push('Must be at least ' + rules.minLength + ' characters long')
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push('Must be no more than ' + rules.maxLength + ' characters long')
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push('Please enter a valid email address')
      }
    }

    // Password validation
    if (rules.password) {
      if (value.length < 8) {
        errors.push('Password must be at least 8 characters long')
      }
      if (!/(?=.*[a-z])/.test(value)) {
        errors.push('Password must contain at least one lowercase letter')
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        errors.push('Password must contain at least one uppercase letter')
      }
      if (!/(?=.*\d)/.test(value)) {
        errors.push('Password must contain at least one number')
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push('Please enter a valid format')
    }

    return { isValid: errors.length === 0, errors }
  }

  static validateForm(data: Record<string, string>, rules: Record<string, ValidationRules>): {
    isValid: boolean
    errors: Record<string, string[]>
  } {
    const errors: Record<string, string[]> = {}
    let isValid = true

    Object.keys(rules).forEach(field => {
      const result = this.validateField(data[field] || '', rules[field])
      if (!result.isValid) {
        errors[field] = result.errors
        isValid = false
      }
    })

    return { isValid, errors }
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .trim()
  }

  static validatePasswordStrength(password: string): {
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score += 1
    else feedback.push('Use at least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Include lowercase letters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Include uppercase letters')

    if (/\d/.test(password)) score += 1
    else feedback.push('Include numbers')

    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Include special characters')

    if (password.length >= 12) score += 1

    return { score, feedback }
  }
}

// Email validation specifically for ProspectPI
export const validateBusinessEmail = (email: string): ValidationResult => {
  const result = FormValidator.validateField(email, { required: true, email: true })
  
  // Additional business email checks
  if (result.isValid) {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const domain = email.split('@')[1]?.toLowerCase()
    
    if (personalDomains.includes(domain)) {
      return {
        isValid: false,
        errors: ['Please use a business email address']
      }
    }
  }
  
  return result
}

// Organization name validation
export const validateOrganizationName = (name: string): ValidationResult => {
  const sanitized = FormValidator.sanitizeInput(name)
  
  if (sanitized !== name) {
    return {
      isValid: false,
      errors: ['Organization name contains invalid characters']
    }
  }
  
  return FormValidator.validateField(name, {
    required: true,
    minLength: 2,
    maxLength: 100
  })
}
