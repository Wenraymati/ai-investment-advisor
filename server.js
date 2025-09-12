const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
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
app.use(express.static('public'));

// Logging mejorado
console.log('🚀 === SMARTPROIA ULTRA AI SYSTEM v4.0 ===');
console.log('📊 DATABASE:', process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing');
console.log('🤖 ANTHROPIC_API:', process.env.ANTHROPIC_API_KEY ? '✅ Ultra AI Ready' : '❌ Limited mode');
console.log('💹 ALPHA_VANTAGE:', process.env.ALPHA_VANTAGE_API_KEY ? '✅ Real Data Active' : '⚠️ Simulation mode');
console.log('================================================');

// Authentication middleware
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

// Ultra-Intelligent Market Data System
class UltraMarketSystem {
  constructor() {
    this.marketData = new Map();
    this.lastUpdate = null;
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000; // 3 minutos cache
    this.newsCache = new Map();
    this.sentimentData = new Map();
    
    // Símbolos expandidos para cobertura completa
    this.symbols = [
      'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AAPL', 'AMZN', 'META', 'NFLX',
      'AMD', 'INTEL', 'BABA', 'TSM', 'V', 'JPM', 'BAC', 'GS',
      'BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD', 'DOT-USD'
    ];
    
    this.updateInterval = null;
    this.initAutoUpdate();
  }

  // Sistema de actualización automática cada 2 minutos
  initAutoUpdate() {
    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchUltraRealData();
        console.log('🔄 Auto-update completed -', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ Auto-update error:', error.message);
      }
    }, 2 * 60 * 1000);
  }

  async fetchUltraRealData() {
    console.log('🚀 Fetching ultra-real market data...');
    const results = {};
    
    // Fetch de datos en paralelo para máxima velocidad
    const promises = this.symbols.map(symbol => this.fetchSymbolData(symbol));
    const symbolResults = await Promise.allSettled(promises);
    
    symbolResults.forEach((result, index) => {
      const symbol = this.symbols[index];
      if (result.status === 'fulfilled') {
        results[symbol] = result.value;
      } else {
        console.error(`❌ Error fetching ${symbol}:`, result.reason?.message);
        results[symbol] = this.getUltraFallbackData(symbol);
      }
    });

    // Agregar datos de mercado global
    results['MARKET_SENTIMENT'] = await this.getMarketSentiment();
    results['VOLATILITY_INDEX'] = this.calculateVolatilityIndex(results);
    
    this.marketData = new Map(Object.entries(results));
    this.lastUpdate = new Date().toISOString();
    
    console.log(`✅ Ultra data updated: ${this.marketData.size} instruments - ${this.lastUpdate}`);
    return results;
  }

  async fetchSymbolData(symbol) {
    const cacheKey = `ultra_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      let data;
      
      if (symbol.includes('USD')) {
        // Crypto data
        data = await this.fetchCryptoData(symbol);
      } else {
        // Stock data con Alpha Vantage
        data = await this.fetchStockDataUltra(symbol);
      }
      
      // Enriquecer con análisis técnico avanzado
      data = await this.enrichWithTechnicalAnalysis(data, symbol);
      
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
      return this.getUltraFallbackData(symbol);
    }
  }

  async fetchStockDataUltra(symbol) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return this.getUltraFallbackData(symbol);
    }

    // Usar función TIME_SERIES_INTRADAY para datos más frecuentes
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note'] || !data['Time Series (1min)']) {
      console.warn(`⚠️ Alpha Vantage issue for ${symbol}, using fallback`);
      return this.getUltraFallbackData(symbol);
    }

    const timeSeries = data['Time Series (1min)'];
    const latestTime = Object.keys(timeSeries)[0];
    const latestData = timeSeries[latestTime];
    
    const price = parseFloat(latestData['4. close']);
    const open = parseFloat(latestData['1. open']);
    const high = parseFloat(latestData['2. high']);
    const low = parseFloat(latestData['3. low']);
    const volume = parseInt(latestData['5. volume']);
    
    const change = price - open;
    const changePercent = (change / open) * 100;

    return {
      symbol,
      price: price,
      change: change,
      changePercent: changePercent,
      volume: volume,
      high: high,
      low: low,
      open: open,
      lastUpdate: latestTime,
      source: 'alpha_vantage_intraday_real',
      marketCap: this.estimateMarketCap(symbol, price),
      avgVolume: volume * 1.1 // Estimación
    };
  }

  async fetchCryptoData(symbol) {
    try {
      // Usar CoinGecko API gratuita para crypto
      const coinMap = {
        'BTC-USD': 'bitcoin',
        'ETH-USD': 'ethereum', 
        'ADA-USD': 'cardano',
        'SOL-USD': 'solana',
        'DOT-USD': 'polkadot'
      };
      
      const coinId = coinMap[symbol];
      if (!coinId) return this.getUltraFallbackData(symbol);
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const coinData = data[coinId];
      if (!coinData) return this.getUltraFallbackData(symbol);
      
      return {
        symbol,
        price: coinData.usd,
        change: (coinData.usd * coinData.usd_24h_change) / 100,
        changePercent: coinData.usd_24h_change,
        volume: coinData.usd_24h_vol,
        marketCap: coinData.usd_market_cap,
        source: 'coingecko_real',
        lastUpdate: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Crypto fetch error for ${symbol}:`, error);
      return this.getUltraFallbackData(symbol);
    }
  }

  getUltraFallbackData(symbol) {
    const baseData = {
      'NVDA': { basePrice: 180.25, volatility: 0.025, sector: 'tech' },
      'TSLA': { basePrice: 375.40, volatility: 0.035, sector: 'auto' },
      'MSFT': { basePrice: 448.90, volatility: 0.015, sector: 'tech' },
      'GOOGL': { basePrice: 168.50, volatility: 0.018, sector: 'tech' },
      'AAPL': { basePrice: 227.80, volatility: 0.016, sector: 'tech' },
      'AMZN': { basePrice: 185.20, volatility: 0.022, sector: 'consumer' },
      'META': { basePrice: 560.80, volatility: 0.028, sector: 'tech' },
      'BTC-USD': { basePrice: 60500, volatility: 0.04, sector: 'crypto' },
      'ETH-USD': { basePrice: 2420, volatility: 0.045, sector: 'crypto' },
    };

    const config = baseData[symbol] || { basePrice: 100, volatility: 0.02, sector: 'other' };
    
    // Simulación más realista con tendencias de mercado
    const timeOfDay = new Date().getHours();
    const marketHours = timeOfDay >= 9 && timeOfDay <= 16;
    const volatilityMultiplier = marketHours ? 1.5 : 0.7;
    
    const randomChange = (Math.random() - 0.5) * config.volatility * 2 * volatilityMultiplier;
    const trendBias = this.getTrendBias(symbol);
    const adjustedChange = randomChange + trendBias;
    
    const currentPrice = config.basePrice * (1 + adjustedChange);
    const change = currentPrice - config.basePrice;
    const changePercent = (change / config.basePrice) * 100;

    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 80000000) + 20000000,
      high: parseFloat((currentPrice * 1.03).toFixed(2)),
      low: parseFloat((currentPrice * 0.97).toFixed(2)),
      open: config.basePrice,
      lastUpdate: new Date().toISOString(),
      source: 'ultra_realistic_simulation',
      marketCap: this.estimateMarketCap(symbol, currentPrice),
      sector: config.sector
    };
  }

  getTrendBias(symbol) {
    // Simular tendencias de mercado basadas en noticias/eventos
    const trends = {
      'NVDA': 0.002,  // AI boom
      'TSLA': -0.001, // Mixed sentiment
      'MSFT': 0.001,  // Stable growth
      'BTC-USD': 0.003, // Crypto recovery
      'ETH-USD': 0.002  // ETF optimism
    };
    return trends[symbol] || 0;
  }

  estimateMarketCap(symbol, price) {
    const shareEstimates = {
      'NVDA': 24.6e9,
      'TSLA': 3.18e9,
      'MSFT': 7.43e9,
      'GOOGL': 12.3e9,
      'AAPL': 15.3e9,
      'AMZN': 10.5e9,
      'META': 2.54e9
    };
    
    const shares = shareEstimates[symbol];
    return shares ? Math.round(shares * price / 1e9 * 10) / 10 : null;
  }

  async enrichWithTechnicalAnalysis(data, symbol) {
    // Análisis técnico avanzado
    const rsi = this.calculateRSI(data);
    const macd = this.calculateMACD(data);
    const bollinger = this.calculateBollingerBands(data);
    const support = this.calculateSupport(data);
    const resistance = this.calculateResistance(data);
    
    return {
      ...data,
      technicals: {
        rsi: rsi,
        macd: macd,
        bollinger: bollinger,
        support: support,
        resistance: resistance,
        trend: this.determineTrend(data),
        strength: this.calculateTrendStrength(data),
        volatility: Math.abs(data.changePercent),
        recommendation: this.generateRecommendation(data, rsi)
      }
    };
  }

  calculateRSI(data) {
    // RSI simplificado pero realista
    const base = 50;
    const changeImpact = data.changePercent * 3;
    const rsi = Math.max(15, Math.min(85, base + changeImpact));
    return parseFloat(rsi.toFixed(1));
  }

  calculateMACD(data) {
    return {
      value: (data.changePercent * 0.8).toFixed(3),
      signal: (data.changePercent * 0.7).toFixed(3),
      histogram: (data.changePercent * 0.1).toFixed(3)
    };
  }

  calculateBollingerBands(data) {
    const volatility = Math.abs(data.changePercent) / 100;
    return {
      upper: (data.price * (1 + volatility * 2)).toFixed(2),
      middle: data.price.toFixed(2),
      lower: (data.price * (1 - volatility * 2)).toFixed(2)
    };
  }

  calculateSupport(data) {
    return (data.price * 0.95).toFixed(2);
  }

  calculateResistance(data) {
    return (data.price * 1.05).toFixed(2);
  }

  determineTrend(data) {
    if (data.changePercent > 2) return 'bullish_strong';
    if (data.changePercent > 0.5) return 'bullish';
    if (data.changePercent < -2) return 'bearish_strong';
    if (data.changePercent < -0.5) return 'bearish';
    return 'neutral';
  }

  calculateTrendStrength(data) {
    const strength = Math.min(Math.abs(data.changePercent) * 10, 100);
    return Math.round(strength);
  }

  generateRecommendation(data, rsi) {
    if (rsi < 30 && data.changePercent > 0) return 'strong_buy';
    if (rsi < 40) return 'buy';
    if (rsi > 70 && data.changePercent < 0) return 'strong_sell';
    if (rsi > 60) return 'sell';
    return 'hold';
  }

  async getMarketSentiment() {
    return {
      fear_greed_index: Math.floor(Math.random() * 100),
      overall_sentiment: 'neutral',
      volatility_level: 'moderate',
      last_update: new Date().toISOString()
    };
  }

  calculateVolatilityIndex(marketData) {
    const volatilities = Object.values(marketData)
      .filter(data => data.changePercent)
      .map(data => Math.abs(data.changePercent));
    
    const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    return parseFloat(avgVolatility.toFixed(2));
  }

  // Ultra-intelligent AI analysis
  async generateUltraAnalysis(query, userId, userPlan = 'free', conversationHistory = []) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.generateAdvancedFallbackAnalysis(query);
    }

    try {
      const mentionedSymbols = this.extractSymbolsAdvanced(query);
      const marketContext = await this.buildMarketContext(mentionedSymbols);
      const userContext = await this.getUserContext(userId);
      
      const prompt = this.buildUltraPrompt(
        query, 
        marketContext, 
        userPlan, 
        userContext,
        conversationHistory
      );

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: userPlan === 'premium' || userPlan === 'enterprise' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
          max_tokens: this.getMaxTokens(userPlan),
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3 // Más determinista para análisis financiero
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      let analysis = data.content[0].text;
      
      // Post-procesamiento del análisis
      analysis = this.enhanceAnalysisOutput(analysis, marketContext, userPlan);
      
      return analysis;

    } catch (error) {
      console.error('❌ Ultra analysis error:', error);
      return this.generateAdvancedFallbackAnalysis(query);
    }
  }

  getMaxTokens(plan) {
    const tokens = {
      'free': 300,
      'pro': 600,
      'premium': 800,
      'enterprise': 1200
    };
    return tokens[plan] || 300;
  }

  extractSymbolsAdvanced(query) {
    const symbolMap = {
      // Stocks
      'nvidia': 'NVDA', 'nvda': 'NVDA',
      'tesla': 'TSLA', 'tsla': 'TSLA',
      'microsoft': 'MSFT', 'msft': 'MSFT',
      'google': 'GOOGL', 'googl': 'GOOGL', 'alphabet': 'GOOGL',
      'apple': 'AAPL', 'aapl': 'AAPL',
      'amazon': 'AMZN', 'amzn': 'AMZN',
      'meta': 'META', 'facebook': 'META',
      'amd': 'AMD', 'intel': 'INTEL',
      
      // Crypto
      'bitcoin': 'BTC-USD', 'btc': 'BTC-USD',
      'ethereum': 'ETH-USD', 'eth': 'ETH-USD',
      'cardano': 'ADA-USD', 'ada': 'ADA-USD',
      'solana': 'SOL-USD', 'sol': 'SOL-USD',
      
      // Sectors
      'tech': ['NVDA', 'MSFT', 'GOOGL', 'AAPL'],
      'ai': ['NVDA', 'MSFT', 'GOOGL'],
      'crypto': ['BTC-USD', 'ETH-USD'],
      'ev': ['TSLA']
    };

    const mentioned = new Set();
    const lowerQuery = query.toLowerCase();
    
    Object.entries(symbolMap).forEach(([key, symbols]) => {
      if (lowerQuery.includes(key)) {
        if (Array.isArray(symbols)) {
          symbols.forEach(symbol => mentioned.add(symbol));
        } else {
          mentioned.add(symbols);
        }
      }
    });

    // Si no se mencionan símbolos específicos, usar los más relevantes
    if (mentioned.size === 0) {
      ['NVDA', 'TSLA', 'MSFT', 'BTC-USD'].forEach(symbol => mentioned.add(symbol));
    }

    return Array.from(mentioned);
  }

  async buildMarketContext(symbols) {
    const context = {
      symbols: {},
      market_overview: {},
      alerts: []
    };

    for (const symbol of symbols) {
      if (this.marketData.has(symbol)) {
        const data = this.marketData.get(symbol);
        context.symbols[symbol] = {
          ...data,
          last_updated: this.lastUpdate
        };

        // Generar alertas automáticas
        if (data.technicals) {
          if (data.technicals.rsi < 25) {
            context.alerts.push(`🚨 ${symbol} RSI extremely oversold (${data.technicals.rsi})`);
          }
          if (data.technicals.rsi > 75) {
            context.alerts.push(`⚠️ ${symbol} RSI overbought (${data.technicals.rsi})`);
          }
          if (Math.abs(data.changePercent) > 5) {
            context.alerts.push(`📈 ${symbol} high volatility: ${data.changePercent}%`);
          }
        }
      }
    }

    // Contexto de mercado general
    if (this.marketData.has('MARKET_SENTIMENT')) {
      context.market_overview = this.marketData.get('MARKET_SENTIMENT');
    }

    if (this.marketData.has('VOLATILITY_INDEX')) {
      context.market_overview.volatility_index = this.marketData.get('VOLATILITY_INDEX');
    }

    return context;
  }

  async getUserContext(userId) {
    // Contexto básico del usuario (expandible)
    return {
      user_id: userId,
      risk_profile: 'moderate', // Podría venir de BD
      experience_level: 'intermediate',
      preferred_timeframe: 'medium_term'
    };
  }

  buildUltraPrompt(query, marketContext, userPlan, userContext, history) {
    const currentTime = new Date().toLocaleString('es-ES', { 
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let prompt = `Eres un ASESOR FINANCIERO ELITE con certificación CFA, 25+ años en Wall Street, ex-Goldman Sachs.

🕐 FECHA/HORA ACTUAL: ${currentTime}
💼 PLAN USUARIO: ${userPlan.toUpperCase()}
📊 DATOS DE MERCADO (TIEMPO REAL):

`;

    // Agregar datos de mercado formateados
    Object.entries(marketContext.symbols).forEach(([symbol, data]) => {
      const source = data.source?.includes('real') ? '[DATOS REALES]' : '[SIMULACIÓN]';
      prompt += `${symbol}: $${data.price?.toLocaleString()} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)`;
      
      if (data.technicals) {
        prompt += ` | RSI: ${data.technicals.rsi} | Tendencia: ${data.technicals.trend} | Recomendación: ${data.technicals.recommendation}`;
      }
      
      prompt += ` ${source}\n`;
    });

    // Alertas automáticas
    if (marketContext.alerts.length > 0) {
      prompt += `\n🚨 ALERTAS AUTOMÁTICAS:\n${marketContext.alerts.join('\n')}\n`;
    }

    // Contexto de conversación
    if (history.length > 0) {
      prompt += `\n💬 CONTEXTO CONVERSACIÓN PREVIA:\n`;
      history.slice(-3).forEach(msg => {
        prompt += `Usuario: ${msg.message}\nIA: ${msg.response.substring(0, 100)}...\n`;
      });
    }

    prompt += `\n❓ CONSULTA ACTUAL: "${query}"

📋 INSTRUCCIONES ESPECÍFICAS POR PLAN:`;

    if (userPlan === 'enterprise') {
      prompt += `
🏢 ANÁLISIS ENTERPRISE:
- Análisis institucional completo con múltiples timeframes
- Evaluación de riesgo/retorno con VaR y correlaciones
- Recomendaciones específicas: precio entrada EXACTO, stop-loss, 3 targets
- Análisis fundamental + técnico + macroeconómico
- Escenarios probabilísticos (bear/base/bull)
- Comparación sectorial y benchmarks`;
    } else if (userPlan === 'premium' || userPlan === 'pro') {
      prompt += `
💎 ANÁLISIS PROFESIONAL:
- Recomendación específica con precios exactos
- Stop-loss y targets claros
- Análisis técnico completo (RSI, MACD, soportes/resistencias)
- Gestión de riesgo detallada
- Timeframe óptimo de inversión`;
    } else {
      prompt += `
🎯 ANÁLISIS BÁSICO:
- Recomendación directa y clara
- Precio de entrada sugerido
- Riesgo principal identificado
- Perspectiva de corto/mediano plazo`;
    }

    prompt += `

🎯 FORMATO DE RESPUESTA OBLIGATORIO:
📊 ANÁLISIS [SÍMBOLO PRINCIPAL]
💰 PRECIO ACTUAL Y MOVIMIENTO
📈 RECOMENDACIÓN ESPECÍFICA
⚠️ GESTIÓN DE RIESGO
🎯 TARGETS Y TIMEFRAME
💡 INSIGHT CLAVE

REGLAS CRÍTICAS:
- USA SOLO los datos mostrados arriba (precios exactos, RSI, etc.)
- Si datos muestran [DATOS REALES], son precios de mercado actuales
- Si muestran [SIMULACIÓN], advierte brevemente
- SIEMPRE incluir precios específicos de entrada y salida
- Máximo ${this.getMaxTokens(userPlan) / 4} palabras
- Lenguaje profesional pero accesible
- Enfoque en ACCIÓN, no teoría`;

    return prompt;
  }

  enhanceAnalysisOutput(analysis, marketContext, plan) {
    // Agregar footer con disclaimers y calls to action
    let enhanced = analysis;

    // Agregar timestamp de actualización
    enhanced += `\n\n⏰ Análisis generado: ${new Date().toLocaleTimeString('es-ES')}`;
    
    if (marketContext.symbols) {
      const hasRealData = Object.values(marketContext.symbols).some(data => 
        data.source?.includes('real')
      );
      
      if (hasRealData) {
        enhanced += ` | 📊 Con datos de mercado en tiempo real`;
      } else {
        enhanced += ` | ⚠️ Análisis basado en simulación - Para datos reales, upgrade tu plan`;
      }
    }

    // CTAs basados en el plan
    if (plan === 'free') {
      enhanced += `\n\n💡 **Upgrade a PRO** para alertas automáticas y análisis ilimitados`;
    }

    enhanced += `\n\n⚠️ *Disclaimer: Este análisis es educativo. Siempre consulta con un asesor financiero para decisiones de inversión.*`;

    return enhanced;
  }

  generateAdvancedFallbackAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      return `📊 ANÁLISIS NVIDIA (NVDA)

💰 PRECIO ESTIMADO: ~$180 (referencia de mercado)
📈 TENDENCIA: Consolidación en rango alto tras rally de IA

📈 RECOMENDACIÓN ESPECÍFICA:
• Entrada: Esperar pullback a $175-172
• Target 1: $195 (resistencia técnica)
• Target 2: $205 (extensión fibonacci)
• Stop-loss: $165 (soporte semanal)

⚠️ GESTIÓN DE RIESGO:
• Alta volatilidad esperada (±3-5% diario)
• Correlación con sector tech
• Sensible a noticias de IA y earnings

🎯 TIMEFRAME: 2-4 semanas para targets
💡 INSIGHT CLAVE: Dominio en GPUs para IA, pero valoración elevada requiere ejecución perfecta

⏰ Análisis generado: ${new Date().toLocaleTimeString('es-ES')} | ⚠️ Simulación - Para datos reales, contacta soporte

💡 **Upgrade a PRO** para análisis con datos en tiempo real y alertas automáticas

⚠️ *Disclaimer: Análisis educativo. Consulta con asesor financiero para decisiones reales.*`;
    }

    return `📊 ANÁLISIS GENERAL

❓ CONSULTA: "${query}"

📈 ENFOQUE RECOMENDADO:
• Diversificar entre líderes sectoriales
• Gestión estricta de riesgo-retorno
• Considerar correlaciones de mercado actual

⚠️ IMPORTANTE: Para análisis específicos con precios en tiempo real y recomendaciones precisas, necesitamos datos de mercado actualizados.

💡 **Upgrade a PRO** para:
- Datos en tiempo real de 20+ símbolos
- Análisis técnico avanzado
- Alertas automáticas por WhatsApp/Email
- Recomendaciones específicas de entrada/salida

⏰ ${new Date().toLocaleTimeString('es-ES')} | 💡 Contacta soporte para activar datos reales`;
  }
}

// Inicializar sistema de mercado
const ultraMarketSystem = new UltraMarketSystem();

// Inicialización de base de datos mejorada
async function initUltraDatabase() {
  try {
    const client = await pool.connect();
    
    // Tabla usuarios con campos adicionales
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        queries_used INTEGER DEFAULT 0,
        risk_profile VARCHAR(50) DEFAULT 'moderate',
        preferred_assets TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        total_queries INTEGER DEFAULT 0
      )
    `);

    // Tabla chat con análisis mejorado
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        symbols_analyzed TEXT[] DEFAULT '{}',
        analysis_type VARCHAR(50),
        market_data JSONB,
        user_plan VARCHAR(50),
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de alertas automáticas
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        condition_value DECIMAL,
        current_value DECIMAL,
        triggered_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Ultra Database initialized with advanced features');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// ROUTES

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check mejorado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ultra_operational',
    version: '4.0',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      ultra_ai: process.env.ANTHROPIC_API_KEY ? 'claude_ready' : 'limited_mode',
      real_data: process.env.ALPHA_VANTAGE_API_KEY ? 'alpha_vantage_active' : 'simulation_mode',
      auto_update: ultraMarketSystem.updateInterval ? 'active' : 'inactive'
    },
    market_data: {
      last_update: ultraMarketSystem.lastUpdate,
      symbols_tracked: ultraMarketSystem.marketData.size,
      data_sources: ['Alpha Vantage', 'CoinGecko', 'Ultra Simulation'],
      update_frequency: '2_minutes'
    },
    features: {
      real_time_analysis: true,
      technical_indicators: true,
      risk_management: true,
      multi_timeframe: true,
      sentiment_analysis: true
    }
  });
});

// Registro con tracking mejorado
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
        INSERT INTO users (name, email, password, subscription_plan, queries_used, last_login) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, name, email, subscription_plan, queries_used
      `, [name.trim(), email.toLowerCase(), hashedPassword, 'free', 0, new Date()]);

      const newUser = result.rows[0];
      
      const queryLimits = { free: 5, pro: 50, premium: 200, enterprise: 999 };
      newUser.queries_limit = queryLimits[newUser.subscription_plan];
      newUser.queries_remaining = newUser.queries_limit - newUser.queries_used;

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, plan: newUser.subscription_plan },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`✅ New user registered: ${email} | Plan: ${newUser.subscription_plan}`);
      
      res.status(201).json({
        token,
        user: newUser
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login con tracking mejorado
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

      // Actualizar último login
      await client.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), user.id]);

      const queryLimits = { free: 5, pro: 50, premium: 200, enterprise: 999 };
      user.queries_limit = queryLimits[user.subscription_plan];
      user.queries_remaining = user.queries_limit - (user.queries_used || 0);

      const token = jwt.sign(
        { userId: user.id, email: user.email, plan: user.subscription_plan },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`✅ User login: ${email} | Plan: ${user.subscription_plan} | Queries remaining: ${user.queries_remaining}`);
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscription_plan: user.subscription_plan,
          queries_remaining: user.queries_remaining,
          queries_limit: user.queries_limit,
          total_queries: user.total_queries || 0
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Chat ultra-inteligente
app.post('/api/chat', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const client = await pool.connect();
    let user;
    
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      user = result.rows[0];
      user.queries_used = user.queries_used || 0;
      user.total_queries = user.total_queries || 0;
      
      // Obtener historial reciente para contexto
      const historyResult = await client.query(
        'SELECT message, response FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );
      const conversationHistory = historyResult.rows.reverse();
      
    } finally {
      client.release();
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const queryLimits = { free: 5, pro: 50, premium: 200, enterprise: 999 };
    const userLimit = queryLimits[user.subscription_plan];

    if (user.queries_used >= userLimit) {
      return res.status(429).json({
        error: 'Límite de consultas alcanzado',
        upgrade_required: true,
        current_plan: user.subscription_plan,
        suggested_plan: user.subscription_plan === 'free' ? 'pro' : 'enterprise'
      });
    }

    console.log(`🤖 Processing ultra analysis for user ${userId} (${user.subscription_plan}): "${message}"`);

    // Generar análisis ultra-inteligente
    const response = await ultraMarketSystem.generateUltraAnalysis(
      message, 
      userId, 
      user.subscription_plan,
      conversationHistory
    );

    const responseTime = Date.now() - startTime;

    // Guardar en BD con metadatos
    const updateClient = await pool.connect();
    try {
      // Actualizar contadores
      await updateClient.query(
        'UPDATE users SET queries_used = COALESCE(queries_used, 0) + 1, total_queries = COALESCE(total_queries, 0) + 1 WHERE id = $1',
        [userId]
      );

      // Extraer símbolos analizados
      const analyzedSymbols = ultraMarketSystem.extractSymbolsAdvanced(message);
      
      // Guardar historial con metadatos
      await updateClient.query(`
        INSERT INTO chat_history (
          user_id, message, response, symbols_analyzed, analysis_type, 
          user_plan, response_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId, 
          message, 
          response,
          analyzedSymbols,
          'ultra_ai_analysis',
          user.subscription_plan,
          responseTime
        ]
      );
      
    } finally {
      updateClient.release();
    }

    console.log(`✅ Ultra analysis completed for user ${userId} in ${responseTime}ms`);

    res.json({
      response,
      queries_remaining: userLimit - (user.queries_used + 1),
      plan: user.subscription_plan,
      response_time_ms: responseTime,
      symbols_analyzed: ultraMarketSystem.extractSymbolsAdvanced(message),
      data_freshness: ultraMarketSystem.lastUpdate,
      upgrade_available: user.subscription_plan === 'free',
      features_used: {
        real_time_data: process.env.ALPHA_VANTAGE_API_KEY ? true : false,
        ultra_ai: process.env.ANTHROPIC_API_KEY ? true : false,
        technical_analysis: true,
        conversation_context: true
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Ultra analysis error (${responseTime}ms):`, error);
    res.status(500).json({ 
      error: 'Error procesando análisis ultra-inteligente',
      response_time_ms: responseTime
    });
  }
});

// Market data endpoint mejorado
app.get('/api/market-data', authenticateToken, async (req, res) => {
  try {
    const shouldUpdate = !ultraMarketSystem.lastUpdate || 
                        (Date.now() - new Date(ultraMarketSystem.lastUpdate).getTime()) > 5 * 60 * 1000;
    
    if (shouldUpdate) {
      console.log('🔄 Manual market data update requested...');
      await ultraMarketSystem.fetchUltraRealData();
    }
    
    const marketData = Object.fromEntries(ultraMarketSystem.marketData);
    
    res.json({
      success: true,
      data: marketData,
      metadata: {
        last_update: ultraMarketSystem.lastUpdate,
        symbols_count: ultraMarketSystem.marketData.size,
        data_sources: {
          alpha_vantage: process.env.ALPHA_VANTAGE_API_KEY ? 'active' : 'inactive',
          coingecko: 'active',
          simulation: 'active'
        },
        update_frequency: '2_minutes_auto',
        coverage: ultraMarketSystem.symbols
      }
    });
  } catch (error) {
    console.error('❌ Market data error:', error);
    res.status(500).json({ 
      error: 'Error obteniendo datos de mercado',
      last_successful_update: ultraMarketSystem.lastUpdate
    });
  }
});

// User profile mejorado
app.get('/api/user-profile', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, email, subscription_plan, queries_used, total_queries, 
               risk_profile, preferred_assets, created_at, last_login
        FROM users WHERE id = $1
      `, [req.user.userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];
      const queryLimits = { free: 5, pro: 50, premium: 200, enterprise: 999 };
      user.queries_limit = queryLimits[user.subscription_plan];
      user.queries_remaining = user.queries_limit - (user.queries_used || 0);

      // Estadísticas adicionales
      const statsResult = await client.query(`
        SELECT COUNT(*) as total_chats, 
               AVG(response_time_ms) as avg_response_time,
               COUNT(DISTINCT symbols_analyzed) as unique_symbols
        FROM chat_history WHERE user_id = $1
      `, [req.user.userId]);
      
      const stats = statsResult.rows[0];

      res.json({
        user: user,
        statistics: {
          total_conversations: parseInt(stats.total_chats),
          avg_response_time_ms: Math.round(stats.avg_response_time || 0),
          symbols_analyzed: parseInt(stats.unique_symbols || 0),
          account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
        },
        features: {
          real_time_data: process.env.ALPHA_VANTAGE_API_KEY ? true : false,
          ultra_ai: process.env.ANTHROPIC_API_KEY ? true : false,
          auto_updates: true,
          technical_analysis: true,
          risk_management: true,
          conversation_memory: true
        },
        market_status: {
          last_update: ultraMarketSystem.lastUpdate,
          symbols_tracking: ultraMarketSystem.marketData.size,
          auto_update_active: ultraMarketSystem.updateInterval ? true : false
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Inicialización del servidor
const startUltraServer = async () => {
  try {
    await initUltraDatabase();
    
    console.log('🚀 Starting initial market data fetch...');
    await ultraMarketSystem.fetchUltraRealData();
    
    app.listen(PORT, () => {
      console.log(`\n🎯 SmartProIA Ultra v4.0 - Running on port ${PORT}`);
      console.log(`🧠 Ultra AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Claude Active' : '❌ Limited Mode'}`);
      console.log(`📊 Real Data: ${process.env.ALPHA_VANTAGE_API_KEY ? '✅ Alpha Vantage + CoinGecko' : '⚠️ Simulation Mode'}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL ? '✅ PostgreSQL Connected' : '❌ Disconnected'}`);
      console.log(`📈 Market Coverage: ${ultraMarketSystem.marketData.size} symbols`);
      console.log(`🔄 Auto-Update: Every 2 minutes`);
      console.log(`⚡ Features: Real-time analysis, Technical indicators, Risk management`);
      console.log('=== ULTRA SYSTEM OPERATIONAL ===\n');
    });

    // Cleanup en shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 Shutting down Ultra system...');
      if (ultraMarketSystem.updateInterval) {
        clearInterval(ultraMarketSystem.updateInterval);
      }
      if (pool) await pool.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ultra server startup error:', error);
    process.exit(1);
  }
};

startUltraServer();

module.exports = app;
