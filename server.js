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

// Variables de prueba
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurada' : 'NO configurada');

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

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Investment Advisor API funcionando!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Variable configurada' : 'Variable NO configurada'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Investment Advisor',
    database: process.env.DATABASE_URL ? 'URL disponible' : 'URL no disponible'
  });
});

// Registro de usuarios (versión simplificada)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear usuario sin hash (para testing)
    const newUser = {
      id: Date.now(), // ID temporal
      email: email,
      name: name,
      subscription_plan: 'free'
    };

    // Generar token
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

    // Login simplificado para testing
    const user = {
      id: Date.now(),
      email: email,
      name: email.split('@')[0],
      subscription_plan: 'free'
    };

    // Generar token
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
      // Chat con Claude IA
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    // Verificar que tenemos la API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Claude API key no configurada');
    }

    // Llamar a Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `Eres un experto asesor de inversiones especializado en IA y computación cuántica. Pregunta del usuario: ${message}. Responde de forma profesional y práctica con análisis específico, riesgos, oportunidades y recomendaciones concretas.`
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error('Error en Claude API');
    }

    const claudeData = await claudeResponse.json();
    const aiResponse = claudeData.content[0].text;

    console.log(`💬 Claude respondió a: ${message.substring(0, 50)}...`);

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error en chat:', error);
    
    // Fallback a respuesta básica si Claude falla
    const fallbackResponse = `Gracias por tu consulta sobre "${message}". Estoy experimentando problemas técnicos temporales con el análisis IA. Normalmente proporciono análisis detallados sobre inversiones en IA y computación cuántica.`;
    
    res.json({ response: fallbackResponse });
  }
});

    if (!claudeResponse.ok) {
      throw new Error('Error en Claude API');
    }

    const claudeData = await claudeResponse.json();
    const aiResponse = claudeData.content[0].text;

    console.log(`💬 Claude respondió a: ${message.substring(0, 50)}...`);

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error en chat:', error);
    
    // Fallback a respuesta básica si Claude falla
    const fallbackResponse = `Gracias por tu consulta: "${message}". Estoy experimentando problemas técnicos temporales. Normalmente proporciono análisis detallados sobre inversiones en IA y computación cuántica.`;
    
    res.json({ response: fallbackResponse });
  }
});
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

// Chat básico
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    // Respuesta básica por ahora
    const response = `Gracias por tu consulta: "${message}". Estoy analizando las tendencias del mercado de IA y computación cuántica. Pronto integraremos Claude IA para respuestas más inteligentes.`;

    console.log(`💬 Chat: ${message.substring(0, 50)}...`);

    res.json({ response });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 Variables: DATABASE_URL=${process.env.DATABASE_URL ? 'OK' : 'FALTA'}`);
});

module.exports = app;
