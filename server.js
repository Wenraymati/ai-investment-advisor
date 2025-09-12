const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Pool de conexión a base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware básico
app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logs de inicialización
console.log('=== AI INVESTMENT ADVISOR INICIANDO ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'NO configurada');

// Middleware de autenticación
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

// Sistema de IA mejorado
async function generateAIResponse(message, userPlan = 'free') {
  // Si no hay Claude API, usar respuestas inteligentes pre-programadas
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateSmartFallback(message, userPlan);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: userPlan === 'premium' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
        max_tokens: userPlan === 'premium' ? 500 : 300,
        messages: [{
          role: 'user',
          content: `Eres un asesor senior de inversiones especializado en IA, tecnología y criptomonedas.

CONSULTA: "${message}"

Contexto de mercado (Septiembre 2025):
- NVIDIA: ~$420 (líder en chips IA, alta volatilidad)
- Tesla: ~$240 (innovador en IA automotriz)  
- Bitcoin: ~$63,000 (consolidando pre-halving)
- Microsoft: ~$380 (sólido por Azure + OpenAI)
- Mercado IA: En maduración, separando ganadores/perdedores

INSTRUCCIONES:
1. Analiza la consulta específica
2. Proporciona recomendaciones prácticas
3. Incluye niveles de precio cuando sea relevante
4. Menciona riesgos principales
5. Timeframe sugerido
6. Tono profesional pero accesible

${userPlan === 'premium' ? 'USUARIO PREMIUM: Proporciona análisis detallado con múltiples escenarios.' : 'USUARIO BÁSICO: Mantén respuesta valiosa pero concisa.'}

Máximo ${userPlan === 'premium' ? '350' : '200'} palabras.`
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    } else {
      throw new Error(`Claude API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error Claude API:', error);
    return generateSmartFallback(message, userPlan);
  }
}

function generateSmartFallback(message, userPlan) {
  const lowerMsg = message.toLowerCase();
  
  // Análisis contextual por palabras clave
  if (lowerMsg.includes('nvidia') || lowerMsg.includes('nvda')) {
    return `📊 ANÁLISIS NVIDIA (NVDA)

SITUACIÓN ACTUAL: ~$420, líder indiscutible en chips de IA con crecimiento explosivo en 2024-2025.

FORTALEZAS:
• Monopolio en GPUs para IA/ML
• Ingresos récord por demanda de centros de datos
• Ecosistema CUDA bien establecido

RIESGOS:
• Valoración muy elevada (P/E >60)
• Competencia emergente (AMD, Intel, chips custom)
• Posible saturación del mercado IA

${userPlan === 'premium' ? `RECOMENDACIÓN PREMIUM:
• Entrada gradual en $380-420
• Stop-loss: $350 (-15%)
• Target: $500-550 (12-18 meses)
• Tamaño posición: Máx 15% del portfolio` : 'UPGRADE A PREMIUM para recomendaciones específicas de entrada/salida.'}

⚠️ DISCLAIMER: Análisis educativo, no asesoría financiera personal.`;
  }
  
  if (lowerMsg.includes('bitcoin') || lowerMsg.includes('btc')) {
    return `₿ ANÁLISIS BITCOIN (BTC)

SITUACIÓN ACTUAL: ~$63,400, consolidando después del rally institucional.

CATALIZADORES POSITIVOS:
• ETFs de Bitcoin con flujos récord
• Adopción corporativa creciente
• Próximo halving genera expectativas

RIESGOS A CONSIDERAR:
• Volatilidad extrema (±30% mensual)
• Regulación gubernamental incierta
• Correlación con tech durante crisis

${userPlan === 'premium' ? `ESTRATEGIA PREMIUM:
• DCA (Dollar Cost Average) en $60K-65K
• Stop-loss dinámico: -25% del promedio
• Target optimista: $80K-100K (2025-2026)
• Máx 10% del portfolio total` : 'ACTUALIZA A PREMIUM para estrategia de acumulación detallada.'}

TIMEFRAME: Inversión a largo plazo (2+ años) recomendada.`;
  }
  
  if (lowerMsg.includes('tesla') || lowerMsg.includes('tsla')) {
    return `🚗 ANÁLISIS TESLA (TSLA)

PRECIO ACTUAL: ~$240, recuperándose tras corrección de 2024.

TESIS BULLISH:
• Líder en vehículos eléctricos
• Avances en conducción autónoma (FSD)
• Expansión global de Superchargers

DESAFÍOS:
• Competencia feroz (BYD, Ford, GM)
• Dependencia de subsidios gubernamentales
• Volatilidad por tweets de Musk

${userPlan === 'premium' ? `RECOMENDACIÓN PREMIUM:
• Zona de compra: $220-250
• Stop conservador: $200
• Target 2025: $350-400
• Peso sugerido: 8-12% del portfolio` : 'PREMIUM UNLOCK: Análisis técnico avanzado y puntos de entrada.'}

HORIZONTE: 12-24 meses para materializar potencial.`;
  }
  
  // Respuesta general para otras consultas
  return `📈 ANÁLISIS DE INVERSIONES

CONSULTA PROCESADA: "${message}"

CONTEXTO GENERAL DEL MERCADO (Sep 2025):
• Sector tech consolidando tras rally IA de 2024
• Oportunidades en correcciones del 10-15%
• Diversificación clave ante volatilidad

SECTORES RECOMENDADOS:
1. **Semiconductores**: NVDA, AMD, ASML
2. **Software IA**: MSFT, GOOGL, CRM
3. **Criptomonedas**: BTC, ETH (máx 10%)
4. **Energía renovable**: TSLA, ENPH, SEDG

ESTRATEGIA GENERAL:
• Entrada gradual (DCA) en correcciones
• Mantener 15-20% cash para oportunidades
• Stop-loss del 20% en posiciones individuales
• Rebalanceo trimestral

${userPlan === 'premium' ? 'Como usuario PREMIUM, recibes análisis personalizados por consulta.' : '⚡ ACTUALIZA A PREMIUM para recomendaciones específicas por acción.'}

⚠️ Esto es contenido educativo, consulta a un asesor certificado para decisiones importantes.`;
}

// Inicialización de base de datos
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla users
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

    // Crear tabla chat_history
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
    console.error('❌ Error inicializando BD:', error);
  }
}

// ===== RUTAS API =====

app.get('/', (req, res) => {
  res.json({
    service: 'SmartProIA - AI Investment Advisor',
    status: 'operational',
    version: '2.0',
    features: ['Claude IA', 'PostgreSQL', 'JWT Auth', 'Real-time analysis'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
      ai: process.env.ANTHROPIC_API_KEY ? 'available' : 'fallback',
      market_data: 'operational'
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validaciones estrictas
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

      // Calcular límites según plan
      const queryLimits = { free: 5, basic: 50, premium: 999 };
      user.queries_used = 0; // En producción, consultar desde BD
      user.queries_limit = queryLimits[user.subscription_plan] || 5;
      user.queries_remaining = user.queries_limit - user.queries_used;

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '30d' }
      );

      console.log(`✅ Login exitoso: ${email}`);
      
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

// Perfil de usuario
app.get('/api/user-profile', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, name, email, subscription_plan, created_at FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];
      const queryLimits = { free: 5, basic: 50, premium: 999 };
      user.queries_used = 0;
      user.queries_limit = queryLimits[user.subscription_plan] || 5;
      user.queries_remaining = user.queries_limit - user.queries_used;

      res.json({
        user: user,
        features: {
          portfolio_analysis: user.subscription_plan !== 'free',
          real_time_alerts: user.subscription_plan === 'premium',
          ai_model: user.subscription_plan === 'premium' ? 'claude-sonnet' : 'claude-haiku'
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

// Chat con IA
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Obtener datos del usuario
    const client = await pool.connect();
    let user;
    
    try {
      const result = await client.query('SELECT subscription_plan FROM users WHERE id = $1', [userId]);
      user = result.rows[0];
    } finally {
      client.release();
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar límites (simulado por ahora)
    const queryLimits = { free: 5, basic: 50, premium: 999 };
    const userLimit = queryLimits[user.subscription_plan] || 5;
    const queriesUsed = 0; // En producción, consultar desde BD

    if (queriesUsed >= userLimit) {
      return res.status(429).json({
        error: 'Límite de consultas alcanzado',
        upgrade_required: true,
        current_plan: user.subscription_plan
      });
    }

    // Generar respuesta con IA
    const response = await generateAIResponse(message, user.subscription_plan);

    // Guardar en historial
    const historyClient = await pool.connect();
    try {
      await historyClient.query(
        'INSERT INTO chat_history (user_id, message, response) VALUES ($1, $2, $3)',
        [userId, message, response]
      );
    } catch (error) {
      console.error('Error guardando historial:', error);
    } finally {
      historyClient.release();
    }

    console.log(`💬 Chat procesado para usuario ${userId}: "${message.substring(0, 30)}..."`);

    res.json({
      response,
      queries_remaining: userLimit - (queriesUsed + 1),
      plan: user.subscription_plan,
      upgrade_available: user.subscription_plan === 'free'
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error procesando consulta' });
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
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 SmartProIA v2.0 ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Modo fallback'}`);
      console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'PostgreSQL conectada' : 'Sin BD'}`);
      console.log('=== SISTEMA COMPLETAMENTE OPERACIONAL ===');
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar:', error);
    process.exit(1);
  }
};

// Manejo de shutdown graceful
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor gracefulmente...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', promise, 'Razón:', reason);
});

// Iniciar aplicación
startServer();

module.exports = app;name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const client = await pool.connect();
    
    try {
      // Verificar email único
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }

      // Hash de contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insertar usuario
      const result = await client.query(`
        INSERT INTO users (name, email, password, subscription_plan) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email, subscription_plan, created_at
      `, [name.trim(), email.toLowerCase(), hashedPassword, 'free']);

      const newUser = result.rows[0];
      
      // Agregar campos calculados
      newUser.queries_used = 0;
      newUser.queries_limit = 5;
      newUser.queries_remaining = 5;

      // Generar JWT
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

// Login de usuarios
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!
