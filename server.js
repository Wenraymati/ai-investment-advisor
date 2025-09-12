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
    this.conversationContexts = new Map();
    this.rateLimitCounter = 0;
    this.lastApiCall = 0;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos de cache
  }

  // Obtener datos REALES de Alpha Vantage
  async fetchRealMarketData() {
    const symbols = ['NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AAPL'];
    const cryptoSymbols = ['BTC', 'ETH'];
    const results = {};
    
    console.log('🔄 Obteniendo datos reales de mercado...');

    // Obtener datos de acciones
    for (const symbol of symbols) {
      try {
        const stockData = await this.fetchStockData(symbol);
        if (stockData) {
          results[symbol] = stockData;
        } else {
          results[symbol] = this.getFallbackData(symbol);
        }
        
        // Rate limiting - Alpha Vantage permite 5 calls/minuto
        await this.delay(12000); // 12 segundos entre calls
        
      } catch (error) {
        console.error(`Error obteniendo ${symbol}:`, error.message);
        results[symbol] = this.getFallbackData(symbol);
      }
    }

    // Obtener datos de crypto
    for (const crypto of cryptoSymbols) {
      try {
        const cryptoData = await this.fetchCryptoData(crypto);
        if (cryptoData) {
          results[`${crypto}USD`] = cryptoData;
        } else {
          results[`${crypto}USD`] = this.getFallbackData(`${crypto}USD`);
        }
        
        await this.delay(12000);
        
      } catch (error) {
        console.error(`Error obteniendo ${crypto}:`, error.message);
        results[`${crypto}USD`] = this.getFallbackData(`${crypto}USD`);
      }
    }

    this.marketData = new Map(Object.entries(results));
    this.lastUpdate = new Date().toISOString();
    
    console.log(`✅ Datos de mercado actualizados: ${this.marketData.size} símbolos`);
    return results;
  }

  async fetchStockData(symbol) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return null;
    }

    // Verificar cache
    const cacheKey = `stock_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Usando cache para ${symbol}`);
      return cached.data;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
      
      console.log(`🔍 Obteniendo datos reales de ${symbol}...`);
      const response = await fetch(url);
      const data = await response.json();

      if (data['Error Message']) {
        console.error(`API Error para ${symbol}:`, data['Error Message']);
        return null;
      }

      if (data['Note']) {
        console.warn(`API Rate Limit para ${symbol}:`, data['Note']);
        return null;
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        console.error(`Datos incompletos para ${symbol}:`, data);
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const volume = quote['06. volume'];
      const high = parseFloat(quote['03. high']);
      const low = parseFloat(quote['04. low']);

      const stockData = {
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseInt(volume),
        high: high,
        low: low,
        lastUpdate: quote['07. latest trading day'],
        source: 'alpha_vantage_real'
      };

      // Guardar en cache
      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      console.log(`✅ ${symbol}: $${price} (${changePercent > 0 ? '+' : ''}${changePercent}%) - REAL`);
      return stockData;

    } catch (error) {
      console.error(`Error de red para ${symbol}:`, error.message);
      return null;
    }
  }

  async fetchCryptoData(crypto) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return null;
    }

    const cacheKey = `crypto_${crypto}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Usando cache para ${crypto}`);
      return cached.data;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${crypto}&market=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
      
      console.log(`🔍 Obteniendo datos reales de ${crypto}...`);
      const response = await fetch(url);
      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        console.error(`API Error para ${crypto}:`, data['Error Message'] || data['Note']);
        return null;
      }

      const timeSeries = data['Time Series (Digital Currency Daily)'];
      if (!timeSeries) {
        console.error(`No hay datos de serie temporal para ${crypto}`);
        return null;
      }

      // Obtener el día más reciente
      const dates = Object.keys(timeSeries).sort().reverse();
      const latestDate = dates[0];
      const latestData = timeSeries[latestDate];

      if (!latestData) {
        console.error(`No hay datos para la fecha más reciente de ${crypto}`);
        return null;
      }

      const price = parseFloat(latestData['4a. close (USD)']);
      const high = parseFloat(latestData['2a. high (USD)']);
      const low = parseFloat(latestData['3a. low (USD)']);
      const open = parseFloat(latestData['1a. open (USD)']);
      const change = price - open;
      const changePercent = (change / open) * 100;

      const cryptoData = {
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseFloat(latestData['5. volume']),
        high: high,
        low: low,
        lastUpdate: latestDate,
        source: 'alpha_vantage_real'
      };

      this.cache.set(cacheKey, {
        data: cryptoData,
        timestamp: Date.now()
      });

      console.log(`✅ ${crypto}: $${price.toLocaleString()} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%) - REAL`);
      return cryptoData;

    } catch (error) {
      console.error(`Error de red para ${crypto}:`, error.message);
      return null;
    }
  }

  getFallbackData(symbol) {
    console.log(`⚠️ Usando datos de respaldo para ${symbol}`);
    
    const fallbackData = {
      'NVDA': { basePrice: 177.17, volatility: 0.02 },
      'TSLA': { basePrice: 368.81, volatility: 0.03 },
      'MSFT': { basePrice: 445.50, volatility: 0.015 },
      'GOOGL': { basePrice: 165.80, volatility: 0.02 },
      'AAPL': { basePrice: 225.00, volatility: 0.018 },
      'BTCUSD': { basePrice: 60000, volatility: 0.04 },
      'ETHUSD': { basePrice: 2500, volatility: 0.05 }
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
      high: parseFloat((currentPrice * 1.02).toFixed(2)),
      low: parseFloat((currentPrice * 0.98).toFixed(2)),
      lastUpdate: new Date().toISOString().split('T')[0],
      source: 'fallback_simulated'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  calculateTechnicals(priceData) {
    const price = priceData.price;
    const high = priceData.high;
    const low = priceData.low;
    
    // RSI simplificado basado en cambio de precio
    const rsi = 50 + (priceData.changePercent * 2);
    const clampedRSI = Math.max(10, Math.min(90, rsi));
    
    const support = low * 0.97;
    const resistance = high * 1.03;
    const volatility = Math.abs(priceData.changePercent);
    
    return {
      rsi: clampedRSI.toFixed(1),
      support: support.toFixed(2),
      resistance: resistance.toFixed(2),
      volatility: volatility.toFixed(2),
      trend: priceData.changePercent > 1 ? 'bullish' : priceData.changePercent < -1 ? 'bearish' : 'neutral',
      lastUpdate: priceData.lastUpdate,
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
      // Obtener datos actualizados (usará cache si es reciente)
      const mentionedSymbols = this.extractSymbols(query);
      const relevantData = {};
      
      for (const symbol of mentionedSymbols) {
        if (this.marketData.has(symbol)) {
          const priceData = this.marketData.get(symbol);
          relevantData[symbol] = {
            ...priceData,
            technicals: this.calculateTechnicals(priceData)
          };
        } else {
          // Si no tenemos datos, obtener específicamente para este símbolo
          let freshData = null;
          if (symbol.endsWith('USD')) {
            const crypto = symbol.replace('USD', '');
            freshData = await this.fetchCryptoData(crypto);
          } else {
            freshData = await this.fetchStockData(symbol);
          }
          
          if (freshData) {
            relevantData[symbol] = {
              ...freshData,
              technicals: this.calculateTechnicals(freshData)
            };
          }
        }
      }

      if (mentionedSymbols.length === 0) {
        // Análisis general con datos principales
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
          max_tokens: userPlan === 'premium' ? 800 : 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('Error en análisis profesional:', error);
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
      const source = data.technicals?.dataSource === 'alpha_vantage_real' ? '[DATOS REALES]' : '[SIMULADO]';
      return `${symbol}: $${data.price.toLocaleString()} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) | RSI: ${data.technicals.rsi} | Soporte: $${data.technicals.support} | Resistencia: $${data.technicals.resistance} | Actualizado: ${data.lastUpdate} ${source}`;
    }).join('\n');

    return `Eres un asesor financiero senior certificado (CFA) con 20+ años de experiencia en Wall Street. Trabajaste en Goldman Sachs, JP Morgan y fundos hedge. Especialista en análisis cuantitativo, IA, tecnología y mercados emergentes.

FECHA Y HORA: ${currentDate}
PLAN DEL USUARIO: ${userPlan.toUpperCase()}

DATOS DE MERCADO ACTUALIZADOS:
${marketDataText || 'No hay datos específicos disponibles para esta consulta.'}

CONSULTA DEL CLIENTE: "${query}"

INSTRUCCIONES CRÍTICAS:
1. SOLO usa los datos exactos proporcionados arriba - NO inventes precios
2. Si los datos muestran [DATOS REALES], menciona que son precios actuales del mercado
3. Si muestran [SIMULADO], advierte que son datos de demostración
4. Da recomendaciones específicas: precios de entrada, stop-loss, targets
5. Incluye análisis técnico real basado en RSI, soportes, resistencias mostrados
6. Identifica riesgos específicos del momento y contexto macro actual
7. ${userPlan === 'premium' ? 'PREMIUM: Incluye múltiples escenarios, correlaciones, sizing de posición' : 'BÁSICO: Análisis conciso pero actionable'}
8. Timeframes específicos para cada recomendación
9. Si no tienes datos suficientes, dilo claramente

ESTRUCTURA OBLIGATORIA:
📊 ANÁLISIS [SÍMBOLO ESPECÍFICO]
💰 PRECIO ACTUAL Y INDICADORES TÉCNICOS
📈 ESCENARIO MÁS PROBABLE
⚠️ RIESGOS PRINCIPALES IDENTIFICADOS
🎯 RECOMENDACIÓN ESPECÍFICA (entrada/stop/target)
⏰ TIMEFRAME Y SEGUIMIENTO
💡 DISCLAIMER PROFESIONAL

TONO: Directo, basado en datos, sin generalidades. Como un analista institucional.
LONGITUD: Máximo ${userPlan === 'premium' ? '600' : '350'} palabras.

IMPORTANTE: Basa tu respuesta ÚNICAMENTE en los datos de mercado proporcionados arriba.`;
  }

  generateFallbackAnalysis(query) {
    return `📊 ANÁLISIS TEMPORAL NO DISPONIBLE

La consulta "${query}" no puede ser procesada con datos de mercado en tiempo real en este momento.

⚠️ SISTEMA EN MODO LIMITADO:
• APIs de datos financieros experimentando latencia
• Análisis de IA temporalmente restringido
• Recomendaciones específicas no disponibles

🔄 RECOMENDACIÓN:
Intenta nuevamente en unos minutos. Para análisis profesionales confiables, necesitamos datos de mercado actualizados.

💡 Mientras tanto, puedes consultar fuentes como Yahoo Finance, Bloomberg o TradingView para precios actuales.`;
  }
}

// Instancia global del sistema
const marketSystem = new RealMarketDataSystem();

// Inicialización de base de datos
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

    try {
      await client.query(`ALTER TABLE users ADD COLUMN queries_used INTEGER DEFAULT 0`);
      console.log('✅ Columna queries_used agregada');
    } catch (error) {
      if (error.code === '42701') {
        console.log('✅ Columna queries_used ya existe');
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        market_data JSONB,
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
    version: '3.1 - REAL DATA',
    features: ['Real-time market data via Alpha Vantage', 'Professional Claude analysis', 'Technical indicators'],
    dataSource: process.env.ALPHA_VANTAGE_API_KEY ? 'Real market data' : 'Simulated data',
    lastMarketUpdate: marketSystem.lastUpdate,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      claude_ai: process.env.ANTHROPIC_API_KEY ? 'professional' : 'unavailable',
      market_data: process.env.ALPHA_VANTAGE_API_KEY ? 'alpha_vantage_real' : 'simulated_fallback'
    },
    marketData: {
      lastUpdate: marketSystem.lastUpdate,
      symbolsTracked: marketSystem.marketData.size,
      cacheSize: marketSystem.cache.size,
      dataSource: process.env.ALPHA_VANTAGE_API_KEY ? 'Alpha Vantage API' : 'Fallback simulation'
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
          technical_analysis: true,
          professional_ai: process.env.ANTHROPIC_API_KEY ? true : false,
          data_source: process.env.ALPHA_VANTAGE_API_KEY ? 'Alpha Vantage Real Data' : 'Simulated Data'
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

    // Generar análisis con datos reales
    const response = await marketSystem.generateProfessionalAnalysis(message, userId, user.subscription_plan);

    const updateClient = await pool.connect();
    try {
      await updateClient.query(
        'UPDATE users SET queries_used = COALESCE(queries_used, 0) + 1 WHERE id = $1',
        [userId]
      );

      // Guardar historial con datos de mercado
      await updateClient.query(
        'INSERT INTO chat_history (user_id, message, response, market_data) VALUES ($1, $2, $3, $4)',
        [userId, message, response, JSON.stringify(Object.fromEntries(marketSystem.marketData))]
      );
    } finally {
      updateClient.release();
    }

    console.log(`💬 Análisis profesional con datos reales procesado para usuario ${userId}`);

    res.json({
      response,
      queries_remaining: userLimit - (user.queries_used + 1),
      plan: user.subscription_plan,
      upgrade_available: user.subscription_plan === 'free',
      market_data_timestamp: marketSystem.lastUpdate,
      data_source: process.env.ALPHA_VANTAGE_API_KEY ? 'Alpha Vantage Real Data' : 'Simulated'
    });

  } catch (error) {
    console.error('Error en chat profesional:', error);
    res.status(500).json({ error: 'Error procesando análisis profesional' });
  }
});

// Endpoint para obtener datos de mercado actualizados
app.get('/api/market-data', authenticateToken, async (req, res) => {
  try {
    // Solo actualizar si han pasado más de 5 minutos
    const shouldUpdate = !marketSystem.lastUpdate || 
                        (Date.now() - new Date(marketSystem.lastUpdate).getTime()) > 5 * 60 * 1000;
    
    if (shouldUpdate) {
      console.log('🔄 Actualizando datos de mercado...');
      await marketSystem.fetchRealMarketData();
    }
    
    const marketData = Object.fromEntries(marketSystem.marketData);
    
    res.json({
      data: marketData,
      lastUpdate: marketSystem.lastUpdate,
      source: process.env.ALPHA_VANTAGE_API_KEY ? 'alpha_vantage_real' : 'simulated',
      cacheSize: marketSystem.cache.size,
      symbolsCount: Object.keys(marketData).length
    });
  } catch (error) {
    console.error('Error obteniendo datos de mercado:', error);
    res.status(500).json({ error: 'Error obteniendo datos de mercado' });
  }
});

// Endpoint para forzar actualización de datos (solo para testing)
app.post('/api/refresh-market-data', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Actualizacion forzada de datos de mercado...');
    const updatedData = await marketSystem.fetchRealMarketData();
    
    res.json({
      message: 'Datos de mercado actualizados',
      data: updatedData,
      lastUpdate: marketSystem.lastUpdate,
      source: process.env.ALPHA_VANTAGE_API_KEY ? 'alpha_vantage_real' : 'simulated'
    });
  } catch (error) {
    console.error('Error actualizando datos:', error);
    res.status(500).json({ error: 'Error actualizando datos de mercado' });
  }
});

const startServer = async () => {
  try {
    await initDatabase();
    
    // Inicializar con datos de mercado reales al arrancar
    console.log('🚀 Inicializando sistema con datos de mercado...');
    await marketSystem.fetchRealMarketData();
    
    app.listen(PORT, () => {
      console.log(`🚀 SmartProIA Professional v3.1 - Puerto ${PORT}`);
      console.log(`🧠 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Deshabilitado'}`);
      console.log(`📊 Alpha Vantage: ${process.env.ALPHA_VANTAGE_API_KEY ? 'DATOS REALES habilitados' : 'Solo datos simulados'}`);
      console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'PostgreSQL conectada' : 'Desconectada'}`);
      console.log(`📈 Símbolos rastreados: ${marketSystem.marketData.size}`);
      console.log(`⏰ Última actualización: ${marketSystem.lastUpdate}`);
      console.log('=== SISTEMA PROFESIONAL CON DATOS REALES ===');
    });

  } catch (error) {
    console.error('❌ Error crítico al iniciar:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor...');
  if (pool) await pool.end();
  process.exit(0);
});

// Actualización periódica de datos cada 30 minutos
setInterval(async () => {
  try {
    console.log('🔄 Actualización automática de datos de mercado...');
    await marketSystem.fetchRealMarketData();
  } catch (error) {
    console.error('Error en actualización automática:', error);
  }
}, 30 * 60 * 1000); // 30 minutos

startServer();

module.exports = app;
