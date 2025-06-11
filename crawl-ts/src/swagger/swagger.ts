import swaggerJsdoc from'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API Documentation',
    },
  },
  apis: ['./src/controller/*.ts'], // Swagger JSDoc 주석 대상
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
