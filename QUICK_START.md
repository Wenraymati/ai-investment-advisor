# ⚡ QUICK START - 5 MINUTOS

## 🎯 OBJETIVO
Tener SmartProIA corriendo localmente en 5 minutos.

---

## 📋 PREREQUISITOS

✅ Tienes instalado:
- Node.js 16+ ([Descargar](https://nodejs.org/))
- npm (viene con Node.js)
- Git (opcional)

✅ Tienes estas API keys:
- [ ] Anthropic API Key (Claude) - `sk-ant-api03-...`
- [ ] Alpha Vantage API Key - ✅ Ya la tienes: `IE68LAT4Y7C7CIF4`
- [ ] Database URL - ✅ Ya la tienes en Railway
- [ ] Stripe Keys (opcional para testing local)

---

## 🚀 PASOS

### 1. Abrir Terminal en el Proyecto

```bash
# Windows: Presiona Win+R, escribe cmd, Enter
# Luego navega a:
cd "C:\Users\Mati\OneDrive\Escritorio\all test\Proyecto smartproia"
```

### 2. Ejecutar Setup Automático

```bash
setup.bat
```

Este script:
- ✅ Verifica Node.js y npm
- ✅ Instala dependencias backend
- ✅ Instala dependencias frontend
- ✅ Crea archivo .env

### 3. Configurar Variables de Entorno

El script abrirá `.env` automáticamente. Edita estos valores:

```env
# CAMBIAR ESTOS:
JWT_SECRET=tu_secreto_cambiar_por_uno_aleatorio_largo
ANTHROPIC_API_KEY=sk-ant-api03-TU_KEY_AQUI

# OPCIONAL (para testing completo):
STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI

# YA CONFIGURADOS (no cambiar):
DATABASE_URL=postgresql://postgres:EpIPNIOxEgfgIydxQDPkCpsqpqGuIzhN@yamanote.proxy.rlwy.net:47841/railway
ALPHA_VANTAGE_API_KEY=IE68LAT4Y7C7CIF4
```

### 4. Iniciar Backend

**Terminal 1**:
```bash
test-local.bat
```

Deberías ver:
```
✅ Base de datos conectada
✅ Tablas creadas/verificadas
🚀 Servidor corriendo en puerto 3001
```

### 5. Iniciar Frontend

**Terminal 2** (nueva terminal):
```bash
cd frontend
npm start
```

Se abrirá automáticamente: http://localhost:3000

---

## ✅ VERIFICAR QUE FUNCIONA

### Test 1: Backend Health Check
Abre en navegador: http://localhost:3001/health

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "environment": "development"
}
```

### Test 2: Frontend Carga
Abre: http://localhost:3000

Deberías ver:
- Página de login/registro
- Diseño moderno con gradientes

### Test 3: Crear Usuario de Prueba

1. Click en "Registrarse"
2. Llenar formulario:
   - Nombre: Test User
   - Email: test@example.com
   - Password: testpass123
3. Click "Registrarse Gratis"
4. Deberías entrar al dashboard

### Test 4: Chat con IA (Requiere Anthropic API Key)

1. En el dashboard, tab "Chat IA"
2. Escribir: "¿Es buen momento para invertir en NVIDIA?"
3. Presionar "Enviar"
4. Deberías recibir respuesta de Claude AI

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "ANTHROPIC_API_KEY no configurada"
- Edita `.env`
- Agrega tu key de Anthropic
- Reinicia el servidor (Ctrl+C y `test-local.bat`)

### Error: "Port 3001 already in use"
```bash
# Windows: Matar proceso en puerto 3001
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

### Frontend no carga
```bash
cd frontend
npm install
npm start
```

### Error de base de datos
- Verifica que `DATABASE_URL` en `.env` es correcto
- La que tienes en `port.env.txt` debería funcionar

---

## 📊 ¿TODO FUNCIONA?

Si completaste todos los tests:

✅ **¡Felicidades! SmartProIA está corriendo localmente.**

### Próximos Pasos:

**Opción A: Seguir testeando local**
- Crear más usuarios
- Probar diferentes consultas de IA
- Revisar análisis de portfolio

**Opción B: Deploy a producción**
- Sigue: `DEPLOYMENT_GUIDE.md`
- Tiempo estimado: 1-2 horas
- Resultado: App en vivo en internet

**Opción C: Mejorar landing page**
- Sigue: `LANDING_PAGE_IMPROVEMENTS.md`
- Implementar CTAs y mejoras SEO

---

## 🎯 COMANDOS ÚTILES

```bash
# Ver logs del backend en tiempo real
# (El servidor los muestra automáticamente)

# Detener el backend
# Presiona Ctrl+C en la terminal

# Reiniciar con cambios
# Ctrl+C, luego test-local.bat otra vez

# Ver todos los endpoints disponibles
# Abre: http://localhost:3001/

# Test de endpoint específico
curl http://localhost:3001/health
```

---

## 💡 TIPS

1. **Guarda tu .env**: Es el único archivo con tus secrets
2. **No lo commitees a Git**: Ya está en `.gitignore`
3. **Genera un JWT_SECRET fuerte**: Usa un generador online
4. **Testing con Stripe**: Usa modo test primero (no cobros reales)

---

## 📞 ¿NECESITAS AYUDA?

**Error no listado aquí?**
1. Lee el mensaje de error completo
2. Verifica `.env` está correcto
3. Consulta `DEPLOYMENT_GUIDE.md` sección Troubleshooting
4. Revisa logs en la terminal

---

## 🎉 SIGUIENTE NIVEL

**Cuando estés listo para producción:**

1. Lee `DEPLOYMENT_GUIDE.md` completo
2. Crea cuentas en:
   - Railway (backend): https://railway.app
   - Vercel (frontend): https://vercel.com
3. Sigue el proceso de deploy
4. ¡Lanza tu SaaS al mundo!

**Tiempo estimado deploy completo**: 1-2 horas
**Costo inicial**: $0-20/mes

---

**¿Todo listo? ¡Empieza con `setup.bat`!** 🚀
