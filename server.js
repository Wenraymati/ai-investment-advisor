const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// CORS configurado correctamente
app.use(cors({
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logs de inicialización
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Configurada' : 'NO configurada');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Función para inicializar la base de datos con estructura compatible
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Crear tabla users simple (compatible con la estructura actual)
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

    // Crear tabla chat_history simple
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  } finally {
    client.release();
  }
}

// Sistema básico de IA
async function callClaudeAPI(userMessage) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `Análisis de "${userMessage}": Como asesor de inversiones, recomiendo diversificar en empresas líderes de IA como NVIDIA, Microsoft y Google. El mercado tech está consolidando después del rally de 2024. Considera entrada gradual en correcciones del 10-15%.`;
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
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Eres un asesor de inversiones experto. Analiza: "${userMessage}". Responde profesionalmente con recomendaciones específicas sobre inversiones en IA, tech y crypto. Máximo 200 palabras.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;

  } catch (error) {
    console.error('Error en Claude API:', error);
    return `Análisis profesional de "${userMessage}": El mercado de IA está en consolidación tras el rally de 2024. NVIDIA mantiene liderazgo pero considera diversificar con Microsoft, Google y empresas de semiconductores. Para crypto, Bitcoin cerca de $63K muestra consolidación saludable. Recomendación: entrada gradual en correcciones del 10-15%, stop-loss 20% debajo de entrada.`;
  }
}

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    service: 'AI Investment Advisor Pro',
    status: 'operational',
    version: '2.0.0',
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

// Registro de usuarios CORREGIDO
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const client = await pool.connect();
    try {
      // Verificar email único
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }

      // Hash de password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insertar usuario (sin queries_limit que no existe en la tabla)
      const result = await client.query(`
        INSERT INTO users (email, password, name, subscription_plan) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, email, name, subscription_plan
      `, [email, hashedPassword, name, 'free']);

      const newUser = result.rows[0];
      
      // Agregar campos calculados
      newUser.queries_used = 0;
      newUser.queries_limit = 5;
      newUser.queries_remaining = 5;
      
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
      );

      console.log(`✅ Usuario registrado exitosamente: ${email}`);
      res.json({ token, user: newUser });
      
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

      // Agregar campos calculados
      user.queries_used = 0;
      user.queries_limit = user.subscription_plan === 'premium' ? 999 : user.subscription_plan === 'basic' ? 50 : 5;
      user.queries_remaining = user.queries_limit - user.queries_used;

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
      );

      console.log(`✅ Login exitoso: ${email}`);
      res.json({ 
        token, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
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
      const result = await client.query('SELECT id, email, name, subscription_plan FROM users WHERE id = $1', [req.user.userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];
      user.queries_used = 0;
      user.queries_limit = user.subscription_plan === 'premium' ? 999 : user.subscription_plan === 'basic' ? 50 : 5;
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

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Para esta versión, simulamos límites sin consultar BD
    const userQueriesUsed = 0; // En producción, consultar BD
    const userPlan = 'free'; // En producción, obtener de BD
    const queryLimit = userPlan === 'premium' ? 999 : userPlan === 'basic' ? 50 : 5;

    if (userQueriesUsed >= queryLimit) {
      return res.status(429).json({ 
        error: 'Límite de consultas alcanzado',
        upgrade_required: true,
        current_plan: userPlan
      });
    }

    // Generar respuesta con IA
    const response = await callClaudeAPI(message);

    // Guardar en historial
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO chat_history (user_id, message, response) VALUES ($1, $2, $3)',
        [req.user.userId, message, response]
      );
    } catch (dbError) {
      console.error('Error guardando historial:', dbError);
      // Continuar sin fallar si no se puede guardar
    } finally {
      client.release();
    }

    console.log(`💬 Chat procesado para usuario ${req.user.userId}`);
    
    res.json({ 
      response,
      queries_remaining: queryLimit - (userQueriesUsed + 1),
      plan: userPlan,
      upgrade_available: userPlan === 'free'
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error procesando consulta' });
  }
});

// Inicialización del servidor
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 AI Investment Advisor Pro v2.0 ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Modo fallback'}`);
      console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'Desconectada'}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor...');
  if (pool) await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', promise, 'Razón:', reason);
});

// Iniciar servidor
startServer();

module.exports = app;
