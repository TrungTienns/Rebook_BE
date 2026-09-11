require('dotenv').config();
const app = require('./app');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const PORT = process.env.PORT || 5000;

const { connectDB } = require('./config/db');

const startServer = async () => {
  try {
    await connectDB();

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
