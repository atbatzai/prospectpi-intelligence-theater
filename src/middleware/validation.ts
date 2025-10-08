/**
 * ProspectPI Intelligence Theater - Request Validation Utilities
 * Story 1.2: REST API Endpoints & Request Handling
 */

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

// Validation schemas
export const researchInputSchema = Joi.object({
  companyName: Joi.string().required().max(200).trim()
    .messages({
      'string.empty': 'Company name is required',
      'string.max': 'Company name must be less than 200 characters',
      'any.required': 'Company name is required'
    }),
  companyUrl: Joi.string().uri().optional()
    .messages({
      'string.uri': 'Company URL must be a valid URL'
    }),
  linkedinUrl: Joi.string().uri().pattern(/linkedin\.com\/company\//).optional()
    .messages({
      'string.uri': 'LinkedIn URL must be a valid URL',
      'string.pattern.base': 'LinkedIn URL must be a valid LinkedIn company URL'
    }),
  crmNotes: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'CRM notes must be less than 1000 characters'
    }),
  organizationFocus: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Organization focus must be less than 100 characters'
    }),
  locationOfInterest: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Location of interest must be less than 100 characters'
    }),
  contextLinks: Joi.array().items(Joi.string().uri()).max(5).optional()
    .messages({
      'array.max': 'Maximum 5 context links allowed',
      'string.uri': 'All context links must be valid URLs'
    }),
  additionalContext: Joi.string().max(2000).optional()
    .messages({
      'string.max': 'Additional context must be less than 2000 characters'
    })
});

export const validateResearchInput = (req: Request, _res: Response, next: NextFunction): void => {
  const { error, value } = researchInputSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    throw new CustomError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    );
  }

  req.body = value; // Use sanitized values
  next();
};