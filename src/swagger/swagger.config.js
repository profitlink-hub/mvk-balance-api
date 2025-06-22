const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MVK Balance API',
      version: '1.0.0',
      description: 'Sistema completo para gerenciamento de balança com Arduino, desenvolvido em Node.js seguindo arquitetura em camadas.',
      contact: {
        name: 'MVK Team',
        email: 'support@mvk.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.mvk.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        ClientAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-client-id',
          description: 'Client ID para autenticação'
        },
        ClientSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'x-client-secret',
          description: 'Client Secret para autenticação'
        }
      },
      schemas: {
        // Esquemas de resposta padrão
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string'
            },
            system: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                version: {
                  type: 'string',
                  example: '1.0.0'
                },
                service: {
                  type: 'string',
                  example: 'mvk-balance-api'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            system: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                version: {
                  type: 'string',
                  example: '1.0.0'
                },
                service: {
                  type: 'string',
                  example: 'mvk-balance-api'
                }
              }
            }
          }
        },
        // Esquemas de dados específicos
        Client: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            clientId: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            weight: {
              type: 'number',
              format: 'float'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        WeightReading: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            productName: {
              type: 'string'
            },
            weight: {
              type: 'number',
              format: 'float'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Esquemas para Arduino
        WeightMovementSingle: {
          type: 'object',
          required: ['nome', 'peso', 'acao', 'ts'],
          properties: {
            nome: {
              type: 'string',
              description: 'Nome do produto',
              example: 'cerveja'
            },
            peso: {
              type: 'number',
              format: 'float',
              description: 'Peso do produto em gramas',
              example: 335.1
            },
            acao: {
              type: 'string',
              enum: ['RETIRADO', 'COLOCADO'],
              description: 'Ação realizada na balança',
              example: 'RETIRADO'
            },
            ts: {
              type: 'integer',
              description: 'Timestamp em milissegundos',
              example: 214022
            }
          }
        },
        WeightMovementMultiple: {
          type: 'object',
          required: ['acao', 'quantidade', 'produtos', 'ts'],
          properties: {
            acao: {
              type: 'string',
              enum: ['RETIRADOS', 'COLOCADOS'],
              description: 'Ação realizada na balança',
              example: 'COLOCADOS'
            },
            quantidade: {
              type: 'integer',
              description: 'Quantidade de produtos',
              example: 3
            },
            produtos: {
              type: 'array',
              items: {
                type: 'object',
                required: ['nome', 'peso', 'id'],
                properties: {
                  nome: {
                    type: 'string',
                    example: 'cerveja'
                  },
                  peso: {
                    type: 'number',
                    format: 'float',
                    example: 347.0
                  },
                  id: {
                    type: 'integer',
                    example: 0
                  }
                }
              }
            },
            ts: {
              type: 'integer',
              description: 'Timestamp em milissegundos',
              example: 188787
            }
          }
        }
      }
    },
    security: [
      {
        ClientAuth: [],
        ClientSecret: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação'
      },
      {
        name: 'Products',
        description: 'Gerenciamento de produtos'
      },
      {
        name: 'Weight',
        description: 'Leituras e estatísticas de peso'
      },
      {
        name: 'Arduino',
        description: 'Comunicação com Arduino'
      },
      {
        name: 'System',
        description: 'Informações do sistema'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/server.js'
  ]
}

module.exports = swaggerJsdoc(options) 