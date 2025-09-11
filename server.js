const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { createTables } = require('./init-database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

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
    database: 'Connected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Investment Advisor',
    database: 'PostgreSQL Connected'
  });
});

// Registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insertar nuevo usuario
    const newUser = await pool.query(
      'INSERT INTO users (email, password, name, subscription_plan, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, name, subscription_plan',
      [email, hashedPassword, name, 'free']
    );

    // Generar token
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login de usuarios
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name,
        subscription_plan: user.rows[0].subscription_plan
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Datos del usuario
app.get('/api/user-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await pool.query(
      'SELECT id, email, name, subscription_plan, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Chat básico (sin IA por ahora)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje no puede estar vacío' });
    }

    // Respuesta básica por ahora
    const response = `Gracias por tu consulta: "${message}". Pronto integraremos Claude IA para respuestas inteligentes sobre inversiones.`;

    // Guardar en historial
    await pool.query(
      'INSERT INTO chat_history (user_id, message, response, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, message, response]
    );

    res.json({ response });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

// Inicialización del servidor
const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a base de datos establecida');

    // Crear tablas si no existen
    await createTables();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📱 API disponible en: https://ai-investment-advisor-production.up.railway.app`);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
