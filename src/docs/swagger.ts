/**
 * ProspectPI Intelligence Theater - OpenAPI Documentation
 * Story 1.2: REST API Endpoints & Request Handling
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProspectPI Intelligence Theater API',
      version: '1.0.0',
      description: 'REST API for ProspectPI Intelligence Theater - Three-Agent Orchestration System',
      contact: {
        name: 'ProspectPI Development Team',
        email: 'dev@prospectpi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.prospectpi.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        ProspectResearchInput: {
          type: 'object',
          required: ['companyName'],
          properties: {
            companyName: {
              type: 'string',
              maxLength: 200,
              description: 'Name of the company to research',
              example: 'OpenAI'
            },
            companyUrl: {
              type: 'string',
              format: 'uri',
              description: 'Optional company website URL',
              example: 'https://openai.com'
            },
            linkedinUrl: {
              type: 'string',
              format: 'uri',
              pattern: 'linkedin\\.com\\/company\\/',
              description: 'Optional LinkedIn company profile URL',
              example: 'https://linkedin.com/company/openai'
            },
            crmNotes: {
              type: 'string',
              maxLength: 1000,
              description: 'Optional CRM notes about the company',
              example: 'Interested in AI integration, decision maker: CTO'
            },
            organizationFocus: {
              type: 'string',
              maxLength: 100,
              description: 'Specific department or focus area within organization',
              example: 'AI Research Division'
            },
            locationOfInterest: {
              type: 'string',
              maxLength: 100,
              description: 'Geographic location of interest',
              example: 'San Francisco HQ'
            },
            contextLinks: {
              type: 'array',
              maxItems: 5,
              items: {
                type: 'string',
                format: 'uri'
              },
              description: 'Optional array of relevant URLs for context',
              example: ['https://news.com/openai-funding']
            },
            additionalContext: {
              type: 'string',
              maxLength: 2000,
              description: 'Additional context or specific research requirements',
              example: 'Focus on competitive analysis vs Google and Microsoft AI initiatives'
            }
          }
        },
        ResearchApiResponse: {
          type: 'object',
          required: ['success', 'requestId', 'status'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true
            },
            requestId: {
              type: 'string',
              pattern: '^req_[a-f0-9]{12}$',
              description: 'Unique identifier for the research request',
              example: 'req_abc123def456'
            },
            status: {
              type: 'string',
              enum: ['processing', 'complete', 'error'],
              description: 'Current status of the research request',
              example: 'processing'
            },
            estimatedCompletion: {
              type: 'integer',
              description: 'Estimated completion time in seconds',
              example: 480
            },
            websocketUrl: {
              type: 'string',
              format: 'uri',
              description: 'WebSocket URL for real-time progress updates',
              example: 'ws://localhost:3001/ws?requestId=req_abc123def456'
            },
            message: {
              type: 'string',
              description: 'Human-readable status message',
              example: 'Research request accepted. Connect to WebSocket for real-time updates.'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code for programmatic handling',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'Request validation failed'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-08T07:00:00.000Z'
            },
            service: {
              type: 'string',
              example: 'ProspectPI Intelligence Theater API'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Request validation failed'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'companyName'
                      },
                      message: {
                        type: 'string',
                        example: 'Company name is required'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API server',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/research/generate-dossier': {
        post: {
          tags: ['Research'],
          summary: 'Generate intelligence dossier',
          description: 'Initiates a comprehensive intelligence research request using the Three-Agent Orchestration System',
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProspectResearchInput'
                },
                examples: {
                  basic: {
                    summary: 'Basic research request',
                    value: {
                      companyName: 'OpenAI'
                    }
                  },
                  comprehensive: {
                    summary: 'Comprehensive research request',
                    value: {
                      companyName: 'OpenAI',
                      companyUrl: 'https://openai.com',
                      linkedinUrl: 'https://linkedin.com/company/openai',
                      crmNotes: 'Potential AI integration partner, decision window Q1 2026',
                      organizationFocus: 'AI Research Division',
                      locationOfInterest: 'San Francisco HQ',
                      contextLinks: [
                        'https://techcrunch.com/openai-funding',
                        'https://blog.openai.com/latest-models'
                      ],
                      additionalContext: 'Focus on GPT-4 capabilities and competitive positioning vs Anthropic Claude'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Research request accepted and processing',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ResearchApiResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Validation error in request payload',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError'
                  }
                }
              }
            },
            '401': {
              description: 'Authentication required'
            },
            '429': {
              description: 'Rate limit exceeded (10 requests per minute)',
              headers: {
                'Retry-After': {
                  description: 'Seconds to wait before retry',
                  schema: {
                    type: 'integer'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/**/*.ts', './src/server.ts'],
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };