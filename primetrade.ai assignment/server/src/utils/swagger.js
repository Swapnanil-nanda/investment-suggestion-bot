const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrimeTrade.ai REST API — Documentation',
      version: '1.0.0',
      description: 'A scalable REST API with JWT Authentication, Role-Based Access Control (RBAC), and Product CRUD capabilities.',
      contact: {
        name: 'Swapnanil Nanda',
        email: 'swapnanilnanda@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '665bb7429df273ab32f913d8' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            id: { type: 'string', example: '665bb7b99df273ab32f913e2' },
            name: { type: 'string', example: 'Bitcoin Trading Notebook' },
            description: { type: 'string', example: 'Premium leather notebook for chart patterns.' },
            price: { type: 'number', example: 19.99 },
            category: { type: 'string', enum: ['electronics', 'clothing', 'food', 'other'], example: 'other' },
            stock: { type: 'number', example: 100 },
            createdBy: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message description' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please enter a valid email address' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/v1/*.js', './src/routes/*.js', './src/utils/swaggerDocs.js'], // Scan routes and a separate doc file for detailed endpoint specs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
