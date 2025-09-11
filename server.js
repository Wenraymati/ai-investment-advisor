const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const natural = require('natural');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Base de Datos
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

// Rate limiting para prevenir abuso
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde.'
}));

// Variables de entorno - log de inicialización
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'NO configurada');
console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Configurada' : 'NO configurada');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Función para detectar idioma (simplificada)
function detectLanguage(message) {
  const spanishKeywords = ['acciones', 'inversión', 'mercado', 'bitcoin', 'tesla'];
  return message.toLowerCase().some(word => spanishKeywords.includes(word)) ? 'es' : 'en';
}

// Función para obtener datos en tiempo real
async function fetchMarketData(symbol) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return `Datos en tiempo real no disponibles para ${symbol}.`;
  }

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    const data = await response.json();
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return `Precio actual de ${symbol}: $${quote['05. price']} (Actualizado: ${quote['07. latest trading day']})`;
    }
    return `No se encontraron datos para ${symbol}.`;
  } catch (error) {
    console.error(`Error en Alpha Vantage API: ${error.message}`);
    return `No se pudieron obtener datos en tiempo real para ${symbol}.`;
  }
}

// Función para clasificar consultas
function classifyQuery(message) {
  const classifier = new natural.BayesClassifier();
  classifier.addDocument('acciones nvidia tesla microsoft google', 'stocks');
  classifier.addDocument('bitcoin crypto eth', 'crypto');
  classifier.addDocument('fed intereses inflación', 'macro');
  classifier.train();
  return classifier.classify(message.toLowerCase());
}

// Función para generar respuestas dinámicas basadas en contexto
function generateDynamicResponse(message, userId, subscriptionPlan) {
  const lowerMessage = message.toLowerCase();
  const isPremium = subscriptionPlan === 'premium';
  
  const responses = {
    nvidia: `NVIDIA (NVDA): Líder en chips de IA. Crecimiento sólido en 2025 por demanda de GPUs. Riesgos: competencia de AMD/Intel, volatilidad post-ganancias. ${isPremium ? 'Recomendación Premium: Entrada en $350-$380, stop-loss $320, target $450.' : 'Actualiza a premium para recomendaciones detalladas.'}`,
    bitcoin: `Bitcoin: ~$63,000 (Septiembre 2025). Alta volatilidad pre-halving. Riesgos: regulación, correcciones de mercado. ${isPremium ? 'Recomendación Premium: Compra en $58,000-$60,000, stop-loss $55,000.' : 'Actualiza a premium para recomendaciones detalladas.'}`,
    tesla: `Tesla (TSLA): Innovador en IA automotriz. Precio: ~$240. Riesgos: competencia (BYD), ejecución de robotaxis. ${isPremium ? 'Recomendación Premium: Entrada en $220, stop-loss $200, target $300.' : 'Actualiza a premium para recomendaciones detalladas.'}`,
    default: `Análisis de "${message}": Mercado de IA en maduración (Septiembre 2025). Líderes: NVDA, MSFT, GOOGL. Recomiendo diversificación. ${isPremium ? 'Obtén análisis personalizados con premium.' : 'Actualiza a premium para análisis detallados.'}`
  };

  for (const [key, response] of Object.entries(responses)) {
    if (key !== 'default' && lowerMessage.includes(key)) {
      return response;
    }
  }
  return responses.default;
}

// Función auxiliar para llamar a Claude API
async function callClaudeAPI(userMessage, userId, subscriptionPlan) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key no configurada');
  }

  const category = classifyQuery(userMessage);
  const marketData = await fetchMarketData(category === 'stocks' ? userMessage.split(' ')[0].toUpperCase() : 'BTCUSD');
  const language = detectLanguage(userMessage);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: subscriptionPlan === 'premium' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
      max_tokens: subscriptionPlan === 'premium' ? 400 : 200,
      messages: [
        {
          role: 'user',
          content: `Eres un asesor senior de inversiones con 15+ años de experiencia en Wall Street, especializado en tecnología, IA y mercados financieros.

Contexto actual (Septiembre 2025):
${marketData}

CONSULTA: "${userMessage}"

INSTRUCCIONES:
1. Clasifica la consulta como ${category}.
2. Si es ambigua, solicita aclaraciones.
3. Proporciona datos actuales y precisos.
4. Incluye análisis técnico y fundamental.
5. Menciona riesgos específicos y timeframes.
6. Da recomendaciones accionables (entrada, stop-loss, target).
7. Tono profesional pero accesible.
8. Responde en ${language === 'es' ? 'español' : 'inglés'}.

ESTRUCTURA:
- Análisis directo
- Contexto de mercado
- Riesgos principales
- Recomendación práctica
- Timeframe sugerido

Máximo ${subscriptionPlan === 'premium' ? 300 : 150} palabras.`
        }
      ]
    })
  });

  if (!response.ok) {
    console.error(`Claude API error ${response.status}`);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'AI Investment Advisor API funcionando!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Variable configurada' : 'Variable NO configurada',
    claude_ai: process.env.ANTHROPIC_API_KEY ? 'Disponible' : 'No configurada',
    alpha_vantage: process.env.ALPHA_VANTAGE_API_KEY ? 'Disponible' : 'No configurada'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AI Investment Advisor',
    database: process.env.DATABASE_URL ? 'URL disponible' : 'URL no disponible',
    claude_ai: process.env.ANTHROPIC_API_KEY ? 'Disponible' : 'No configurada',
    alpha_vantage: process.env.ALPHA_VANTAGE_API_KEY ? 'Disponible' : 'No configurada'
  });
});

// Registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users (email, name, password, subscription_plan) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, name, password, 'free']
      );
      const newUser = { id: result.rows[0].id, email, name, subscription_plan: 'free' };

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log(`✅ Usuario registrado: ${email}`);
      res.json({ token, user: newUser });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login de usuarios
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log(`✅ Usuario logueado: ${email}`);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, subscription_plan: user.subscription_plan } });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Datos del usuario
app.get('/api/user-data', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, email, name, subscription_plan FROM users WHERE id = $1', [req.user.userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ user: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Chat con Claude IA mejorado
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    const client = await pool.connect();
    let subscriptionPlan;
    try {
      const result = await client.query('SELECT subscription_plan FROM users WHERE id = $1', [userId]);
      subscriptionPlan = result.rows[0]?.subscription_plan || 'free';
    } finally {
      client.release();
    }

    let response;
    let usedClaude = false;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        response = await callClaudeAPI(message, userId, subscriptionPlan);
        usedClaude = true;
        console.log(`💬 Claude respondió a usuario ${userId}: ${message.substring(0, 30)}...`);
      } catch (claudeError) {
        console.error('Claude API falló:', claudeError.message);
        usedClaude = false;
      }
    }

    if (!usedClaude) {
      response = generateDynamicResponse(message, userId, subscriptionPlan);
      console.log(`🤖 Respuesta dinámica para usuario ${userId}: ${message.substring(0, 30)}...`);
    }

    // Guardar interacción en la base de datos
    const clientSave = await pool.connect();
    try {
      await clientSave.query(
        'INSERT INTO interactions (user_id, message, response, created_at) VALUES ($1, $2, $3, $4)',
        [userId, message, response, new Date()]
      );
    } finally {
      clientSave.release();
    }

    res.json({ response, isPremium: subscriptionPlan === 'premium' });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

// Análisis de portfolio
app.post('/api/analyze-portfolio', authenticateToken, async (req, res) => {
  try {
    const { stocks } = req.body;
    const userId = req.user.userId;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'Lista de acciones requerida' });
    }

    const client = await pool.connect();
    let subscriptionPlan;
    try {
      const result = await client.query('SELECT subscription_plan FROM users WHERE id = $1', [userId]);
      subscriptionPlan = result.rows[0]?.subscription_plan || 'free';
    } finally {
      client.release();
    }

    const stockAnalysisPromises = stocks.map(async (stock) => {
      const ticker = stock.toUpperCase();
      const marketData = await fetchMarketData(ticker);
      return `${ticker}: ${marketData}. ${subscriptionPlan === 'premium' ? `Análisis Premium: Peso recomendado ${ticker === 'NVDA' ? '25-30%' : '15-20%'}.` : 'Actualiza a premium para análisis detallado.'}`;
    });

    const stockAnalysis = await Promise.all(stockAnalysisPromises);
    const analysis = `Análisis de Portfolio [${stocks.join(', ')}]:

${stockAnalysis.join('\n')}

Recomendaciones generales:
• Diversificar entre semiconductores, software y aplicaciones IA
• Mantener 10-20% en cash
• Rebalancear trimestralmente
• ${subscriptionPlan === 'premium' ? 'Recibe alertas en tiempo real con premium.' : 'Actualiza a premium para alertas en tiempo real.'}

Riesgo del portfolio: ${stocks.length > 5 ? 'Medio' : 'Alto'} (concentración en ${stocks.length} acciones)`;

    res.json({ analysis, isPremium: subscriptionPlan === 'premium' });
  } catch (error) {
    console.error('Error en análisis de portfolio:', error);
    res.status(500).json({ error: 'Error al analizar portfolio' });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message
  });
});

// Inicialización del servidor
const startServer = async () => {
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE, name VARCHAR(255), password VARCHAR(255), subscription_plan VARCHAR(50))');
      await pool.query('CREATE TABLE IF NOT EXISTS interactions (id SERIAL PRIMARY KEY, user_id INTEGER, message TEXT, response TEXT, created_at TIMESTAMP)');
      console.log('✅ Conexión a base de datos establecida');
    } else {
      console.log('⚠️ Base de datos no configurada (modo desarrollo)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Deshabilitado'}`);
      console.log(`📈 Alpha Vantage: ${process.env.ALPHA_VANTAGE_API_KEY ? 'Habilitado' : 'Deshabilitado'}`);
      console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'Desconectada'}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar aplicación
startServer();

module.exports = app;
