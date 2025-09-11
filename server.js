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

// Función para generar respuestas dinámicas basadas en contexto
function generateDynamicResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  const responses = {
    nvidia: "NVIDIA (NVDA): Líder absoluto en chips de IA. Crecimiento del 200%+ en 2024 por demanda de GPUs para IA. Riesgos: alta volatilidad, competencia de AMD/Intel. Trading actual: $400-500. Recomendación: esperar pullback a $350-380 para entrada.",
    
    bitcoin: "Bitcoin vs Acciones IA: Bitcoin es especulativo puro, las acciones de IA tienen fundamentales sólidos. NVDA, MSFT, GOOGL ofrecen exposición a IA con menos volatilidad que crypto. Si buscas crecimiento, prefiere acciones de IA sobre Bitcoin.",
    
    tesla: "Tesla (TSLA): Combina autos eléctricos + IA automotriz (FSD, Autopilot). Valoración alta ($200-250) pero potencial en robotaxis. Competencia: BYD, Rivian. Riesgo Musk. Considera solo si crees en visión a largo plazo.",
    
    microsoft: "Microsoft (MSFT): Inversión masiva en OpenAI/ChatGPT. Azure creciendo por demanda de IA empresarial. Dividendo seguro, menos volátil que NVDA. Trading: $350-400. Ideal para portfolio conservador con exposición IA.",
    
    google: "Google/Alphabet (GOOGL): Bard compite con ChatGPT, líder en investigación IA. Cloud en crecimiento. Valuación atractiva vs MSFT. Riesgo regulatorio antimonopolio. Precio actual: $130-140. Buena entrada a estos niveles.",
    
    quantum: "Computación Cuántica: Sector emergente. Empresas: IBM (más sólida), IonQ (IONQ), Rigetti (RGTI). Muy especulativo, tecnología años de comercialización. Solo para risk capital. IBM más segura por diversificación.",
    
    inversion: "Para invertir en IA: 1) Core holding: NVDA (30%) 2) Diversificación: MSFT, GOOGL (40%) 3) Especulativo: IonQ, Tesla (20%) 4) Cash: 10% para oportunidades. Dollar-cost averaging recomendado por volatilidad.",
    
    default: `Análisis de "${message}": El mercado de IA está en consolidación tras el rally de 2024. Sectores clave: semiconductores (NVDA, AMD), software (MSFT, GOOGL), aplicaciones (Tesla, Palantir). Recomiendo diversificación y entrada gradual. ¿Qué específicamente te interesa analizar?`
  };

  // Buscar palabras clave en el mensaje
  for (const [key, response] of Object.entries(responses)) {
    if (key !== 'default' && lowerMessage.includes(key)) {
      return response;
    }
  }
  
  // Si no encuentra keywords específicas, usar respuesta por defecto
  return responses.default;
}

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
      model: 'claude-3-haiku-20240307', // Modelo más económico
      max_tokens: 200, // Reducido para controlar costos
      messages: [
        {
          role: 'user',
          content: `Eres un asesor experto en inversiones de IA y tecnología. 

Pregunta: ${userMessage}

Responde en máximo 150 palabras con:
- Análisis específico de la consulta
- Precio actual aproximado si es una acción
- Riesgos principales 
- Recomendación práctica

Sé directo y profesional.`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Claude API error ${response.status}:`, errorText);
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

// Chat con Claude IA mejorado y optimizado
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    let response;
    let usedClaude = false;

    // Intentar Claude IA primero
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        response = await callClaudeAPI(message);
        usedClaude = true;
        console.log(`💬 Claude respondió a usuario ${userId}: ${message.substring(0, 30)}...`);
      } catch (claudeError) {
        console.error('Claude API falló:', claudeError.message);
        usedClaude = false;
      }
    }

    // Si Claude falló o no está disponible, usar respuesta dinámica
    if (!usedClaude) {
      response = generateDynamicResponse(message);
      console.log(`🤖 Respuesta dinámica para usuario ${userId}: ${message.substring(0, 30)}...`);
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

    // Análisis básico por acción
    const stockAnalysis = stocks.map(stock => {
      const ticker = stock.toUpperCase();
      switch(ticker) {
        case 'NVDA':
          return `${ticker}: Líder en IA, alta volatilidad. Peso recomendado: 25-30%`;
        case 'MSFT':
          return `${ticker}: Estable con exposición IA via OpenAI. Peso recomendado: 20-25%`;
        case 'GOOGL':
          return `${ticker}: Buen valor, competidor en IA. Peso recomendado: 15-20%`;
        case 'TSLA':
          return `${ticker}: Especulativo, alto riesgo/retorno. Peso recomendado: 5-10%`;
        default:
          return `${ticker}: Analizar fundamentales antes de asignar peso significativo`;
      }
    });

    const analysis = `Análisis de Portfolio [${stocks.join(', ')}]:

${stockAnalysis.join('\n')}

Recomendaciones generales:
• Diversificar entre semiconductores, software y aplicaciones IA
• Mantener 10-20% en cash para oportunidades
• Rebalancear trimestralmente
• Dollar-cost averaging en posiciones core

Riesgo del portfolio: ${stocks.length > 5 ? 'Medio' : 'Alto'} (concentración en ${stocks.length} acciones)`;

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
