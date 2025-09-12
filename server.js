const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuración CORS mejorada
app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting profesional por plan
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

const basicLimiter = createRateLimiter(15 * 60 * 1000, 50, 'Límite de solicitudes alcanzado. Actualiza tu plan.');
const premiumLimiter = createRateLimiter(15 * 60 * 1000, 200, 'Límite premium alcanzado.');

// Middleware de autenticación mejorado
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener datos actuales del usuario
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, email, name, subscription_plan, queries_used, queries_limit FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Sistema de análisis de mercado en tiempo real
class MarketAnalyzer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  async getMarketData(symbol) {
    const cacheKey = `market_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Datos simulados profesionales (en producción usar APIs reales)
      const mockData = {
        'NVDA': { price: 421.50, change: +2.34, volume: '28.4M', pe: 28.7, sentiment: 'bullish' },
        'TSLA': { price: 243.20, change: -1.45, volume: '35.1M', pe: 34.2, sentiment: 'neutral' },
        'MSFT': { price: 381.90, change: +0.87, volume: '18.7M', pe: 24.1, sentiment: 'bullish' },
        'BTC': { price: 63420, change: +1.23, volume: '$2.1B', sentiment: 'bullish' },
        'ETH': { price: 2847, change: -0.56, volume: '$1.4B', sentiment: 'neutral' }
      };

      const data = mockData[symbol.upper] || { price: 'N/A', change: 'N/A', volume: 'N/A', sentiment: 'neutral' };
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error obteniendo datos de ${symbol}:`, error);
      return { price: 'N/A', change: 'N/A', volume: 'N/A', sentiment: 'neutral' };
    }
  }

  analyzeMarketSentiment(message) {
    const bullishTerms = ['comprar', 'bullish', 'alcista', 'subir', 'inversión', 'oportunidad'];
    const bearishTerms = ['vender', 'bearish', 'bajista', 'bajar', 'riesgo', 'caída'];
    
    const lowerMsg = message.toLowerCase();
    const bullishCount = bullishTerms.filter(term => lowerMsg.includes(term)).length;
    const bearishCount = bearishTerms.filter(term => lowerMsg.includes(term)).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }
}

const marketAnalyzer = new MarketAnalyzer();

// Sistema de IA profesional con Claude
class AIInvestmentAdvisor {
  constructor() {
    this.apiCalls = 0;
    this.dailyLimit = 1000;
  }

  async generateAdvice(query, userPlan, marketData) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Servicio de IA temporalmente no disponible');
    }

    const isPremium = userPlan === 'premium';
    const maxTokens = isPremium ? 600 : 300;
    const model = isPremium ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{
            role: 'user',
            content: `Eres un asesor de inversiones senior con 15+ años de experiencia en Wall Street, especializado en tecnología, IA, criptomonedas y análisis cuantitativo.

DATOS DE MERCADO ACTUALES:
${JSON.stringify(marketData, null, 2)}

CONSULTA DEL CLIENTE: "${query}"

PLAN DEL USUARIO: ${userPlan}

INSTRUCCIONES ESPECÍFICAS:
1. Analiza la consulta con contexto de mercado real
2. Proporciona datos precisos y actualizados
3. Incluye análisis técnico Y fundamental relevante
4. Identifica riesgos específicos y oportunidades
5. Da recomendaciones ACCIONABLES con:
   - Precios de entrada sugeridos
   - Niveles de stop-loss
   - Objetivos de precio (targets)
   - Timeframes específicos
6. ${isPremium ? 'Incluye análisis avanzado con múltiples escenarios' : 'Mantén respuesta concisa pero valiosa'}
7. Menciona disclaimers apropiados
8. Tono profesional pero accesible

ESTRUCTURA OBLIGATORIA:
📊 ANÁLISIS PRINCIPAL
📈 CONTEXTO DE MERCADO
⚠️ RIESGOS IDENTIFICADOS
🎯 RECOMENDACIONES ACCIONABLES
⏰ TIMEFRAME Y SEGUIMIENTO

${isPremium ? 'Como usuario premium, proporciona análisis detallado con múltiples perspectivas.' : 'Versión básica: enfócate en lo más importante.'}

Responde en español, máximo ${isPremium ? '400' : '250'} palabras.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      this.apiCalls++;
      return data.content[0].text;

    } catch (error) {
      console.error('Error en Claude API:', error);
      return this.getFallbackAdvice(query, userPlan, marketData);
    }
  }

  getFallbackAdvice(query, userPlan, marketData) {
    const isPremium = userPlan === 'premium';
    const lowerQuery = query.toLowerCase();
    
    let advice = `📊 ANÁLISIS DE: "${query}"\n\n`;
    
    if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      advice += `🎯 NVIDIA (NVDA): Líder indiscutible en IA\n`;
      advice += `• Precio actual: ~$421 (+2.34%)\n`;
      advice += `• Fortalezas: Dominio en GPUs IA, ingresos récord\n`;
      advice += `• Riesgos: Valoración elevada, competencia AMD/Intel\n`;
      advice += `${isPremium ? '🎯 Premium: Entrada $400-420, stop $380, target $480\n⏰ Timeframe: 3-6 meses' : '💡 Actualiza a Premium para recomendaciones específicas'}`;
    } else if (lowerQuery.includes('bitcoin') || lowerQuery.includes('btc')) {
      advice += `🎯 BITCOIN: Consolidación pre-halving\n`;
      advice += `• Precio actual: ~$63,400 (+1.23%)\n`;
      advice += `• Catalizadores: ETFs, adopción institucional\n`;
      advice += `• Riesgos: Volatilidad, regulación, macro\n`;
      advice += `${isPremium ? '🎯 Premium: Zona compra $60K-62K, stop $58K, target $75K\n⏰ Timeframe: 6-12 meses' : '💡 Actualiza a Premium para niveles exactos'}`;
    } else {
      advice += `📈 ANÁLISIS GENERAL DEL MERCADO\n`;
      advice += `• Sector tech: Consolidación tras rally IA\n`;
      advice += `• Oportunidades: Correcciones en calidad\n`;
      advice += `• Estrategia: Diversificación y paciencia\n`;
      advice += `${isPremium ? '🎯 Premium: Portfolio balanceado 60% tech, 30% crypto, 10% cash' : '💡 Actualiza a Premium para estrategias personalizadas'}`;
    }
    
    advice += `\n\n⚠️ DISCLAIMER: Análisis educativo, no asesoría financiera personal.`;
    return advice;
  }
}

const aiAdvisor = new AIInvestmentAdvisor();

// Inicialización de base de datos
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Tabla usuarios mejorada
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        queries_used INTEGER DEFAULT 0,
        queries_limit INTEGER DEFAULT 5,
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla historial mejorada
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        cost_usd DECIMAL(10,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla analytics para métricas
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_type VARCHAR(100),
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } finally {
    client.release();
  }
}

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    service: 'AI Investment Advisor Pro',
    status: 'operational',
    version: '2.0.0',
    features: ['Real-time market data', 'AI-powered analysis', 'Premium insights'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      ai: process.env.ANTHROPIC_API_KEY ? 'available' : 'unavailable',
      market_data: 'operational'
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Registro con seguridad mejorada
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones estrictas
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const client = await pool.connect();
    try {
      // Verificar email único
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }

      // Hash seguro de password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await client.query(`
        INSERT INTO users (email, password, name, subscription_plan, queries_limit) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, email, name, subscription_plan, queries_limit
      `, [email, hashedPassword, name, 'free', 5]);

      const newUser = result.rows[0];
      
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Log analytics
      await client.query(
        'INSERT INTO analytics (user_id, event_type, event_data) VALUES ($1, $2, $3)',
        [newUser.id, 'user_registered', { plan: 'free' }]
      );

      console.log(`✅ Usuario registrado: ${email} (Plan: free)`);
      res.json({ 
        token, 
        user: { 
          ...newUser, 
          queries_remaining: newUser.queries_limit - (newUser.queries_used || 0)
        } 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login mejorado
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Log analytics
      await client.query(
        'INSERT INTO analytics (user_id, event_type) VALUES ($1, $2)',
        [user.id, 'user_login']
      );

      console.log(`✅ Login exitoso: ${email}`);
      res.json({ 
        token, 
        user: { 
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_plan: user.subscription_plan,
          queries_remaining: user.queries_limit - (user.queries_used || 0)
        } 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Chat principal con IA profesional
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Verificar límites de plan
    if (user.queries_used >= user.queries_limit) {
      return res.status(429).json({ 
        error: 'Límite de consultas alcanzado',
        upgrade_required: true,
        current_plan: user.subscription_plan
      });
    }

    // Analizar mercado y generar respuesta
    const symbols = ['NVDA', 'TSLA', 'MSFT', 'BTC', 'ETH'];
    const marketData = {};
    
    for (const symbol of symbols) {
      if (message.toLowerCase().includes(symbol.toLowerCase())) {
        marketData[symbol] = await marketAnalyzer.getMarketData(symbol);
      }
    }

    const response = await aiAdvisor.generateAdvice(
      message, 
      user.subscription_plan, 
      marketData
    );

    const client = await pool.connect();
    try {
      // Actualizar contador de consultas
      await client.query(
        'UPDATE users SET queries_used = queries_used + 1 WHERE id = $1',
        [user.id]
      );

      // Guardar historial
      await client.query(
        'INSERT INTO chat_history (user_id, message, response, tokens_used) VALUES ($1, $2, $3, $4)',
        [user.id, message, response, response.length]
      );

      // Analytics
      await client.query(
        'INSERT INTO analytics (user_id, event_type, event_data) VALUES ($1, $2, $3)',
        [user.id, 'chat_query', { plan: user.subscription_plan, query_length: message.length }]
      );
    } finally {
      client.release();
    }

    console.log(`💬 Query procesada para ${user.email}: "${message.substring(0, 30)}..."`);
    
    res.json({ 
      response,
      queries_remaining: user.queries_limit - (user.queries_used + 1),
      plan: user.subscription_plan,
      upgrade_available: user.subscription_plan === 'free'
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error procesando consulta' });
  }
});

// Análisis de portfolio premium
app.post('/api/portfolio-analysis', authenticateToken, async (req, res) => {
  try {
    const { holdings } = req.body; // [{ symbol: 'NVDA', quantity: 10, avgPrice: 400 }]
    const user = req.user;

    if (user.subscription_plan === 'free') {
      return res.status(402).json({ 
        error: 'Funcionalidad premium requerida',
        upgrade_url: '/upgrade'
      });
    }

    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({ error: 'Datos de portfolio requeridos' });
    }

    // Análisis detallado del portfolio
    let totalValue = 0;
    const analysis = [];

    for (const holding of holdings) {
      const marketData = await marketAnalyzer.getMarketData(holding.symbol);
      const currentValue = holding.quantity * (marketData.price || holding.avgPrice);
      const pnl = currentValue - (holding.quantity * holding.avgPrice);
      const pnlPercent = (pnl / (holding.quantity * holding.avgPrice)) * 100;

      totalValue += currentValue;
      analysis.push({
        symbol: holding.symbol,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        currentPrice: marketData.price,
        currentValue: currentValue,
        pnl: pnl,
        pnlPercent: pnlPercent,
        recommendation: pnlPercent > 20 ? 'CONSIDER_PROFIT' : pnlPercent < -15 ? 'REVIEW_POSITION' : 'HOLD'
      });
    }

    const portfolioAdvice = await aiAdvisor.generateAdvice(
      `Analiza este portfolio: ${holdings.map(h => `${h.symbol} (${h.quantity} shares @ $${h.avgPrice})`).join(', ')}`,
      user.subscription_plan,
      { portfolio: analysis, totalValue }
    );

    res.json({
      totalValue,
      analysis,
      aiAdvice: portfolioAdvice,
      riskScore: analysis.length > 5 ? 'MEDIUM' : 'HIGH',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en análisis de portfolio:', error);
    res.status(500).json({ error: 'Error analizando portfolio' });
  }
});

// Endpoint para datos de usuario
app.get('/api/user-profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const client = await pool.connect();
    try {
      // Estadísticas del usuario
      const chatStats = await client.query(
        'SELECT COUNT(*) as total_queries FROM chat_history WHERE user_id = $1',
        [user.id]
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_plan: user.subscription_plan,
          queries_used: user.queries_used,
          queries_limit: user.queries_limit,
          queries_remaining: user.queries_limit - user.queries_used,
          total_lifetime_queries: parseInt(chatStats.rows[0].total_queries)
        },
        features: {
          portfolio_analysis: user.subscription_plan !== 'free',
          real_time_alerts: user.subscription_plan === 'premium',
          ai_model: user.subscription_plan === 'premium' ? 'claude-sonnet' : 'claude-haiku',
          priority_support: user.subscription_plan === 'premium'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error obteniendo datos del usuario' });
  }
});

// Inicialización del servidor
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 AI Investment Advisor Pro v2.0 iniciado en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 IA: ${process.env.ANTHROPIC_API_KEY ? 'Claude habilitado' : 'Sin IA'}`);
      console.log(`💾 BD: ${process.env.DATABASE_URL ? 'PostgreSQL conectada' : 'Sin BD'}`);
      console.log(`📊 Market Data: Simulado (listo para APIs reales)`);
      console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configurado' : 'Pendiente'}`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
};

// Manejo graceful de shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor gracefulmente...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', promise, 'Razón:', reason);
});

// Iniciar servidor
startServer();

module.exports = app;
