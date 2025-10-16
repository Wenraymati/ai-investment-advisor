# 🚀 GUÍA COMPLETA DE DEPLOY - SmartProIA

## ⚠️ PROBLEMA ACTUAL DETECTADO

Tu API key de Anthropic está **expirada o inválida**. Necesitas obtener una nueva.

Error encontrado:
```
authentication_error: invalid x-api-key
```

---

## 📋 PLAN DE DEPLOY COMPLETO

### ARQUITECTURA FINAL:
```
smartproia.com (WordPress en Hostinger)
    ↓
    Landing page con botones de registro/login
    ↓
app.smartproia.com (Frontend React en Vercel)
    ↓
    Dashboard, Chat con IA, Portfolio
    ↓
api.smartproia.com (Backend Node.js en Railway)
    ↓
    PostgreSQL Database (Railway)
```

---

## 🔧 PASO 1: ARREGLAR API KEY DE ANTHROPIC (URGENTE)

### 1.1. Obtener nueva API Key

**Opción A: Obtener API Key de Anthropic (Recomendado)**

1. Ve a: https://console.anthropic.com/
2. Inicia sesión o crea cuenta
3. Ve a "API Keys" en el menú
4. Click "Create Key"
5. Copia la key (empieza con `sk-ant-api03-`)
6. **IMPORTANTE**: Esta key es válida y tiene créditos

**Opción B: Obtener créditos gratis ($5 inicial)**

Si es tu primera vez:
- Anthropic da $5 de crédito gratis
- Suficiente para ~100,000 tokens
- ~500-1000 conversaciones de prueba

**Opción C: Plan de pago (Cuando generes ingresos)**

- $5 = ~500,000 tokens
- $20/mes para uso moderado
- $100/mes para uso intensivo

### 1.2. Actualizar la API Key

Una vez tengas la nueva key:

1. Abre el archivo `.env`
2. Reemplaza la línea:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-[TU_NUEVA_KEY_AQUI]
   ```
3. Guarda el archivo
4. Reinicia el servidor backend

**Comando para reiniciar:**
```bash
# Ctrl+C en la terminal del backend
node server.nodb.js
```

---

## 🗄️ PASO 2: CONFIGURAR BASE DE DATOS EN RAILWAY

### 2.1. Acceder a Railway

1. Ve a: https://railway.app/dashboard
2. Inicia sesión con tu cuenta

### 2.2. Crear nuevo proyecto

```bash
1. Click "New Project"
2. Selecciona "Provision PostgreSQL"
3. Espera 30 segundos a que se cree
4. Click en el servicio PostgreSQL creado
```

### 2.3. Obtener la DATABASE_URL

```bash
1. En el panel de PostgreSQL, click en "Variables"
2. Busca "DATABASE_URL"
3. Click en el ícono de copiar
4. Debe verse así:
   postgresql://postgres:PASSWORD@HOST:PORT/railway
```

### 2.4. Actualizar .env local

Reemplaza en tu archivo `.env`:
```env
DATABASE_URL=postgresql://postgres:[LA_URL_QUE_COPIASTE]
```

### 2.5. Probar conexión local

```bash
# Detén server.nodb.js (Ctrl+C)
# Inicia con base de datos real:
node server.complete.js
```

Deberías ver:
```
✅ Base de datos conectada
✅ Tablas creadas/verificadas
✅ Servidor corriendo en puerto 3001
```

---

## 🚂 PASO 3: DEPLOY BACKEND A RAILWAY

### 3.1. Preparar archivos para deploy

Voy a crear los archivos necesarios automáticamente...

### 3.2. Subir código a GitHub

```bash
# Desde la carpeta del proyecto:
git init
git add .
git commit -m "Initial commit - SmartProIA backend"
git branch -M main
git remote add origin https://github.com/[TU_USUARIO]/smartproia-backend.git
git push -u origin main
```

### 3.3. Conectar Railway con GitHub

1. En Railway, click "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu cuenta GitHub si no lo está
4. Selecciona el repo `smartproia-backend`
5. Railway detectará automáticamente que es Node.js

### 3.4. Configurar variables de entorno en Railway

En el panel de Railway, ve a "Variables" y agrega:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET={W5Y<-4Y8[Qn%%R#lMloPu)kmcnCHP|8;N3/|:n1A/].YEeV$1OQ7Lqe<3X}G08
ANTHROPIC_API_KEY=sk-ant-api03-[TU_KEY_NUEVA]
ALPHA_VANTAGE_API_KEY=IE68LAT4Y7C7CIF4
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://app.smartproia.com
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

**NOTA**: `${{Postgres.DATABASE_URL}}` es automático si tu DB está en el mismo proyecto.

### 3.5. Obtener URL del backend

Railway te dará una URL como:
```
https://smartproia-backend-production.up.railway.app
```

Guarda esta URL, la necesitarás para el frontend.

---

## 🎨 PASO 4: PREPARAR Y DEPLOY FRONTEND

### 4.1. Configurar variables de entorno del frontend

Crear archivo `frontend/.env.production`:

```env
REACT_APP_API_URL=https://smartproia-backend-production.up.railway.app
```

### 4.2. Actualizar código para usar variable de entorno

Ya está configurado en `App.complete.jsx` para leer `REACT_APP_API_URL`.

### 4.3. Deploy a Vercel

**Opción A: Deploy automático desde GitHub**

1. Ve a: https://vercel.com/new
2. Conecta tu cuenta GitHub
3. Selecciona el repo `smartproia-frontend`
4. Configuración:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. En "Environment Variables" agrega:
   ```
   REACT_APP_API_URL=https://[TU-BACKEND-RAILWAY].up.railway.app
   ```
6. Click "Deploy"

**Opción B: Deploy manual**

```bash
cd frontend
npm run build
npx vercel --prod
```

### 4.4. Obtener URL del frontend

Vercel te dará:
```
https://smartproia-frontend.vercel.app
```

---

## 🌐 PASO 5: CONFIGURAR SUBDOMINIOS PERSONALIZADOS

### 5.1. Configurar app.smartproia.com (Frontend)

**En Vercel:**
1. Ve a tu proyecto → Settings → Domains
2. Click "Add Domain"
3. Escribe: `app.smartproia.com`
4. Vercel te dará registros DNS para configurar

**En Hostinger (Panel DNS):**
1. Ve a tu panel de Hostinger
2. Dominios → smartproia.com → DNS Zone
3. Agrega registro CNAME:
   ```
   Type: CNAME
   Name: app
   Points to: cname.vercel-dns.com
   TTL: 3600
   ```

### 5.2. Configurar api.smartproia.com (Backend)

**En Railway:**
1. Ve a tu proyecto backend → Settings → Domains
2. Click "Generate Domain"
3. Luego click "Custom Domain"
4. Escribe: `api.smartproia.com`

**En Hostinger (Panel DNS):**
1. Agrega registro CNAME:
   ```
   Type: CNAME
   Name: api
   Points to: [LA URL QUE TE DIO RAILWAY sin https://]
   TTL: 3600
   ```

### 5.3. Esperar propagación DNS (15-60 minutos)

Puedes verificar con:
```bash
nslookup app.smartproia.com
nslookup api.smartproia.com
```

---

## 📝 PASO 6: ACTUALIZAR WORDPRESS

### 6.1. Acceder al editor de WordPress

1. Ve a: https://smartproia.com/wp-admin
2. Inicia sesión
3. Ve a: Páginas → Editar página principal

### 6.2. Agregar botones con Elementor

**Encontrar la sección Hero/Principal:**

1. Click en "Editar con Elementor"
2. Busca la sección principal (hero)
3. Agrega un botón o edita el existente

**Configurar botones:**

**Botón "Empezar Gratis":**
```
Texto: 🚀 Empezar Gratis
Enlace: https://app.smartproia.com/register
Color: Gradiente morado/azul
Tamaño: Grande
```

**Botón "Iniciar Sesión":**
```
Texto: Iniciar Sesión
Enlace: https://app.smartproia.com/login
Color: Transparente con borde
Tamaño: Mediano
```

### 6.3. Actualizar CTAs en toda la página

Busca todos los botones que actualmente llevan a:
- Binance
- Trezor
- Otros enlaces externos

Cámbialos a:
- `https://app.smartproia.com/register` (para registro)
- `https://app.smartproia.com/login` (para login)

---

## ✅ PASO 7: PROBAR TODO EL FLUJO

### 7.1. Test del Landing Page

1. Ve a: https://smartproia.com
2. ✅ La página carga correctamente
3. ✅ Click en "Empezar Gratis"
4. ✅ Te redirige a https://app.smartproia.com

### 7.2. Test de Registro

1. En app.smartproia.com
2. Click "Registrarse"
3. Llena el formulario:
   ```
   Nombre: Usuario Prueba
   Email: prueba@smartproia.com
   Password: test123456
   ```
4. ✅ Registro exitoso
5. ✅ Entras automáticamente al dashboard

### 7.3. Test del Chat con IA

1. En el dashboard, tab "Chat IA"
2. Escribe: "¿Es buen momento para invertir en NVIDIA?"
3. Click "Enviar"
4. ✅ Respuesta de Claude AI en 5-10 segundos
5. ✅ Contador de consultas se incrementa

### 7.4. Test de Límites

1. Crea cuenta nueva (plan Free)
2. Haz 10 consultas
3. ✅ En la consulta 11, aparece mensaje de límite alcanzado

### 7.5. Test de Persistencia

1. Cierra sesión
2. Vuelve a iniciar sesión
3. ✅ Tus mensajes anteriores están guardados
4. ✅ Tu contador de consultas se mantiene

---

## 📊 PASO 8: MONITOREO Y MÉTRICAS

### 8.1. Railway Dashboard

Monitorea:
- CPU usage
- Memory usage
- Request count
- Database connections

### 8.2. Vercel Analytics

Habilita Vercel Analytics:
1. Ve a tu proyecto en Vercel
2. Settings → Analytics → Enable

Verás:
- Visitantes únicos
- Page views
- Performance metrics

### 8.3. Logs en tiempo real

**Backend (Railway):**
```bash
railway logs
```

**Frontend (Vercel):**
En el dashboard de Vercel → Deployments → View Function Logs

---

## 💰 COSTOS MENSUALES ESTIMADOS

### Configuración Inicial (Gratis)

- **Hostinger**: Ya pagado ($X/mes)
- **Railway**:
  - $5 de crédito gratis inicial
  - Luego: $5-10/mes (backend + DB)
- **Vercel**: Gratis hasta 100GB bandwidth
- **Anthropic API**:
  - $5 inicial gratis
  - Luego: ~$10-20/mes (uso moderado)

**Total mensual**: ~$15-30/mes cuando se acaben los créditos gratis

### Configuración Escalada (Con ingresos)

Cuando tengas usuarios pagando:

- Railway: $20/mes (más recursos)
- Anthropic: $50-100/mes (uso intensivo)
- CDN adicional: $10-20/mes

**Total**: ~$80-150/mes para 500-1000 usuarios activos

---

## 🐛 TROUBLESHOOTING

### Backend no despliega en Railway

```bash
# Verificar logs
railway logs

# Errores comunes:
# 1. Puerto incorrecto
# Solución: Usar process.env.PORT

# 2. Dependencias faltantes
# Solución: npm install && git push
```

### Frontend no conecta con Backend

```bash
# Verificar CORS
# En server.js debe tener:
app.use(cors({
  origin: ['https://app.smartproia.com', 'https://smartproia.com'],
  credentials: true
}));
```

### Base de datos no conecta

```bash
# 1. Verificar DATABASE_URL en variables de Railway
# 2. Verificar que PostgreSQL está en el mismo proyecto
# 3. Usar: ${{Postgres.DATABASE_URL}} en variables
```

### DNS no propaga

```bash
# Esperar 1-2 horas
# Verificar con:
dig app.smartproia.com
dig api.smartproia.com

# Si después de 24h no funciona:
# - Verificar nameservers del dominio
# - Contactar soporte de Hostinger
```

---

## 📞 CHECKLIST FINAL

### Pre-Deploy
- [ ] API Key de Anthropic válida y con créditos
- [ ] Cuenta Railway creada y proyecto configurado
- [ ] Cuenta Vercel creada
- [ ] Cuenta GitHub con repos creados
- [ ] Código testeado localmente

### Deploy Backend
- [ ] Base de datos PostgreSQL creada en Railway
- [ ] Variables de entorno configuradas
- [ ] Backend deployado y corriendo
- [ ] Health check responde: api.smartproia.com/health

### Deploy Frontend
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Deployado a Vercel
- [ ] App carga en app.smartproia.com

### Integración
- [ ] Subdominios configurados en DNS
- [ ] Frontend conecta con backend
- [ ] WordPress actualizado con botones
- [ ] Flujo completo funciona end-to-end

### Testing
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Chat con IA responde correctamente
- [ ] Límites de consultas funcionan
- [ ] Datos persisten en base de datos

---

## 🎉 PRÓXIMOS PASOS DESPUÉS DEL DEPLOY

1. **Configurar Stripe** (cuando quieras cobrar)
   - Crear cuenta Stripe
   - Configurar productos (Basic $9, Premium $47)
   - Integrar webhooks

2. **SEO y Marketing**
   - Implementar mejoras de LANDING_PAGE_IMPROVEMENTS.md
   - Agregar blog en WordPress
   - Configurar Google Analytics

3. **Contenido**
   - Crear artículos sobre:
     - Computación cuántica
     - IonQ, Rigetti análisis
     - NVIDIA y IA
     - Bitcoin y cripto

4. **Monetización adicional**
   - Affiliate links de Binance/Trezor en blog
   - YouTube videos
   - Newsletter de pago

---

## 📚 ARCHIVOS QUE VOY A CREAR PARA TI

1. `package.json` - Configuración de Railway
2. `Procfile` - Comando de inicio para Railway
3. `.gitignore` - Archivos a ignorar
4. `railway.json` - Configuración Railway
5. `frontend/.env.production` - Variables de producción
6. `deploy-railway.sh` - Script de deploy automático
7. `test-production.sh` - Script para probar producción

---

**¿Listo para empezar con PASO 1: Arreglar API Key?**

Responde cuándo hayas obtenido la nueva API Key de Anthropic y continuamos.
