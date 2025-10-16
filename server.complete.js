require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Configuración de DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde.' }
});
app.use('/api/', apiLimiter);

// Logs de configuración
console.log('🚀 Iniciando SmartProIA Server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ NO configurada');
console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? '✅ Configurada' : '❌ NO configurada');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ NO configurada');

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
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

// ==================== FUNCIONES AUXILIARES ====================

// Obtener datos de mercado
async function fetchMarketData(symbol) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    const data = await response.json();

    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return {
        symbol,
        price: parseFloat(data['Global Quote']['05. price']),
        change: parseFloat(data['Global Quote']['09. change']),
        changePercent: data['Global Quote']['10. change percent']
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Llamar a Claude API
async function callClaudeAPI(userMessage, subscriptionPlan, conversationHistory = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API no configurada');
  }

  const isPremium = subscriptionPlan === 'premium';

  const systemPrompt = `Eres un asesor de inversiones experto especializado en tecnología, IA y computación cuántica.

Tu rol es proporcionar análisis ${isPremium ? 'detallados y personalizados' : 'básicos'} sobre:
- Acciones de tecnología (NVIDIA, Google, Microsoft, Tesla, etc.)
- Criptomonedas (Bitcoin, Ethereum, etc.)
- Empresas de computación cuántica (IonQ, Rigetti, D-Wave)
- Tendencias del mercado tecnológico

${isPremium ?
  'Como usuario PREMIUM, proporciona análisis profundos con recomendaciones específicas de puntos de entrada/salida.' :
  'Como usuario BÁSICO, proporciona análisis generales. Para detalles específicos, sugiere actualizar a Premium.'}

IMPORTANTE:
- Siempre incluye disclaimer: "Esto no es asesoría financiera certificada"
- Basa tus análisis en datos recientes
- Sé específico pero responsable
- Formato amigable y conversacional en español`;

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
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO users (email, name, password, subscription_plan, queries_used, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, name, subscription_plan, queries_used`,
      [email.toLowerCase(), name, hashedPassword, 'free', 0]
    );

    const user = result.rows[0];

    // Generar token JWT
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
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Actualizar último login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
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
app.get('/api/user-data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, subscription_plan, queries_used, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo datos de usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// ==================== RUTAS DE CHAT ====================

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    // Obtener datos del usuario
    const userResult = await pool.query(
      'SELECT subscription_plan, queries_used FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];

    // Verificar límites de consultas
    if (user.subscription_plan === 'basic' && user.queries_used >= 50) {
      return res.status(403).json({
        error: 'Has alcanzado el límite de 50 consultas. Actualiza a Premium para consultas ilimitadas.',
        upgradeRequired: true
      });
    }

    // Llamar a Claude API
    const response = await callClaudeAPI(message, user.subscription_plan);

    // Incrementar contador de consultas
    await pool.query(
      'UPDATE users SET queries_used = queries_used + 1 WHERE id = $1',
      [req.user.id]
    );

    // Guardar conversación en DB (opcional)
    await pool.query(
      `INSERT INTO conversations (user_id, user_message, ai_response, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [req.user.id, message, response]
    );

    res.json({
      response,
      queries_used: user.queries_used + 1,
      queries_limit: user.subscription_plan === 'basic' ? 50 : null
    });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error al procesar tu consulta. Intenta de nuevo.' });
  }
});

// ==================== RUTAS DE PORTFOLIO ====================

app.post('/api/analyze-portfolio', authenticateToken, async (req, res) => {
  try {
    const { stocks } = req.body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'Lista de acciones inválida' });
    }

    // Verificar plan premium
    const userResult = await pool.query(
      'SELECT subscription_plan FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows[0].subscription_plan !== 'premium') {
      return res.status(403).json({
        error: 'Esta función es exclusiva para usuarios Premium',
        upgradeRequired: true
      });
    }

    // Obtener datos de mercado para cada acción
    const marketDataPromises = stocks.map(symbol => fetchMarketData(symbol));
    const marketDataResults = await Promise.all(marketDataPromises);

    const validData = marketDataResults.filter(data => data !== null);

    if (validData.length === 0) {
      return res.status(500).json({ error: 'No se pudieron obtener datos de mercado' });
    }

    // Crear mensaje para Claude con datos de mercado
    const portfolioSummary = validData.map(data =>
      `${data.symbol}: $${data.price} (${data.changePercent})`
    ).join('\n');

    const analysisPrompt = `Analiza este portfolio de inversión en detalle:

${portfolioSummary}

Proporciona:
1. Análisis de diversificación
2. Nivel de riesgo general
3. Recomendaciones de rebalanceo
4. Oportunidades de mejora
5. Perspectivas a corto y largo plazo

Formato claro y accionable para un inversor.`;

    const analysis = await callClaudeAPI(analysisPrompt, 'premium');

    res.json({
      analysis,
      marketData: validData
    });
  } catch (error) {
    console.error('Error analizando portfolio:', error);
    res.status(500).json({ error: 'Error al analizar portfolio' });
  }
});

// ==================== RUTAS DE STRIPE ====================

app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe no configurado' });
    }

    const { plan } = req.body;

    const prices = {
      basic: { priceId: 'price_basic', amount: 900 }, // $9
      premium: { priceId: 'price_premium', amount: 4700 } // $47
    };

    if (!prices[plan]) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SmartProIA ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
              description: plan === 'premium' ?
                'Consultas ilimitadas + análisis completo de portfolio' :
                '50 consultas al mes + análisis básico'
            },
            unit_amount: prices[plan].amount,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'https://smartproia.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://smartproia.com'}/pricing`,
      client_reference_id: req.user.id.toString(),
      metadata: {
        userId: req.user.id,
        plan: plan
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando sesión de checkout:', error);
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

// Webhook de Stripe
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Actualizar suscripción del usuario
      await pool.query(
        `UPDATE users
         SET subscription_plan = $1,
             queries_used = 0,
             subscription_start = NOW()
         WHERE id = $2`,
        [session.metadata.plan, session.metadata.userId]
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook de Stripe:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ==================== RUTAS DE SALUD ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SmartProIA API',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/register', '/api/login', '/api/user-data'],
      chat: ['/api/chat'],
      portfolio: ['/api/analyze-portfolio'],
      payments: ['/api/create-checkout-session']
    }
  });
});

// ==================== INICIALIZACIÓN ====================

const startServer = async () => {
  try {
    // Verificar conexión a DB
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT NOW()');
      console.log('✅ Base de datos conectada');

      // Crear tablas si no existen
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          subscription_plan VARCHAR(50) DEFAULT 'free',
          queries_used INTEGER DEFAULT 0,
          subscription_start TIMESTAMP,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          user_message TEXT NOT NULL,
          ai_response TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      `);
      console.log('✅ Tablas creadas/verificadas');
    } else {
      console.warn('⚠️ DATABASE_URL no configurada');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
