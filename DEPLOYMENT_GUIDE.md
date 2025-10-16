# 🚀 GUÍA COMPLETA DE DESPLIEGUE - SMARTPROIA

## 📋 ÍNDICE
1. [Pre-requisitos](#pre-requisitos)
2. [Configuración Local](#configuración-local)
3. [Despliegue del Backend](#despliegue-del-backend)
4. [Despliegue del Frontend](#despliegue-del-frontend)
5. [Configuración de Base de Datos](#configuración-de-base-de-datos)
6. [Configuración de Stripe](#configuración-de-stripe)
7. [Configuración de Dominio](#configuración-de-dominio)
8. [Monitoreo y Logs](#monitoreo-y-logs)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 PRE-REQUISITOS

### Herramientas Necesarias:
- ✅ Node.js 16+ instalado
- ✅ npm o yarn
- ✅ Git
- ✅ Cuenta en Railway/Render (backend)
- ✅ Cuenta en Vercel/Netlify (frontend)

### APIs y Servicios:
- [ ] Anthropic API Key (Claude AI)
- [ ] Alpha Vantage API Key
- [ ] Stripe Account + API Keys
- [ ] PostgreSQL Database (Railway provee una gratis)

---

## 💻 CONFIGURACIÓN LOCAL

### 1. Clonar y Preparar el Proyecto

```bash
# Navegar a la carpeta del proyecto
cd "C:\Users\Mati\OneDrive\Escritorio\all test\Proyecto smartproia"

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd frontend
npm install
cd ..
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Abrir .env y llenar con tus valores reales
notepad .env
```

**Contenido de `.env`**:
```env
PORT=3001
NODE_ENV=development

# Base de datos (obtener de Railway)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (generar uno aleatorio)
JWT_SECRET=tu_secreto_super_seguro_cambiar_esto

# Anthropic (obtener en https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Alpha Vantage (obtener gratis en https://www.alphavantage.co/support/#api-key)
ALPHA_VANTAGE_API_KEY=tu_clave_alpha_vantage

# Stripe (obtener en https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# URL del frontend (cambiar en producción)
FRONTEND_URL=http://localhost:3000
```

### 3. Probar Localmente

```bash
# Terminal 1: Iniciar backend
node server.complete.js

# Terminal 2: Iniciar frontend
cd frontend
npm start
```

**Verificar**:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

---

## 🌐 DESPLIEGUE DEL BACKEND

### Opción A: Railway (RECOMENDADO - Gratis para empezar)

#### Paso 1: Crear Cuenta
1. Ir a https://railway.app
2. Sign up con GitHub
3. Verificar email

#### Paso 2: Crear Proyecto
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear nuevo proyecto
railway init
```

#### Paso 3: Configurar Base de Datos
1. En Railway Dashboard → "New" → "Database" → "PostgreSQL"
2. Copiar la `DATABASE_URL` que genera Railway
3. Agregar a variables de entorno

#### Paso 4: Deploy del Backend
```bash
# Crear railway.json en la raíz
```

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.complete.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

```bash
# Hacer deploy
railway up

# Configurar variables de entorno en Railway Dashboard:
# Settings → Variables → Add todas las de tu .env
```

#### Paso 5: Obtener URL
```bash
# Railway te dará una URL como:
# https://smartproia-backend-production.up.railway.app
```

### Opción B: Render

1. Ir a https://render.com
2. "New +" → "Web Service"
3. Conectar repo de GitHub
4. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.complete.js`
   - **Environment**: Node
5. Agregar variables de entorno
6. Deploy

---

## 🎨 DESPLIEGUE DEL FRONTEND

### Opción A: Vercel (RECOMENDADO)

#### Paso 1: Preparar el Frontend
```bash
cd frontend

# Crear/actualizar package.json con build script
```

**frontend/package.json** (verificar):
```json
{
  "name": "smartproia-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
```

#### Paso 2: Configurar Variable de Entorno

**frontend/.env.production**:
```env
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

#### Paso 3: Deploy en Vercel
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel
```

**Configuración en Vercel Dashboard**:
1. Settings → Environment Variables
2. Agregar: `REACT_APP_API_URL` con tu URL de backend
3. Redeploy

### Opción B: Netlify

1. Ir a https://netlify.com
2. "Add new site" → "Import an existing project"
3. Conectar GitHub
4. Configurar:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Agregar variable de entorno: `REACT_APP_API_URL`
6. Deploy

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Opción 1: Railway PostgreSQL (Incluido)

Ya configurado en el paso anterior. Verificar que las tablas se crearon:

```bash
# Conectarse a la DB desde Railway Dashboard
# O usar este comando:
railway connect postgresql
```

```sql
-- Verificar tablas
\dt

-- Deberías ver:
-- users
-- conversations
```

### Opción 2: Supabase (Alternativa Gratis)

1. Ir a https://supabase.com
2. Crear proyecto
3. Copiar Connection String
4. Actualizar `DATABASE_URL` en Railway

---

## 💳 CONFIGURACIÓN DE STRIPE

### Paso 1: Crear Cuenta Stripe
1. Ir a https://dashboard.stripe.com/register
2. Completar verificación de cuenta

### Paso 2: Obtener API Keys
1. Dashboard → Developers → API Keys
2. Copiar:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Paso 3: Configurar Webhooks
1. Developers → Webhooks → "Add endpoint"
2. URL: `https://tu-backend.railway.app/api/webhooks/stripe`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar **Signing secret**: `whsec_...`

### Paso 4: Actualizar Variables de Entorno
```bash
# En Railway Dashboard → Variables
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Paso 5: Crear Productos en Stripe
1. Dashboard → Products → "Add product"
2. **Producto 1: Basic**
   - Name: SmartProIA Basic
   - Price: $9/month recurring
   - Copiar Price ID
3. **Producto 2: Premium**
   - Name: SmartProIA Premium
   - Price: $47/month recurring
   - Copiar Price ID

**Actualizar en código** (`server.complete.js`):
```javascript
const prices = {
  basic: { priceId: 'price_1234abcd', amount: 900 },
  premium: { priceId: 'price_5678efgh', amount: 4700 }
};
```

---

## 🌍 CONFIGURACIÓN DE DOMINIO

### Paso 1: Comprar Dominio
- **Namecheap**: ~$10/año
- **Google Domains**: ~$12/año
- **Cloudflare**: ~$9/año

### Paso 2: Configurar DNS

#### Para el Backend (Railway):
1. Railway Dashboard → Settings → Domains
2. "Add Custom Domain" → smartproia.com
3. Railway te dará instrucciones de DNS

**Configurar en tu proveedor de DNS**:
```
Tipo: CNAME
Host: api
Value: smartproia-backend-production.up.railway.app
```

Resultado: `api.smartproia.com` → Backend

#### Para el Frontend (Vercel):
1. Vercel Dashboard → Settings → Domains
2. "Add" → smartproia.com
3. Configurar DNS:

```
Tipo: A
Host: @
Value: 76.76.21.21 (IP de Vercel)

Tipo: CNAME
Host: www
Value: cname.vercel-dns.com
```

### Paso 3: Verificar SSL
- Railway y Vercel configuran SSL automáticamente
- Esperar 10-30 minutos para propagación DNS
- Verificar en https://smartproia.com

### Paso 4: Actualizar URLs

**Backend** → Variables de entorno en Railway:
```env
FRONTEND_URL=https://smartproia.com
```

**Frontend** → Variables en Vercel:
```env
REACT_APP_API_URL=https://api.smartproia.com/api
```

**CORS** en `server.complete.js`:
```javascript
app.use(cors({
  origin: [
    'https://smartproia.com',
    'https://www.smartproia.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

## 📊 MONITOREO Y LOGS

### Backend Monitoring

#### Railway:
```bash
# Ver logs en tiempo real
railway logs

# O en Dashboard → Deployments → View Logs
```

#### Agregar Sentry (Error Tracking):
```bash
npm install @sentry/node
```

**En `server.complete.js`**:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://tu-sentry-dsn@sentry.io/xxx',
  environment: process.env.NODE_ENV
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### Frontend Monitoring

#### Vercel Analytics:
1. Vercel Dashboard → Analytics → Enable
2. Gratis hasta 100k pageviews/mes

#### Google Analytics:
Ya configurado en tu landing page ✅

---

## 🐛 TROUBLESHOOTING

### Problema 1: Backend no inicia

**Síntomas**: Error en Railway logs

**Solución**:
```bash
# Verificar logs
railway logs

# Común: DATABASE_URL no configurado
# Verificar en Railway → Variables
```

### Problema 2: Frontend no conecta al backend

**Síntomas**: Error CORS o "Network Error"

**Solución**:
```javascript
// Verificar CORS en server.complete.js
app.use(cors({
  origin: ['https://smartproia.com'],
  credentials: true
}));

// Verificar API_URL en frontend
console.log(process.env.REACT_APP_API_URL);
```

### Problema 3: Stripe webhooks fallan

**Síntomas**: Suscripciones no se actualizan

**Solución**:
1. Stripe Dashboard → Webhooks → Tu endpoint
2. Ver "Recent events" y errores
3. Verificar `STRIPE_WEBHOOK_SECRET`
4. Test webhook con CLI:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### Problema 4: Base de datos no conecta

**Síntomas**: Error "ECONNREFUSED"

**Solución**:
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Test conexión
psql $DATABASE_URL

# Si falla, recrear DB en Railway
```

---

## ✅ CHECKLIST DE DEPLOY

### Pre-Deploy:
- [ ] Código testeado localmente
- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos creada
- [ ] Stripe configurado

### Backend:
- [ ] Desplegado en Railway/Render
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Health check funciona: `https://api.smartproia.com/health`
- [ ] Stripe webhooks configurados

### Frontend:
- [ ] Desplegado en Vercel/Netlify
- [ ] Variable `REACT_APP_API_URL` configurada
- [ ] Build exitoso
- [ ] Login/Register funcionan

### Dominio:
- [ ] DNS configurado
- [ ] SSL activo (HTTPS)
- [ ] Redirects www → no-www funcionan

### Monitoring:
- [ ] Google Analytics activo
- [ ] Sentry configurado (opcional)
- [ ] Logs accesibles

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs del backend (Railway)
railway logs

# Conectarse a la DB
railway connect postgresql

# Redeploy rápido
railway up

# Ver variables de entorno
railway variables

# Frontend: Ver build localmente
cd frontend
npm run build
npx serve -s build

# Test API local
curl http://localhost:3001/health

# Test API producción
curl https://api.smartproia.com/health
```

---

## 🎉 POST-DEPLOY

### 1. Verificar Todo Funciona:
```bash
# Checklist rápido:
✓ https://smartproia.com carga
✓ https://api.smartproia.com/health responde
✓ Puedes registrarte
✓ Puedes hacer login
✓ Chat con IA funciona
✓ Stripe checkout abre
```

### 2. Primeras Tareas:
1. Crear tu cuenta de admin
2. Hacer 3-5 consultas de prueba
3. Test del flujo completo de pago (modo test)
4. Invitar a 2-3 beta testers

### 3. Marketing:
1. Lanzar en Product Hunt
2. Post en X/Twitter
3. Post en LinkedIn
4. Email a tu lista (si tienes)

---

## 💰 COSTOS MENSUALES ESTIMADOS

| Servicio | Plan | Costo |
|----------|------|-------|
| Railway (Backend + DB) | Free tier | $0 (primeros 500 horas) |
| Vercel (Frontend) | Hobby | $0 |
| Dominio | Namecheap | $1/mes |
| Anthropic API | Pay-as-you-go | $50-200* |
| Alpha Vantage | Premium | $50 |
| Stripe | 2.9% + $0.30 | Variable |
| **TOTAL INICIAL** | | **$100-250/mes** |

*Costos de IA dependen del uso. Con caché y límites: $50-100/mes para 100 usuarios.

### Cuando Escalar:
- **>1000 usuarios**: Railway Pro ($20/mes)
- **>10k visitas/mes**: Vercel Pro ($20/mes)
- **Monitoring**: Sentry Team ($26/mes)

---

## 🚀 ¡LISTO PARA LANZAR!

Una vez completados todos los pasos:

```bash
# Anuncio en Twitter
🚀 Lanzamos SmartProIA: Asesor de inversiones con IA
especializado en Quantum Computing & Tech 🤖

✨ Claude AI para análisis en tiempo real
📊 Portfolio insights con IA
💎 Prueba gratis sin tarjeta

👉 https://smartproia.com

#AI #QuantumComputing #InvestingWithAI
```

**¿Preguntas?** Revisa la sección de [Troubleshooting](#troubleshooting) o los logs de Railway/Vercel.

---

**Última actualización**: 2025-10-15
**Versión**: 1.0.0
