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
  origin: ['https://smartproia.com', 'https://www.smartproia.com', 'http://localhost:3000', 'http://localhost:3001'],
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

// Función para llamar a Claude API
async function callClaudeAPI(userMessage, subscriptionPlan = 'free') {
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
  'Como usuario PREMIUM, proporciona análisis profundos con recomendaciones específicas.' :
  'Como usuario GRATIS/BÁSICO, proporciona análisis generales. Para detalles específicos, sugiere actualizar a Premium.'}

IMPORTANTE:
- Siempre incluye disclaimer: "Esto no es asesoría financiera certificada"
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

// Chat con IA
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const user = inMemoryDB.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar límites
    if (user.subscription_plan === 'basic' && user.queries_used >= 50) {
      return res.status(403).json({
        error: 'Has alcanzado el límite de 50 consultas. Actualiza a Premium.',
        upgradeRequired: true
      });
    }

    if (user.subscription_plan === 'free' && user.queries_used >= 10) {
      return res.status(403).json({
        error: 'Has alcanzado el límite de 10 consultas gratis. Actualiza tu plan.',
        upgradeRequired: true
      });
    }

    // Llamar a Claude
    const response = await callClaudeAPI(message, user.subscription_plan);

    // Incrementar contador
    user.queries_used++;

    // Guardar conversación
    inMemoryDB.conversations.push({
      id: inMemoryDB.conversations.length + 1,
      user_id: user.id,
      user_message: message,
      ai_response: response,
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
    res.status(500).json({
      error: 'Error al procesar tu consulta: ' + error.message
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
    version: '1.0.0',
    mode: 'in-memory-database',
    warning: 'Los datos se pierden al reiniciar el servidor',
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
