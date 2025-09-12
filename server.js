const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('=== SMARTPROIA AI FINANCIAL ADVISOR ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'NO configurada');
console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Configurada - DATOS REALES' : 'NO configurada - DATOS SIMULADOS');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

class RealMarketDataSystem {
  constructor() {
    this.marketData = new Map();
    this.lastUpdate = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  async fetchRealMarketData() {
    const symbols = ['NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AAPL'];
    const results = {};
    
    console.log('🔄 Obteniendo datos de mercado...');

    for (const symbol of symbols) {
      try {
        const stockData = await this.fetchStockData(symbol);
        results[symbol] = stockData;
        
        // Rate limiting más conservador
        await this.delay(15000); // 15 segundos entre calls
        
      } catch (error) {
        console.error(`Error obteniendo ${symbol}:`, error.message);
        results[symbol] = this.getFallbackData(symbol);
      }
    }

    // Datos de crypto con fallback más robusto
    results['BTCUSD'] = this.getFallbackData('BTCUSD');
    results['ETHUSD'] = this.getFallbackData('ETHUSD');

    this.marketData = new Map(Object.entries(results));
    this.lastUpdate = new Date().toISOString();
    
    console.log(`✅ Datos actualizados: ${this.marketData.size} símbolos`);
    return results;
  }

  async fetchStockData(symbol) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return this.getFallbackData(symbol);
    }

    const cacheKey = `stock_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Cache hit para ${symbol}`);
      return cached.data;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
      
      console.log(`🔍 API call para ${symbol}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        console.warn(`API issue para ${symbol}:`, data['Error Message'] || data['Note']);
        return this.getFallbackData(symbol);
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        console.warn(`Datos incompletos para ${symbol}, usando fallback`);
        return this.getFallbackData(symbol);
      }

      const stockData = {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        lastUpdate: quote['07. latest trading day'],
        source: 'alpha_vantage_real'
      };

      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      console.log(`✅ ${symbol}: $${stockData.price} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%) - REAL`);
      return stockData;

    } catch (error) {
      console.error(`API error para ${symbol}:`, error.message);
      return this.getFallbackData(symbol);
    }
  }

  getFallbackData(symbol) {
    console.log(`⚠️ Fallback data para ${symbol}`);
    
    const fallbackData = {
      'NVDA': { basePrice: 177.17, volatility: 0.015 },
      'TSLA': { basePrice: 368.81, volatility: 0.025 },
      'MSFT': { basePrice: 445.50, volatility: 0.012 },
      'GOOGL': { basePrice: 165.80, volatility: 0.018 },
      'AAPL': { basePrice: 225.00, volatility: 0.015 },
      'BTCUSD': { basePrice: 58500, volatility: 0.03 },
      'ETHUSD': { basePrice: 2380, volatility: 0.035 }
    };

    const config = fallbackData[symbol] || { basePrice: 100, volatility: 0.02 };
    const randomChange = (Math.random() - 0.5) * config.volatility * 2;
    const currentPrice = config.basePrice * (1 + randomChange);
    const change = currentPrice - config.basePrice;
    const changePercent = (change / config.basePrice) * 100;

    return {
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      high: parseFloat((currentPrice * 1.025).toFixed(2)),
      low: parseFloat((currentPrice * 0.975).toFixed(2)),
      lastUpdate: new Date().toISOString().split('T')[0],
      source: 'fallback_realistic'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  calculateTechnicals(priceData) {
    const rsi = 50 + (priceData.changePercent * 2.5);
    const clampedRSI = Math.max(15, Math.min(85, rsi));
    
    return {
      rsi: clampedRSI.toFixed(1),
      support: (priceData.low * 0.97).toFixed(2),
      resistance: (priceData.high * 1.03).toFixed(2),
      volatility: Math.abs(priceData.changePercent).toFixed(2),
      trend: priceData.changePercent > 1 ? 'bullish' : priceData.changePercent < -1 ? 'bearish' : 'neutral',
      dataSource: priceData.source
    };
  }

  extractSymbols(query) {
    const symbolMap = {
      'nvidia': 'NVDA', 'nvda': 'NVDA',
      'tesla': 'TSLA', 'tsla': 'TSLA',
      'microsoft': 'MSFT', 'msft': 'MSFT',
      'google': 'GOOGL', 'googl': 'GOOGL', 'alphabet': 'GOOGL',
      'apple': 'AAPL', 'aapl': 'AAPL',
      'bitcoin': 'BTCUSD', 'btc': 'BTCUSD',
      'ethereum': 'ETHUSD', 'eth': 'ETHUSD'
    };

    const mentioned = new Set();
    const lowerQuery = query.toLowerCase();
    
    Object.entries(symbolMap).forEach(([key, symbol]) => {
      if (lowerQuery.includes(key)) {
        mentioned.add(symbol);
      }
    });

    return Array.from(mentioned);
  }

  async generateProfessionalAnalysis(query, userId, userPlan = 'free') {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.generateFallbackAnalysis(query);
    }

    try {
      const mentionedSymbols = this.extractSymbols(query);
      const relevantData = {};
      
      for (const symbol of mentionedSymbols) {
        if (this.marketData.has(symbol)) {
          const priceData = this.marketData.get(symbol);
          relevantData[symbol] = {
            ...priceData,
            technicals: this.calculateTechnicals(priceData)
          };
        }
      }

      if (mentionedSymbols.length === 0) {
        ['NVDA', 'TSLA', 'MSFT', 'BTCUSD'].forEach(symbol => {
          if (this.marketData.has(symbol)) {
            const priceData = this.marketData.get(symbol);
            relevantData[symbol] = {
              ...priceData,
              technicals: this.calculateTechnicals(priceData)
            };
          }
        });
      }

      const prompt = this.buildProfessionalPrompt(query, relevantData, userPlan);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: userPlan === 'premium' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
          max_tokens: userPlan === 'premium' ? 600 : 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('Error en análisis:', error);
      return this.generateFallbackAnalysis(query);
    }
  }

  buildProfessionalPrompt(query, marketData, userPlan) {
    const currentDate = new Date().toLocaleString('es-ES', { 
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const marketDataText = Object.entries(marketData).map(([symbol, data]) => {
      const source = data.technicals?.dataSource === 'alpha_vantage_real' ? '[REAL]' : '[DEMO]';
      return `${symbol}: $${data.price?.toLocaleString() || 'N/A'} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) | RSI: ${data.technicals.rsi} | Soporte: $${data.technicals.support} | Resistencia: $${data.technicals.resistance} ${source}`;
    }).join('\n');

    return `Eres un asesor financiero CFA con 20+ años de experiencia. Trabajaste en Goldman Sachs y fondos de hedge.

FECHA: ${currentDate}
PLAN: ${userPlan.toUpperCase()}

DATOS DE MERCADO:
${marketDataText || 'No hay datos específicos para esta consulta.'}

CONSULTA: "${query}"

INSTRUCCIONES:
1. Usa SOLO los datos exactos mostrados arriba
2. Si muestran [REAL], son precios de mercado actuales
3. Si muestran [DEMO], advierte que son datos de demostración
4. Da recomendaciones específicas: entrada, stop-loss, targets
5. Incluye análisis técnico basado en los datos mostrados
6. ${userPlan === 'premium' ? 'PREMIUM: Análisis detallado con múltiples escenarios' : 'BÁSICO: Conciso pero actionable'}

ESTRUCTURA:
📊 ANÁLISIS [SÍMBOLO]
💰 PRECIO Y TÉCNICOS ACTUALES
📈 ESCENARIO PROBABLE
⚠️ RIESGOS IDENTIFICADOS
🎯 RECOMENDACIÓN ESPECÍFICA
⏰ TIMEFRAME

Máximo ${userPlan === 'premium' ? '400' : '250'} palabras.`;
  }

  generateFallbackAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      return `📊 ANÁLISIS NVIDIA (NVDA)

💰 PRECIO APROXIMADO: ~$177 (datos de referencia)

📈 CONTEXTO GENERAL:
NVIDIA lidera el sector de semiconductores para IA con dominio en GPUs especializadas.

⚠️ CONSIDERACIONES:
• Valoración elevada tras rally de IA
• Dependencia del boom tecnológico
• Competencia creciente de AMD y chips custom

🎯 ENFOQUE SUGERIDO:
Entrada gradual en correcciones del 10-15%. Diversificar riesgo con otros líderes tech.

⏰ HORIZONTE: 12-18 meses para tesis de inversión completa.

💡 NOTA: Para análisis con datos de mercado en tiempo real, necesitamos conexión estable a fuentes de precios.`;
    }

    return `📊 ANÁLISIS GENERAL

CONSULTA: "${query}"

📈 RECOMENDACIÓN ESTRUCTURAL:
• Diversificar entre líderes de sectores clave
• Mantener disciplina en entrada y salida
• Considerar correlaciones de mercado

⚠️ IMPORTANTE: Para análisis específicos con precios actuales y recomendaciones precisas, necesitamos datos de mercado actualizados.

💡 SUGERENCIA: Verifica precios actuales en fuentes como Yahoo Finance o Bloomberg antes de tomar decisiones.`;
  }
}

const marketSystem = new RealMarketDataSystem();

// INICIALIZACIÓN MEJORADA DE BASE DE DATOS
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agregar queries_used si no existe
    try {
      await client.query(`ALTER TABLE users ADD COLUMN queries_used INTEGER DEFAULT 0`);
      console.log('✅ Columna queries_used agregada');
    } catch (error) {
      if (error.code === '42701') {
        console.log('✅ Columna queries_used ya existe');
      }
    }

    // Tabla de chat SIN market_data column (causaba error)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Base de datos inicializada');
  } catch (error) {
    console.error('Error inicializando BD:', error);
  }
}

// RUTAS API
app.get('/', (req, res) => {
  res.json({
    service: 'SmartProIA - Professional AI Financial Advisor',
    status: 'operational',
    version: '3.1',
    features: ['Alpha Vantage integration', 'Professional Claude analysis'],
    dataSource: process.env.ALPHA_VANTAGE_API_KEY ? 'Real + Fallback' : 'Fallback only',
    lastUpdate: marketSystem.lastUpdate,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      claude_ai: process.env.ANTHROPIC_API_KEY ? 'available' : 'unavailable',
      alpha_vantage: process.env.ALPHA_VANTAGE_API_KEY ? 'configured' : 'not_configured'
    },
    marketData: {
      lastUpdate: marketSystem.lastUpdate,
      symbolsCount: marketSystem.marketData.size
    }
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Contraseña debe tener mínimo 8 caracteres' });
    }

    const client = await pool.connect();
    
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await client.query(`
        INSERT INTO users (name, email, password, subscription_plan) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email, subscription_plan
      `, [name.trim(), email.toLowerCase(), hashedPassword, 'free']);

      const newUser = result.rows[0];
      await client.query('UPDATE users SET queries_used = 0 WHERE id = $1', [newUser.id]);
      
      newUser.queries_used = 0;
      newUser.queries_limit = 5;
      newUser.queries_remaining = 5;

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`✅ Usuario registrado: ${email}`);
      
      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          subscription_plan: newUser.subscription_plan,
          queries_remaining: newUser.queries_remaining,
          queries_limit: newUser.queries_limit
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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      const queryLimits = { free: 5, basic: 50, premium: 999 };
      user.queries_limit = queryLimits[user.subscription_plan];
      user.queries_used = user.queries_used || 0;
      user.queries_remaining = user.queries_limit - user.queries_used;

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`✅ Login: ${email}`);
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscription_plan: user.subscription_plan,
          queries_remaining: user.queries_remaining,
          queries_limit: user.queries_limit
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

app.get('/api/user-profile', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, name, email, subscription_plan, queries_used FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];
      const queryLimits = { free: 5, basic: 50, premium: 999 };
      user.queries_limit = queryLimits[user.subscription_plan];
      user.queries_used = user.queries_used || 0;
      user.queries_remaining = user.queries_limit - user.queries_used;

      res.json({
        user: user,
        features: {
          real_time_data: process.env.ALPHA_VANTAGE_API_KEY ? true : false,
          professional_ai: process.env.ANTHROPIC_API_KEY ? true : false
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const client = await pool.connect();
    let user;
    
    try {
      const result = await client.query('SELECT subscription_plan, queries_used FROM users WHERE id = $1', [userId]);
      user = result.rows[0];
      user.queries_used = user.queries_used || 0;
    } finally {
      client.release();
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const queryLimits = { free: 5, basic: 50, premium: 999 };
    const userLimit = queryLimits[user.subscription_plan];

    if (user.queries_used >= userLimit) {
      return res.status(429).json({
        error: 'Límite de consultas alcanzado',
        upgrade_required: true,
        current_plan: user.subscription_plan
      });
    }

    const response = await marketSystem.generateProfessionalAnalysis(message, userId, user.subscription_plan);

    const updateClient = await pool.connect();
    try {
      await updateClient.query(
        'UPDATE users SET queries_used = COALESCE(queries_used, 0) + 1 WHERE id = $1',
        [userId]
      );

      // Guardar historial SIN market_data (causaba error)
      await updateClient.query(
        'INSERT INTO chat_history (user_id, message, response) VALUES ($1, $2, $3)',
        [userId, message, response]
      );
    } finally {
      updateClient.release();
    }

    console.log(`💬 Análisis procesado para usuario ${userId}`);

    res.json({
      response,
      queries_remaining: userLimit - (user.queries_used + 1),
      plan: user.subscription_plan,
      upgrade_available: user.subscription_plan === 'free'
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error procesando análisis profesional' });
  }
});

app.get('/api/market-data', authenticateToken, async (req, res) => {
  try {
    const shouldUpdate = !marketSystem.lastUpdate || 
                        (Date.now() - new Date(marketSystem.lastUpdate).getTime()) > 10 * 60 * 1000;
    
    if (shouldUpdate) {
      console.log('🔄 Actualizando datos...');
      await marketSystem.fetchRealMarketData();
    }
    
    res.json({
      data: Object.fromEntries(marketSystem.marketData),
      lastUpdate: marketSystem.lastUpdate,
      source: process.env.ALPHA_VANTAGE_API_KEY ? 'alpha_vantage_mixed' : 'fallback_only'
    });
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: 'Error obteniendo datos' });
  }
});

const startServer = async () => {
  try {
    await initDatabase();
    
    console.log('🚀 Inicializando datos de mercado...');
    await marketSystem.fetchRealMarketData();
    
    app.listen(PORT, () => {
      console.log(`🚀 SmartProIA v3.1 - Puerto ${PORT}`);
      console.log(`🧠 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Deshabilitado'}`);
      console.log(`📊 Alpha Vantage: ${process.env.ALPHA_VANTAGE_API_KEY ? 'Configurado' : 'Modo fallback'}`);
      console.log(`💾 BD: ${process.env.DATABASE_URL ? 'Conectada' : 'Desconectada'}`);
      console.log(`📈 Símbolos: ${marketSystem.marketData.size}`);
      console.log('=== SISTEMA ESTABLE ===');
    });

  } catch (error) {
    console.error('❌ Error iniciando:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor...');
  if (pool) await pool.end();
  process.exit(0);
});

startServer();

module.exports = app;
