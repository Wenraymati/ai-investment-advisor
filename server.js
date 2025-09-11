const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
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

// Variables de entorno - log de inicialización
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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Función auxiliar para llamar a Claude API
async function callClaudeAPI(userMessage) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key no configurada');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Eres un experto asesor de inversiones especializado en inteligencia artificial y computación cuántica.

Pregunta del usuario: ${userMessage}

Responde de manera profesional y práctica incluyendo:
- Análisis específico si mencionan una acción o empresa
- Principales riesgos y oportunidades
- Recomendaciones concretas y actionables
- Tickers relevantes cuando sea apropiado
- Perspectiva a corto y mediano plazo

Mantén un tono profesional pero accesible, y limita tu respuesta a información útil y precisa.`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, errorText);
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
    claude_ai: process.env.ANTHROPIC_API_KEY ? 'Disponible' : 'No configurada'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AI Investment Advisor',
    database: process.env.DATABASE_URL ? 'URL disponible' : 'URL no disponible',
    claude_ai: process.env.ANTHROPIC_API_KEY ? 'Disponible' : 'No configurada'
  });
});

// Registro de usuarios (versión simplificada)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Crear usuario sin hash de password (para testing)
    const newUser = {
      id: Date.now(), // ID temporal basado en timestamp
      email: email,
      name: name,
      subscription_plan: 'free'
    };

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Usuario registrado: ${email}`);

    res.json({
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login de usuarios (versión simplificada)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Login simplificado para testing (acepta cualquier password válido)
    const user = {
      id: Date.now(),
      email: email,
      name: email.split('@')[0], // Usar parte antes del @ como nombre
      subscription_plan: 'free'
    };

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Usuario logueado: ${email}`);

    res.json({
      token,
      user: user
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Datos del usuario
app.get('/api/user-data', authenticateToken, async (req, res) => {
  try {
    const user = {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.email.split('@')[0],
      subscription_plan: 'free'
    };

    res.json({ user: user });
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Chat con Claude IA
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    let response;

    try {
      // Intentar usar Claude IA
      response = await callClaudeAPI(message);
      console.log(`💬 Claude respondió a usuario ${userId}: ${message.substring(0, 50)}...`);
    } catch (claudeError) {
      console.error('Error con Claude API:', claudeError.message);
      
      // Fallback a respuesta profesional básica
      response = `Como asesor de inversiones en IA, he recibido tu consulta sobre "${message}". 

Basándome en las tendencias actuales del mercado de inteligencia artificial y computación cuántica:

• Las acciones de IA han mostrado volatilidad significativa en 2024-2025
• Empresas como NVIDIA, Microsoft, Google y Tesla lideran el sector
• La computación cuántica sigue siendo emergente con empresas como IBM, IonQ y Rigetti
• Recomiendo diversificación y análisis de fundamentales antes de invertir

Para análisis más detallados y personalizados, nuestro sistema de IA estará completamente operativo pronto.`;
    }

    res.json({ response });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

// Análisis de portfolio (placeholder para futura implementación)
app.post('/api/analyze-portfolio', authenticateToken, async (req, res) => {
  try {
    const { stocks } = req.body;
    
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'Lista de acciones requerida' });
    }

    // Placeholder para análisis de portfolio
    const analysis = `Análisis de portfolio para ${stocks.join(', ')}:

Esta función estará disponible próximamente con:
• Análisis de diversificación
• Evaluación de riesgo/retorno
• Recomendaciones de rebalanceo
• Comparación con benchmarks del sector IA

Mantente atento a las actualizaciones.`;

    res.json({ analysis });
  } catch (error) {
    console.error('Error en análisis de portfolio:', error);
    res.status(500).json({ error: 'Error al analizar portfolio' });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message
  });
});

// Inicialización del servidor
const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT NOW()');
      console.log('✅ Conexión a base de datos establecida');
    } else {
      console.log('⚠️  Base de datos no configurada (modo desarrollo)');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Claude IA: ${process.env.ANTHROPIC_API_KEY ? 'Habilitado' : 'Deshabilitado'}`);
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
