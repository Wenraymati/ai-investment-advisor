require('dotenv').config(); // Carga .env al inicio
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const natural = require('natural');
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null; // Fallback si no hay clave

// Configuración de DB con fallback
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes, intenta más tarde.'
}));

// Logs de variables
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'NO configurada');
console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Configurada' : 'NO configurada');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Configurada' : 'NO configurada');

// Autenticación middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Función para detectar idioma
function detectLanguage(message) {
  const spanishKeywords = ['acciones', 'inversión', 'mercado', 'bitcoin', 'tesla'];
  return spanishKeywords.some(word => message.toLowerCase().includes(word)) ? 'es' : 'en';
}

// Función para datos en vivo
async function fetchMarketData(symbol) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) return `Datos no disponibles para ${symbol}.`;
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    const data = await response.json();
    return data['Global Quote'] ? `Precio: $${data['Global Quote']['05. price']}` : `No datos para ${symbol}.`;
  } catch (error) {
    return `Error en datos para ${symbol}.`;
  }
}

// Clasificar consultas
function classifyQuery(message) {
  const classifier = new natural.BayesClassifier();
  classifier.addDocument('acciones nvidia tesla microsoft google', 'stocks');
  classifier.addDocument('bitcoin crypto eth', 'crypto');
  classifier.addDocument('fed intereses inflación', 'macro');
  classifier.train();
  return classifier.classify(message.toLowerCase());
}

// Respuesta dinámica con fallback
function generateDynamicResponse(message, subscriptionPlan) {
  const lowerMessage = message.toLowerCase();
  const isPremium = subscriptionPlan === 'premium';
  const responses = {
    nvidia: `NVIDIA: Líder en IA. ${isPremium ? 'Entrada: $350-$380' : 'Actualiza a premium.'}`,
    // Agrega más como antes...
    default: `Análisis de "${message}": Mercado IA en maduración. ${isPremium ? 'Premium info.' : 'Actualiza.'}`
  };
  for (const [key, response] of Object.entries(responses)) {
    if (key !== 'default' && lowerMessage.includes(key)) return response;
  }
  return responses.default;
}

// Llamada a Claude con fallback
async function callClaudeAPI(userMessage, subscriptionPlan) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Claude no configurado');
  const category = classifyQuery(userMessage);
  const marketData = await fetchMarketData(category === 'stocks' ? userMessage.split(' ')[0].toUpperCase() : 'BTCUSD');
  const language = detectLanguage(userMessage);
  // Código de fetch como antes...
  // (Mantengo el prompt anterior, pero lo omito por brevedad)
}

// Rutas (completo como antes, con hashing en register/login)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Campos requeridos' });
    if (password.length < 8) return res.status(400).json({ error: 'Contraseña mínimo 8 chars' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      const result = await client.query('INSERT INTO users (...) VALUES (...)', [email, name, hashedPassword, 'free']);
      // Generar token como antes
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Añade más rutas como /login (con bcrypt.compare), /chat, /analyze-portfolio, etc.

// Inicialización
const startServer = async () => {
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('CREATE TABLE IF NOT EXISTS users (...)');
      console.log('DB conectada');
    }
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
  } catch (error) {
    console.error('Error iniciando:', error);
    process.exit(1);
  }
};

startServer();