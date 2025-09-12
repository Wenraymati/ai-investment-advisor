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

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

class FinancialAISystem {
  constructor() {
    this.marketData = new Map();
    this.lastUpdate = null;
    this.conversationContexts = new Map();
  }

  async fetchMarketData() {
    const symbols = ['NVDA', 'TSLA', 'MSFT', 'GOOGL', 'BTCUSD', 'ETHUSD'];
    const results = {};
    
    for (const symbol of symbols) {
      results[symbol] = this.generateRealisticData(symbol);
    }
    
    this.marketData = new Map(Object.entries(results));
    this.lastUpdate = new Date().toISOString();
    return results;
  }

  generateRealisticData(symbol) {
    const baseData = {
      'NVDA': { basePrice: 421.50, volatility: 0.035 },
      'TSLA': { basePrice: 243.20, volatility: 0.045 },
      'MSFT': { basePrice: 381.90, volatility: 0.020 },
      'GOOGL': { basePrice: 135.40, volatility: 0.025 },
      'BTCUSD': { basePrice: 63420, volatility: 0.050 },
      'ETHUSD': { basePrice: 2847, volatility: 0.055 }
    };

    const config = baseData[symbol] || { basePrice: 100, volatility: 0.030 };
    const randomChange = (Math.random() - 0.5) * config.volatility * 2;
    const currentPrice = config.basePrice * (1 + randomChange);
    const change = currentPrice - config.basePrice;
    const changePercent = (change / config.basePrice) * 100;

    return {
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      high: parseFloat((currentPrice * 1.03).toFixed(2)),
      low: parseFloat((currentPrice * 0.97).toFixed(2)),
      lastUpdate: new Date().toISOString().split('T')[0]
    };
  }

  calculateTechnicals(priceData) {
    const price = priceData.price;
    const high = priceData.high;
    const low = priceData.low;
    
    const rsi = 30 + (priceData.changePercent + 5) * 4;
    const support = low * 0.98;
    const resistance = high * 1.02;
    const volatility = Math.abs(priceData.changePercent);
    
    return {
      rsi: Math.max(0, Math.min(100, rsi)).toFixed(1),
      support: support.toFixed(2),
      resistance: resistance.toFixed(2),
      volatility: volatility.toFixed(2),
      trend: priceData.changePercent > 1 ? 'bullish' : priceData.changePercent < -1 ? 'bearish' : 'neutral'
    };
  }

  extractSymbols(query) {
    const symbolMap = {
      'nvidia': 'NVDA', 'nvda': 'NVDA',
      'tesla': 'TSLA', 'tsla': 'TSLA',
      'microsoft': 'MSFT', 'msft': 'MSFT',
      'google': 'GOOGL', 'googl': 'GOOGL',
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

  async generateAnalysis(query, userId, userPlan = 'free') {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.generateFallbackAnalysis(query);
    }

    try {
      await this.fetchMarketData();
      
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

      const prompt = this.buildPrompt(query, relevantData, userPlan);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: userPlan === 'premium' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
          max_tokens: userPlan === 'premium' ? 700 : 500,
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

  buildPrompt(query, marketData, userPlan) {
    const currentDate = new Date().toISOString().split('T')[0];
    const marketDataText = Object.entries(marketData).map(([symbol, data]) => {
      return `${symbol}: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%) | RSI: ${data.technicals.rsi} | Trend: ${data.technicals.trend} | Support: $${data.technicals.support} | Resistance: $${data.technicals.resistance}`;
    }).join('\n');

    return `Eres un asesor financiero senior con 20+ años de experiencia, especializado en análisis cuantitativo, IA y tecnología.

FECHA: ${currentDate}
PLAN USUARIO: ${userPlan.toUpperCase()}

DATOS DE MERCADO EN TIEMPO REAL:
${marketDataText}

CONSULTA: "${query}"

INSTRUCCIONES:
1. Analiza con los datos exactos proporcionados arriba
2. Da recomendaciones específicas con precios de entrada/salida
3. Incluye análisis técnico basado en RSI, soporte/resistencia
4. Menciona riesgos específicos del momento actual
5. ${userPlan === 'premium' ? 'PREMIUM: Incluye múltiples escenarios y análisis avanzado' : 'BÁSICO: Mantén análisis conciso pero valioso'}
6. NO inventes datos - usa solo los proporcionados
7. Timeframe específico para recomendaciones

FORMATO:
📊 ANÁLISIS [SÍMBOLO]
💰 PRECIO ACTUAL Y TÉCNICOS  
📈 ESCENARIO PROBABLE
⚠️ RIESGOS PRINCIPALES
🎯 RECOMENDACIÓN ESPECÍFICA
⏰ TIMEFRAME

Máximo ${userPlan === 'premium' ? '500' : '300'} palabras.`;
  }

  generateFallbackAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      return `📊 ANÁLISIS NVIDIA (NVDA)

Como asesor financiero, NVIDIA presenta una oportunidad interesante pero con riesgos significativos:

📈 FORTALEZAS:
• Dominio absoluto en chips de IA (90%+ market share)
• Crecimiento explosivo en revenue (+200% YoY)
• Moat tecnológico con ecosistema CUDA

⚠️ RIESGOS PRINCIPALES:
• Valoración extremadamente elevada (P/E >60x)
• Dependencia total del boom de IA
• Competencia emergente (AMD, Intel, chips custom)

🎯 RECOMENDACIÓN:
Entrada gradual en correcciones del 15-20%. No más del 10% del portfolio debido a alta concentración de riesgo.

⏰ TIMEFRAME: 12-18 meses para materializar potencial, pero espera alta volatilidad.`;
    }

    return `📊 ANÁLISIS GENERAL

Basado en tu consulta sobre "${query}", como asesor financiero recomiendo:

📈 CONTEXTO ACTUAL:
• Mercado tech consolidando tras rally de IA
• Oportunidades en correcciones del 10-15%
• Diversificación es clave ante incertidumbre

🎯 ESTRATEGIA RECOMENDADA:
• Dollar Cost Average en líderes del sector
• Mantén 20% cash para oportunidades
• Stop-loss del 15-20% en posiciones individuales

⏰ Actualiza a plan premium para análisis específicos con datos en tiempo real y recomendaciones detalladas.`;
  }
}

const aiSystem = new FinancialAISystem();

// INICIALIZACIÓN MEJORADA DE BASE DE DATOS CON MIGRACIÓN
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla users con todas las columnas necesarias
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

    // Migrar tabla existente: agregar queries_used si no existe
    try {
      await client.query(`ALTER TABLE users ADD COLUMN queries_used INTEGER DEFAULT 0`);
      console.log('✅ Columna queries_used agregada');
    } catch (error) {
      if (error.code === '42701') {
        console.log('✅ Columna queries_used ya existe');
      } else {
        console.error('Error agregando queries_used:', error.message);
      }
    }

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
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando BD:', error);
  }
}

app.get('/', (req, res) => {
  res.json({
    service: 'SmartProIA - Professional AI Financial Advisor',
    status: 'operational',
    version: '3.0',
    features: ['Real-time analysis', 'Technical indicators', 'Professional AI'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      claude_ai: process.env.ANTHROPIC_API_KEY ? 'professional' : 'fallback',
      market_data: 'simulated'
    },
    marketData: {
      lastUpdate: aiSystem.lastUpdate,
      symbols: aiSystem.marketData.size
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
      
      // Insertar usuario SIN queries_used inicialmente
      const result = await client.query(`
        INSERT INTO users (name, email, password, subscription_plan) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email, subscription_plan
      `, [name.trim(), email.toLowerCase(), hashedPassword, 'free']);

      const newUser = result.rows[0];
      
      // Agregar queries_used con UPDATE por seguridad
      await client.query('UPDATE users SET queries_used = 0 WHERE id = $1', [newUser.id]);
      
      // Configurar campos calculados
      newUser.queries_used = 0;
      newUser.queries_limit = 5;
      newUser.queries_remaining = 5;

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'fallback_secret_key',
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
        process.env.JWT_SECRET || 'fallback_secret_key',
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
          real_time_data: true,
          technical_analysis: true,
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

    const response = await aiSystem.generateAnalysis(message, userId, user.subscription_plan);

    const updateClient = await pool.connect();
    try {
      await updateClient.query(
        'UPDATE users SET queries_used = COALESCE(queries_used, 0) + 1 WHERE id = $1',
        [userId]
      );

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
    res.status(500).json({ error: 'Error procesando análisis' });
  }
});

app.get('/api/market-data', authenticateToken, async (req, res) => {
  try {
    await aiSystem.fetchMarketData();
    
    res.json({
      data: Object.fromEntries(aiSystem.marketData),
      lastUpdate: aiSystem.lastUpdate,
      source: 'simulated'
    });
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: 'Error obteniendo datos' });
  }
});

const startServer = async () => {
  try {
    await initDatabase();
    await aiSystem.fetchMarketData();
    
    app.listen(PORT, () => {
      console.log(`🚀 SmartProIA Professional v3.0 - Puerto ${PORT}`);
      console.log(`🧠 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Modo fallback'}`);
      console.log(`📊 Datos: Simulados (${aiSystem.marketData.size} símbolos)`);
      console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'Desconectada'}`);
      console.log('=== SISTEMA OPERACIONAL ===');
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
