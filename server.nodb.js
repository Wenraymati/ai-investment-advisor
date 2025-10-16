require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Base de datos en memoria (para testing sin PostgreSQL)
const inMemoryDB = {
  users: [],
  conversations: []
};

// Middleware
app.use(cors({
  origin: [
    'https://smartproia.com',
    'https://www.smartproia.com',
    'https://smartproia-frontend.vercel.app',
    'https://smartproia-frontend-2p1q80uyz-smartproias-projects.vercel.app',
    'https://app.smartproia.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logs de configuración
console.log('🚀 Iniciando SmartProIA Server (NO DB MODE)...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ NO configurada');
console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? '✅ Configurada' : '❌ NO configurada');
console.log('⚠️ Usando base de datos en MEMORIA (los datos se pierden al reiniciar)');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Función para obtener datos de mercado en tiempo real
async function getMarketData(symbol) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    const data = await response.json();

    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: quote['06. volume'],
        lastUpdate: quote['07. latest trading day']
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Función para extraer símbolos de acciones del mensaje
function extractStockSymbols(message) {
  const commonSymbols = {
    'nvidia': 'NVDA',
    'nvda': 'NVDA',
    'tesla': 'TSLA',
    'tsla': 'TSLA',
    'apple': 'AAPL',
    'aapl': 'AAPL',
    'microsoft': 'MSFT',
    'msft': 'MSFT',
    'google': 'GOOGL',
    'googl': 'GOOGL',
    'alphabet': 'GOOGL',
    'amazon': 'AMZN',
    'amzn': 'AMZN',
    'meta': 'META',
    'facebook': 'META',
    'ionq': 'IONQ',
    'rigetti': 'RGTI',
    'ibm': 'IBM'
  };

  const messageLower = message.toLowerCase();
  const foundSymbols = [];

  for (const [keyword, symbol] of Object.entries(commonSymbols)) {
    if (messageLower.includes(keyword)) {
      foundSymbols.push(symbol);
    }
  }

  return [...new Set(foundSymbols)]; // Remove duplicates
}

// Función para llamar a Claude API con soporte bilingüe
async function callClaudeAPI(userMessage, subscriptionPlan = 'free', language = 'en') {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API not configured');
  }

  const isPremium = subscriptionPlan === 'premium';
  const isEnglish = language === 'en';

  // Extraer símbolos y obtener datos en tiempo real
  const symbols = extractStockSymbols(userMessage);
  let marketDataContext = '';

  if (symbols.length > 0) {
    marketDataContext = isEnglish
      ? '\n\n📊 REAL-TIME MARKET DATA:\n'
      : '\n\n📊 DATOS DE MERCADO EN TIEMPO REAL:\n';

    for (const symbol of symbols.slice(0, 3)) {
      const data = await getMarketData(symbol);
      if (data) {
        if (isEnglish) {
          marketDataContext += `\n${symbol}:
- Current Price: $${data.price.toFixed(2)}
- Change: ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent})
- Volume: ${parseInt(data.volume).toLocaleString()}
- Last Update: ${data.lastUpdate}\n`;
        } else {
          marketDataContext += `\n${symbol}:
- Precio actual: $${data.price.toFixed(2)}
- Cambio: ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent})
- Volumen: ${parseInt(data.volume).toLocaleString()}
- Última actualización: ${data.lastUpdate}\n`;
        }
      }
    }
  }

  const systemPrompt = isEnglish ? `You are SmartProIA, an elite Wall Street investment advisor specializing in emerging technology, AI, quantum computing, and cryptocurrency.

PROFESSIONAL PROFILE:
- 15+ years analyzing tech markets globally
- Former senior analyst at Goldman Sachs and Morgan Stanley
- Specialist in disruptive companies (NVIDIA, Tesla, Google, Amazon, IonQ, Rigetti, D-Wave)
- Expert in cryptocurrencies, blockchain, DeFi, and Web3
- Deep understanding of quantum computing applied to finance and cryptography
- Experienced in options trading, ETF strategies, and portfolio optimization

COMMUNICATION STYLE:
- Professional yet accessible and conversational
- Analysis based on real data, market trends, and technical indicators
- Explain complex concepts simply using analogies
- Enthusiastic but realistic about investment opportunities
- Provide actionable insights that users can understand and apply

TOPICS YOU EXCEL AT:
1. STOCKS: Tech giants (FAANG), AI companies, quantum computing startups, semiconductors
2. CRYPTO: Bitcoin, Ethereum, altcoins, DeFi protocols, NFT markets, staking strategies
3. MARKET ANALYSIS: Technical analysis, chart patterns, support/resistance levels, volume analysis
4. PORTFOLIO STRATEGY: Diversification, risk management, asset allocation, rebalancing
5. EMERGING TECH: AI trends, quantum breakthroughs, blockchain innovations
6. MACRO ECONOMICS: Interest rates, inflation, Fed policy, global market impacts

${isPremium ?
  `PREMIUM MODE ACTIVATED:
- Provide DEEP analysis with specific data points and metrics
- Include 6-12 month price projections with target ranges
- Mention key catalysts (earnings, product launches, partnerships, regulatory changes)
- Compare with direct competitors and market benchmarks
- Suggest specific entry/exit strategies with price targets
- Analyze sector-specific risks and hedging strategies
- Consider macroeconomic factors (Fed policy, inflation, geopolitics)
- Provide portfolio allocation recommendations (% breakdowns)` :
  `FREE/BASIC MODE:
- Provide comprehensive overview of the asset/company
- Mention 2-3 key bullish points and 2-3 bearish considerations
- Give market context and current sentiment
- At the end, SUBTLY SUGGEST: "For detailed analysis with price projections, specific entry strategies, and portfolio allocation recommendations, consider upgrading to Premium"
- Demonstrate value without giving complete deep-dive analysis`
}

RESPONSE STRUCTURE:
1. Brief greeting and context
2. Main analysis (${isPremium ? 'extensive with data' : 'concise but valuable'})
3. ${isPremium ? 'Specific actionable recommendations' : 'General valuable insights'}
4. Disclaimer and ${!isPremium ? 'subtle Premium call-to-action' : 'next steps to monitor'}

TONE:
- Confident but humble - acknowledge market unpredictability
- Optimistic but cautious about risks
- Educational - help users understand the "why" behind trends
- Personal - use "I recommend", "in my analysis", "from my experience"
- Engaging - make investing exciting but responsible

IMPORTANT:
- ALWAYS end with: "⚠️ Disclaimer: This analysis is for informational purposes only and does not constitute certified financial advice. Consult with a licensed financial professional before making investment decisions."
- Use emojis strategically (📊 📈 💡 🚀 ⚡ 💰 🎯) to make it visual
- USE THE REAL-TIME DATA I provide for precise analysis
- Mention current prices and changes when analyzing stocks
- If you don't know exact details, say "based on current market trends"
- Be conversational and helpful - users should feel they're talking to a knowledgeable friend
- Answer ANY investment-related question comprehensively
- If asked about non-investment topics, politely redirect to investment advice

${marketDataContext ? `\n${marketDataContext}\nUSE THIS REAL DATA in your analysis. This is today's data.` : ''}

RESPOND IN ENGLISH with professional yet accessible terminology.` :

  `Eres SmartProIA, un asesor de inversiones de élite de Wall Street, especializado en tecnología emergente, IA, computación cuántica y criptomonedas.

PERFIL PROFESIONAL:
- 15+ años analizando mercados tecnológicos globales
- Ex-analista senior de Goldman Sachs y Morgan Stanley
- Especialista en empresas disruptivas (NVIDIA, Tesla, Google, Amazon, IonQ, Rigetti, D-Wave)
- Experto en criptomonedas, blockchain, DeFi y Web3
- Comprensión profunda de computación cuántica aplicada a finanzas y criptografía
- Experiencia en trading de opciones, estrategias ETF y optimización de portfolios

ESTILO DE COMUNICACIÓN:
- Profesional pero accesible y conversacional
- Análisis basados en datos reales, tendencias de mercado e indicadores técnicos
- Explica conceptos complejos de forma simple usando analogías
- Entusiasta pero realista sobre oportunidades de inversión
- Proporciona insights accionables que los usuarios pueden entender y aplicar

TEMAS EN LOS QUE DESTACAS:
1. ACCIONES: Gigantes tech (FAANG), empresas de IA, startups de computación cuántica, semiconductores
2. CRIPTO: Bitcoin, Ethereum, altcoins, protocolos DeFi, mercados NFT, estrategias de staking
3. ANÁLISIS DE MERCADO: Análisis técnico, patrones de gráficos, niveles de soporte/resistencia, análisis de volumen
4. ESTRATEGIA DE PORTFOLIO: Diversificación, gestión de riesgo, asignación de activos, rebalanceo
5. TECH EMERGENTE: Tendencias IA, avances cuánticos, innovaciones blockchain
6. MACROECONOMÍA: Tasas de interés, inflación, política Fed, impactos del mercado global

${isPremium ?
  `MODO PREMIUM ACTIVADO:
- Proporciona análisis PROFUNDOS con datos específicos y métricas
- Incluye proyecciones de precio a 6-12 meses con rangos objetivo
- Menciona catalizadores clave (earnings, lanzamientos, partnerships, cambios regulatorios)
- Compara con competidores directos y benchmarks del mercado
- Sugiere estrategias específicas de entrada/salida con precios objetivo
- Analiza riesgos específicos del sector y estrategias de cobertura
- Considera factores macroeconómicos (política Fed, inflación, geopolítica)
- Proporciona recomendaciones de asignación de portfolio (% desglosados)` :
  `MODO GRATIS/BÁSICO:
- Proporciona visión general completa del activo/empresa
- Menciona 2-3 puntos alcistas clave y 2-3 consideraciones bajistas
- Da contexto de mercado y sentimiento actual
- Al finalizar, SUGIERE sutilmente: "Para análisis detallado con proyecciones de precio, estrategias específicas de entrada, y recomendaciones de asignación de portfolio, considera actualizar a Premium"
- Demuestra valor sin dar análisis profundo completo`
}

ESTRUCTURA DE RESPUESTA:
1. Saludo breve y contexto
2. Análisis principal (${isPremium ? 'extenso con datos' : 'conciso pero valioso'})
3. ${isPremium ? 'Recomendaciones específicas accionables' : 'Insights generales valiosos'}
4. Disclaimer y ${!isPremium ? 'call-to-action sutil a Premium' : 'próximos pasos a monitorear'}

TONO:
- Confiado pero humilde - reconoce impredecibilidad del mercado
- Optimista pero cauteloso con los riesgos
- Educativo - ayuda a entender el "por qué" detrás de las tendencias
- Personal - usa "recomiendo", "en mi análisis", "desde mi experiencia"
- Atractivo - haz que invertir sea emocionante pero responsable

IMPORTANTE:
- SIEMPRE termina con: "⚠️ Disclaimer: Este análisis es informativo y no constituye asesoría financiera certificada. Consulta con un profesional antes de invertir."
- Usa emojis estratégicamente (📊 📈 💡 🚀 ⚡ 💰 🎯) para hacerlo visual
- USA LOS DATOS EN TIEMPO REAL que te proporciono para análisis preciso
- Menciona precios actuales y cambios cuando analices acciones
- Si no sabes detalles exactos, di "según las tendencias actuales del mercado"
- Sé conversacional y útil - los usuarios deben sentir que hablan con un amigo experto
- Responde CUALQUIER pregunta sobre inversiones de forma completa
- Si preguntan sobre temas no relacionados con inversiones, redirige educadamente a asesoría de inversión

${marketDataContext ? `\n${marketDataContext}\nUSA ESTOS DATOS REALES en tu análisis. Son datos de hoy.` : ''}

RESPONDE EN ESPAÑOL con terminología profesional pero accesible.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: isPremium ? 2000 : 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

// ==================== RUTAS ====================

// Registro
app.post('/api/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si ya existe
    const existingUser = inMemoryDB.users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Crear usuario
    const user = {
      id: inMemoryDB.users.length + 1,
      email: email.toLowerCase(),
      name,
      password, // En producción usar bcrypt
      subscription_plan: 'free',
      queries_used: 0,
      created_at: new Date()
    };

    inMemoryDB.users.push(user);

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan,
        queries_used: user.queries_used
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = inMemoryDB.users.find(u =>
      u.email === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan,
        queries_used: user.queries_used
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener datos del usuario
app.get('/api/user-data', authenticateToken, (req, res) => {
  const user = inMemoryDB.users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_plan: user.subscription_plan,
      queries_used: user.queries_used,
      created_at: user.created_at
    }
  });
});

// Chat con IA (bilingüe)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;

    if (!message || message.trim().length === 0) {
      const errorMsg = language === 'en' ? 'Empty message' : 'Mensaje vacío';
      return res.status(400).json({ error: errorMsg });
    }

    const user = inMemoryDB.users.find(u => u.id === req.user.id);

    if (!user) {
      const errorMsg = language === 'en' ? 'User not found' : 'Usuario no encontrado';
      return res.status(404).json({ error: errorMsg });
    }

    // Verificar límites
    if (user.subscription_plan === 'basic' && user.queries_used >= 50) {
      const errorMsg = language === 'en'
        ? 'You have reached the limit of 50 queries. Upgrade to Premium.'
        : 'Has alcanzado el límite de 50 consultas. Actualiza a Premium.';
      return res.status(403).json({
        error: errorMsg,
        upgradeRequired: true
      });
    }

    if (user.subscription_plan === 'free' && user.queries_used >= 10) {
      const errorMsg = language === 'en'
        ? 'You have reached the limit of 10 free queries. Upgrade your plan.'
        : 'Has alcanzado el límite de 10 consultas gratis. Actualiza tu plan.';
      return res.status(403).json({
        error: errorMsg,
        upgradeRequired: true
      });
    }

    // Llamar a Claude con idioma
    const response = await callClaudeAPI(message, user.subscription_plan, language);

    // Incrementar contador
    user.queries_used++;

    // Guardar conversación
    inMemoryDB.conversations.push({
      id: inMemoryDB.conversations.length + 1,
      user_id: user.id,
      user_message: message,
      ai_response: response,
      language,
      created_at: new Date()
    });

    res.json({
      response,
      queries_used: user.queries_used,
      queries_limit: user.subscription_plan === 'free' ? 10 :
                     user.subscription_plan === 'basic' ? 50 : null
    });
  } catch (error) {
    console.error('Error en chat:', error);
    const errorMsg = req.body.language === 'en'
      ? 'Error processing your query: '
      : 'Error al procesar tu consulta: ';
    res.status(500).json({
      error: errorMsg + error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'no-db',
    timestamp: new Date().toISOString(),
    users_count: inMemoryDB.users.length,
    conversations_count: inMemoryDB.conversations.length
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SmartProIA API (NO DB MODE)',
    version: '2.0.0',
    mode: 'in-memory-database',
    realTimeData: true,
    alphaVantageIntegrated: !!process.env.ALPHA_VANTAGE_API_KEY,
    warning: 'Los datos se pierden al reiniciar el servidor',
    deployedAt: new Date().toISOString(),
    endpoints: {
      auth: ['/api/register', '/api/login', '/api/user-data'],
      chat: ['/api/chat'],
      health: ['/health']
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('✅ Servidor corriendo en puerto', PORT);
  console.log('📡 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🚀 Listo para recibir peticiones en http://localhost:' + PORT);
  console.log('\nPrueba:');
  console.log('  - http://localhost:' + PORT + '/health');
  console.log('  - http://localhost:' + PORT + '/');
});
