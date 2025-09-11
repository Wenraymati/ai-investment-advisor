const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Variables de prueba
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Investment Advisor API funcionando!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Variable configurada' : 'Variable NO configurada'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Investment Advisor',
    database: process.env.DATABASE_URL ? 'URL disponible' : 'URL no disponible'
  });
});

// Ruta de prueba para registro (sin base de datos)
app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body;
  
  res.json({
    message: 'Registro simulado exitoso',
    user: { email, name, subscription_plan: 'free' },
    note: 'Base de datos pendiente de configurar'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 Variables: DATABASE_URL=${process.env.DATABASE_URL ? 'OK' : 'FALTA'}`);
});

module.exports = app;
