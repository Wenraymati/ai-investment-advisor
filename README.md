# 🤖 SmartProIA - AI Investment Advisor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

> Plataforma SaaS de asesoría de inversiones impulsada por IA, especializada en Quantum Computing, Tech Stocks y Criptomonedas.

**🌐 Website**: [smartproia.com](https://smartproia.com)
**📊 Status**: 70% Complete → Ready for MVP Launch

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tech Stack](#️-tech-stack)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Despliegue](#-despliegue)
- [Roadmap](#️-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🤖 **Chat con IA Avanzada**
- Análisis de inversiones en tiempo real con Claude 3.5 Sonnet
- Respuestas contextuales en español e inglés
- Memoria de conversación
- Recomendaciones personalizadas según plan de suscripción

### 📊 **Análisis de Portfolio (Premium)**
- Análisis completo de diversificación
- Evaluación de riesgo
- Recomendaciones de rebalanceo
- Datos de mercado en vivo (Alpha Vantage)

### 💳 **Sistema de Suscripciones**
- **Free**: 10 consultas/mes
- **Basic ($9/mes)**: 50 consultas/mes + análisis básico
- **Premium ($47/mes)**: Ilimitado + análisis completo + reportes

### 🔐 **Seguridad**
- Autenticación JWT
- Passwords hasheados con bcrypt
- Rate limiting
- CORS configurado
- SSL/HTTPS

### 💰 **Monetización**
- Stripe para pagos recurrentes
- Links de afiliados (Binance, Trezor)
- Google AdSense integrado

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: JWT + bcryptjs
- **Payments**: Stripe
- **AI**: Anthropic Claude API
- **Market Data**: Alpha Vantage API

### Frontend
- **Framework**: React 18
- **Routing**: React Router
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **State Management**: React Hooks + Local Storage

### DevOps & Deployment
- **Backend Hosting**: Railway / Render
- **Frontend Hosting**: Vercel / Netlify
- **Database**: Railway PostgreSQL
- **Domain**: Custom domain with SSL
- **Monitoring**: Sentry (optional)
- **Analytics**: Google Analytics 4

---

## 📁 Estructura del Proyecto

```
Proyecto smartproia/
├── server.complete.js          # Backend completo y funcional
├── server.js                    # Backend original (incompleto)
├── package.json                 # Dependencies backend
├── .env.example                 # Template variables de entorno
├── .gitignore                   # Git ignore rules
│
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── App.complete.jsx    # App React completa
│   │   ├── App.css             # Estilos optimizados
│   │   └── index.js
│   └── package.json
│
├── Paginas/                     # Landing page actual
│   └── Pagina web - codigo para hostiner elementor.txt
│
├── lobe-chat/                   # LobeChat framework (exploración)
│
├── LANDING_PAGE_IMPROVEMENTS.md   # 🎯 Mejoras detalladas landing
├── DEPLOYMENT_GUIDE.md             # 🚀 Guía completa de deploy
├── README.md                       # Este archivo
│
└── Documentation/
    ├── API.md                   # Documentación API (TO DO)
    └── ARCHITECTURE.md          # Arquitectura (TO DO)
```

---

## 🚀 Instalación

### Pre-requisitos
- Node.js 16+ y npm
- PostgreSQL 14+
- Git

### Pasos

```bash
# 1. Clonar el repositorio
cd "C:\Users\Mati\OneDrive\Escritorio\all test\Proyecto smartproia"

# 2. Instalar dependencias del backend
npm install

# 3. Instalar dependencias del frontend
cd frontend
npm install
cd ..

# 4. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores reales

# 5. Iniciar base de datos
# (Ver DEPLOYMENT_GUIDE.md para Railway setup)

# 6. Iniciar servidor de desarrollo
# Terminal 1: Backend
node server.complete.js

# Terminal 2: Frontend
cd frontend
npm start
```

**URLs Locales**:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

---

## ⚙️ Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz con:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de Datos
DATABASE_URL=postgresql://user:password@host:port/database

# Seguridad
JWT_SECRET=tu_secreto_jwt_super_seguro

# APIs Externas
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ALPHA_VANTAGE_API_KEY=tu_clave_alpha_vantage

# Pagos
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Obtener API Keys

1. **Anthropic (Claude AI)**:
   - Registro: https://console.anthropic.com/
   - Pricing: ~$3-15 per 1M tokens
   - Costo estimado: $50-200/mes para 100 usuarios

2. **Alpha Vantage (Market Data)**:
   - Free tier: https://www.alphavantage.co/support/#api-key
   - Premium: $50/mes (500 requests/minute)

3. **Stripe (Payments)**:
   - Dashboard: https://dashboard.stripe.com/
   - Modo Test para desarrollo (gratis)

---

## 💻 Uso

### Registrar un Usuario

```bash
# POST /api/register
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "name": "Test User"
  }'
```

### Chat con IA

```bash
# POST /api/chat (requiere autenticación)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "¿Debería invertir en NVIDIA ahora?"
  }'
```

### Analizar Portfolio (Premium)

```bash
# POST /api/analyze-portfolio
curl -X POST http://localhost:3001/api/analyze-portfolio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stocks": ["NVDA", "GOOGL", "MSFT", "IONQ"]
  }'
```

---

## 🚀 Despliegue

### Quick Deploy (10 minutos)

1. **Backend en Railway**:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

2. **Frontend en Vercel**:
```bash
npm install -g vercel
cd frontend
vercel
```

3. **Configurar Dominio**:
- Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para instrucciones detalladas

### Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Stripe webhooks configurados
- [ ] Dominio con SSL activo
- [ ] Google Analytics activado
- [ ] Tests básicos pasando

---

## 🗓️ Roadmap

### ✅ Fase 1: MVP (Completado 70%)
- [x] Backend API funcional
- [x] Frontend React completo
- [x] Autenticación JWT
- [x] Chat con Claude AI
- [x] Sistema de suscripciones
- [ ] Despliegue en producción (NEXT)
- [ ] Tests unitarios (NEXT)

### 🚧 Fase 2: Launch (Semanas 1-2)
- [ ] Landing page optimizada con CTAs
- [ ] Implementar mejoras de SEO
- [ ] Sistema de emails (bienvenida, reportes)
- [ ] Onboarding tutorial
- [ ] Beta testing con 10 usuarios

### 📈 Fase 3: Growth (Mes 1-3)
- [ ] Sistema de alertas en tiempo real
- [ ] Gráficos interactivos de mercado
- [ ] Exportar reportes en PDF
- [ ] Integración con brokers (Robinhood API)
- [ ] App móvil (React Native)

### 🎯 Fase 4: Scale (Mes 3-6)
- [ ] Programa de afiliados propio
- [ ] Marketplace de estrategias de IA
- [ ] API pública para developers
- [ ] Versión white-label para B2B
- [ ] Expansión internacional

---

## 📊 Métricas Objetivo (Año 1)

| Mes | Usuarios | MRR | Churn | Objetivo |
|-----|----------|-----|-------|----------|
| 1-2 | 20 | $500 | <15% | Validación |
| 3-4 | 60 | $1,500 | <12% | Product-Market Fit |
| 5-6 | 150 | $4,000 | <10% | Escalabilidad |
| 7-12 | 400+ | $10,000+ | <8% | Crecimiento |

**Objetivo Año 1**: $50,000-120,000 ARR

---

## 🤝 Contribuir

Este es un proyecto personal en desarrollo. Si estás interesado en colaborar:

1. Fork el repositorio
2. Crea una branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines
- Código en inglés, comentarios en español OK
- Tests para features nuevas
- Seguir convenciones de código existentes
- Actualizar documentación

---

## 🐛 Reportar Bugs

Por favor reporta bugs abriendo un issue con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Ambiente (OS, Node version, etc.)

---

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles

Copyright (c) 2025 SmartProIA

---

## 👥 Autor

**Matías** - Founder & Developer
- Website: [smartproia.com](https://smartproia.com)
- Email: info@smartproia.com

---

## 🙏 Agradecimientos

- [Anthropic](https://anthropic.com) por Claude AI
- [Alpha Vantage](https://alphavantage.co) por market data
- [Stripe](https://stripe.com) por infraestructura de pagos
- [Railway](https://railway.app) por hosting
- [Vercel](https://vercel.com) por frontend deployment

---

## 📚 Documentación Adicional

- [🎯 Landing Page Improvements](./LANDING_PAGE_IMPROVEMENTS.md) - Mejoras detalladas para smartproia.com
- [🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md) - Guía completa de despliegue
- [📖 API Documentation](./docs/API.md) - Documentación de endpoints (TO DO)
- [🏗️ Architecture](./docs/ARCHITECTURE.md) - Diseño del sistema (TO DO)

---

## ⚡ Quick Start Commands

```bash
# Desarrollo local
npm run dev              # Iniciar backend en modo desarrollo
npm run start:frontend   # Iniciar frontend

# Producción
npm start                # Iniciar backend en producción
npm run build:frontend   # Build frontend para producción

# Tests (TO DO)
npm test                 # Correr tests
npm run test:watch       # Tests en watch mode

# Database
npm run db:migrate       # Correr migraciones (TO DO)
npm run db:seed          # Seed data (TO DO)

# Deploy
npm run deploy           # Deploy completo (TO DO)
```

---

## 🎯 Estado del Proyecto

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| Backend API | ✅ 95% | - |
| Frontend React | ✅ 90% | - |
| Landing Page | ⚠️ 60% | 🔴 ALTA |
| Base de Datos | ✅ 100% | - |
| Stripe Integration | ✅ 90% | - |
| Tests | ❌ 0% | 🟡 MEDIA |
| Deploy Scripts | ⚠️ 50% | 🔴 ALTA |
| Documentation | ⚠️ 70% | 🟢 BAJA |

**Próximo Paso**: Deploy a producción → Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

<div align="center">

**🚀 ¿Listo para revolucionar las inversiones con IA?**

[Website](https://smartproia.com) • [Deploy Guide](./DEPLOYMENT_GUIDE.md) • [Report Bug](https://github.com/yourusername/smartproia/issues)

Made with ❤️ and 🤖 AI

</div>
