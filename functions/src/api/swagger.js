const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PeakActivity API',
      version: '1.0.0',
      description: 'PeakActivity API Documentation',
      servers: [
        {
          url: 'https://api.peakactivity.com/v1',
          description: 'Production server'
        },
        {
          url: 'http://localhost:5001',
          description: 'Development server'
        }
      ],
      contact: {
        name: 'API Support',
        email: 'support@peakactivity.com'
      },
      license: {
        name: 'MPL-2.0',
        url: 'https://www.mozilla.org/en-US/MPL/2.0/'
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/api/routes/*.ts']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
