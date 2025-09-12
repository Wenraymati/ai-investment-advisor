<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartProIA - Professional AI Financial Advisor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f1419 0%, #1a202c 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #00d4ff 0%, #90e0ef 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .header p {
            color: #a0aec0;
            font-size: 1.1rem;
        }
        .auth-container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            margin: 0 auto;
        }
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 25px;
        }
        .sidebar {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 25px;
            height: fit-content;
        }
        .main-chat {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            height: 70vh;
        }
        .input {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            color: white;
            font-size: 16px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        .input:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
        }
        .input::placeholder { color: #a0aec0; }
        .button {
            padding: 15px 25px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-bottom: 10px;
        }
        .button-primary {
            background: linear-gradient(135deg, #00d4ff 0%, #90e0ef 100%);
            color: #1a202c;
        }
        .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
        }
        .button-secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .button-secondary:hover {
            background: rgba(255,255,255,0.2);
        }
        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        .status {
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .status-success {
            background: rgba(72, 187, 120, 0.2);
            color: #68d391;
            border: 1px solid rgba(72, 187, 120, 0.3);
        }
        .status-error {
            background: rgba(245, 101, 101, 0.2);
            color: #fc8181;
            border: 1px solid rgba(245, 101, 101, 0.3);
        }
        .user-info {
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(0, 212, 255, 0.1);
            border-radius: 15px;
            border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .user-info h3 {
            color: #00d4ff;
            margin-bottom: 10px;
        }
        .user-info .stat {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: #a0aec0;
        }
        .user-info .stat .value {
            color: white;
            font-weight: 600;
        }
        .market-data {
            margin-bottom: 25px;
        }
        .market-data h4 {
            color: #00d4ff;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        .market-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .market-item:last-child { border-bottom: none; }
        .market-symbol {
            font-weight: 600;
            color: white;
        }
        .market-price {
            text-align: right;
        }
        .market-price .price {
            font-weight: 600;
            color: white;
        }
        .market-price .change {
            font-size: 0.9rem;
        }
        .change-positive { color: #68d391; }
        .change-negative { color: #fc8181; }
        .chat-area {
            flex: 1;
            padding: 25px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .chat-header {
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-header h3 {
            color: #00d4ff;
            font-size: 1.3rem;
        }
        .ai-badge {
            background: linear-gradient(135deg, #00d4ff 0%, #90e0ef 100%);
            color: #1a202c;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .message {
            max-width: 85%;
            padding: 18px 22px;
            border-radius: 18px;
            word-wrap: break-word;
            line-height: 1.6;
        }
        .message-user {
            background: linear-gradient(135deg, #00d4ff 0%, #90e0ef 100%);
            color: #1a202c;
            margin-left: auto;
            border-bottom-right-radius: 6px;
        }
        .message-ai {
            background: rgba(255,255,255,0.08);
            color: white;
            border: 1px solid rgba(255,255,255,0.1);
            border-bottom-left-radius: 6px;
        }
        .message-meta {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .chat-form {
            padding: 25px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            gap: 15px;
            align-items: flex-end;
        }
        .chat-input {
            flex: 1;
            padding: 15px 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 15px;
            color: white;
            font-size: 15px;
            resize: vertical;
            min-height: 50px;
            max-height: 120px;
        }
        .chat-input:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
        }
        .send-button {
            padding: 15px 25px;
            background: linear-gradient(135deg, #00d4ff 0%, #90e0ef 100%);
            color: #1a202c;
            border: none;
            border-radius: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .send-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
        }
        .send-button:disabled {
            opacity: 0.5;
            transform: none;
            box-shadow: none;
        }
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #a0aec0;
            font-style: italic;
        }
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00d4ff;
            animation: typing 1.4s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
            30% { opacity: 1; transform: scale(1); }
        }
        .toggle-link {
            text-align: center;
            color: #00d4ff;
            cursor: pointer;
            text-decoration: underline;
            margin-top: 20px;
            transition: color 0.3s ease;
        }
        .toggle-link:hover { color: #90e0ef; }
        .hidden { display: none; }
        .features-list {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .features-list h4 {
            color: #00d4ff;
            margin-bottom: 12px;
            font-size: 1rem;
        }
        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: #a0aec0;
            font-size: 0.9rem;
        }
        .feature-icon {
            color: #68d391;
            font-weight: bold;
        }
        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            .sidebar {
                order: 2;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SmartProIA</h1>
            <p>Professional AI Financial Advisor</p>
        </div>

        <!-- Pantalla de autenticación -->
        <div id="auth-screen">
            <div class="auth-container">
                <div id="status"></div>
                
                <button class="button button-secondary" onclick="testConnection()">
                    Probar Conexión del Sistema
                </button>
                
                <div id="auth-form">
                    <input type="text" id="name" class="input" placeholder="Nombre completo" style="display: none;">
                    <input type="email" id="email" class="input" placeholder="Email profesional">
                    <input type="password" id="password" class="input" placeholder="Contraseña segura (mín. 8 caracteres)" minlength="8">
                    
                    <button class="button button-primary" onclick="authenticate()" id="auth-button">
                        Iniciar Sesión
                    </button>
                    
                    <div class="toggle-link" onclick="toggleAuthMode()">
                        ¿No tienes cuenta? Regístrate gratis
                    </div>
                </div>
                
                <div class="features-list">
                    <h4>Características Profesionales:</h4>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Análisis con IA financiera avanzada</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Datos de mercado en tiempo real</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Indicadores técnicos calculados</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Memoria de conversación contextual</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard principal -->
        <div id="dashboard" class="dashboard hidden">
            <div class="sidebar">
                <div class="user-info">
                    <h3 id="user-name">Usuario</h3>
                    <div class="stat">
                        <span>Plan:</span>
                        <span class="value" id="user-plan">FREE</span>
                    </div>
                    <div class="stat">
                        <span>Consultas:</span>
                        <span class="value" id="user-queries">5/5</span>
                    </div>
                    <button class="button button-secondary" onclick="logout()" style="margin-top: 15px; font-size: 14px;">
                        Cerrar Sesión
                    </button>
                </div>

                <div class="market-data">
                    <h4>Mercado en Tiempo Real</h4>
                    <div id="market-data-container">
                        <div class="market-item">
                            <div class="market-symbol">Cargando...</div>
                        </div>
                    </div>
                    <button class="button button-secondary" onclick="refreshMarketData()" style="margin-top: 15px; font-size: 14px;">
                        Actualizar Datos
                    </button>
                </div>

                <div class="features-list">
                    <h4>Consejos de Uso:</h4>
                    <div class="feature-item">
                        <span class="feature-icon">💡</span>
                        <span>Pregunta por análisis específicos de acciones</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>Solicita niveles técnicos y puntos de entrada</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">⚠️</span>
                        <span>Pide evaluación de riesgos</span>
                    </div>
                </div>
            </div>

            <div class="main-chat">
                <div class="chat-header">
                    <h3>Análisis Profesional con IA</h3>
                    <div class="ai-badge">AI FINANCIERO</div>
                </div>
                
                <div class="chat-area" id="chat-messages"></div>
                
                <form class="chat-form" onsubmit="sendMessage(event)">
                    <textarea 
                        id="message-input" 
                        class="chat-input" 
                        placeholder="Ej: 'Analiza NVIDIA para inversión a corto plazo' o 'Compara Tesla vs Ford considerando el mercado EV'"
                        rows="2"
                        required
                    ></textarea>
                    <button type="submit" class="send-button" id="send-btn">Analizar</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        const API_URL = 'https://ai-investment-advisor-production.up.railway.app';
        let currentUser = null;
        let isLoginMode = true;
        let marketData = {};

        function showStatus(message, isError = false) {
            const status = document.getElementById('status');
            status.innerHTML = `<div class="status ${isError ? 'status-error' : 'status-success'}">${message}</div>`;
            setTimeout(() => status.innerHTML = '', 8000);
        }

        function clearStatus() {
            document.getElementById('status').innerHTML = '';
        }

        async function testConnection() {
            showStatus('Verificando sistema profesional...', false);
            
            try {
                const response = await fetch(`${API_URL}/api/health`);
                const data = await response.json();
                
                if (response.ok) {
                    showStatus(`Sistema operacional - IA: ${data.services.claude_ai} | Datos: ${data.services.market_data} | BD: ${data.services.database}`, false);
                } else {
                    showStatus(`Error del sistema: ${response.status}`, true);
                }
            } catch (error) {
                showStatus(`Error de conexión: ${error.message}`, true);
            }
        }

        function toggleAuthMode() {
            isLoginMode = !isLoginMode;
            const nameInput = document.getElementById('name');
            const authButton = document.getElementById('auth-button');
            const toggle = document.querySelector('.toggle-link');
            
            if (isLoginMode) {
                nameInput.style.display = 'none';
                authButton.textContent = 'Iniciar Sesión';
                toggle.textContent = '¿No tienes cuenta? Regístrate gratis';
            } else {
                nameInput.style.display = 'block';
                authButton.textContent = 'Crear Cuenta Profesional';
                toggle.textContent = '¿Ya tienes cuenta? Inicia sesión';
            }
            clearStatus();
        }

        async function authenticate() {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showStatus('Email y contraseña son requeridos', true);
                return;
            }
            
            if (!isLoginMode && !name) {
                showStatus('Nombre es requerido para registro', true);
                return;
            }
            
            if (password.length < 8) {
                showStatus('La contraseña debe tener mínimo 8 caracteres', true);
                return;
            }

            const authButton = document.getElementById('auth-button');
            authButton.disabled = true;
            authButton.textContent = 'Procesando...';
            
            try {
                const endpoint = isLoginMode ? '/api/login' : '/api/register';
                const body = isLoginMode ? { email, password } : { name, email, password };

                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    currentUser = data.user;
                    showDashboard();
                    showStatus(`${isLoginMode ? 'Login' : 'Registro'} exitoso`, false);
                } else {
                    showStatus(data.error || 'Error en la autenticación', true);
                }
            } catch (error) {
                showStatus(`Error de conexión: ${error.message}`, true);
            }

            authButton.disabled = false;
            authButton.textContent = isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta Profesional';
        }

        async function showDashboard() {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            
            // Actualizar información del usuario
            document.getElementById('user-name').textContent = currentUser.name;
            document.getElementById('user-plan').textContent = currentUser.subscription_plan.toUpperCase();
            document.getElementById('user-queries').textContent = `${currentUser.queries_remaining}/${currentUser.queries_limit}`;
            
            // Cargar datos de mercado
            await refreshMarketData();
            
            // Mensaje de bienvenida profesional
            addMessage(
                `Bienvenido al análisis profesional, ${currentUser.name}.\n\nTienes ${currentUser.queries_remaining} consultas disponibles. Como asesor de inversiones con IA avanzada, puedo ayudarte con:\n\n• Análisis técnico de acciones específicas\n• Evaluación de riesgos y oportunidades\n• Estrategias de entrada y salida\n• Comparativas entre sectores\n• Timing de inversiones\n\nMenciona cualquier símbolo (NVIDIA, Tesla, Bitcoin, etc.) para análisis detallado con datos en tiempo real.`,
                false
            );
        }

        async function refreshMarketData() {
            try {
                const response = await fetch(`${API_URL}/api/market-data`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    marketData = data.data;
                    updateMarketDisplay();
                }
            } catch (error) {
                console.error('Error cargando datos de mercado:', error);
            }
        }

        function updateMarketDisplay() {
            const container = document.getElementById('market-data-container');
            const symbols = ['NVDA', 'TSLA', 'MSFT', 'BTCUSD'];
            
            container.innerHTML = '';
            
            symbols.forEach(symbol => {
                if (marketData[symbol]) {
                    const data = marketData[symbol];
                    const changeClass = data.changePercent >= 0 ? 'change-positive' : 'change-negative';
                    const changeSymbol = data.changePercent >= 0 ? '+' : '';
                    
                    const item = document.createElement('div');
                    item.className = 'market-item';
                    item.innerHTML = `
                        <div class="market-symbol">${symbol}</div>
                        <div class="market-price">
                            <div class="price">$${data.price}</div>
                            <div class="change ${changeClass}">${changeSymbol}${data.changePercent}%</div>
                        </div>
                    `;
                    container.appendChild(item);
                }
            });
        }

        function addMessage(text, isUser) {
            const chatMessages = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'message-user' : 'message-ai'}`;
            
            const timestamp = new Date().toLocaleTimeString();
            messageDiv.innerHTML = `
                <div class="message-meta">
                    ${isUser ? 'Tú' : 'SmartProIA'} • ${timestamp}
                </div>
                <div style="white-space: pre-wrap;">${text}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        async function sendMessage(event) {
            event.preventDefault();
            
            const messageInput = document.getElementById('message-input');
            const sendBtn = document.getElementById('send-btn');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            addMessage(message, true);
            messageInput.value = '';
            sendBtn.disabled = true;
            sendBtn.textContent = 'Analizando...';
            
            // Indicador de escritura
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message message-ai';
            typingDiv.innerHTML = `
                <div class="message-meta">SmartProIA • Analizando</div>
                <div class="typing-indicator">
                    <span>Procesando análisis profesional</span>
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            document.getElementById('chat-messages').appendChild(typingDiv);
            
            try {
                const response = await fetch(`${API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                
                typingDiv.remove();

                if (response.ok) {
                    addMessage(data.response, false);
                    
                    // Actualizar contador de consultas
                    if (data.queries_remaining !== undefined) {
                        document.getElementById('user-queries').textContent = `${data.queries_remaining}/${currentUser.queries_limit}`;
                        currentUser.queries_remaining = data.queries_remaining;
                    }
                } else {
                    if (response.status === 429) {
                        addMessage('Has alcanzado el límite de consultas de tu plan. Actualiza para continuar con análisis ilimitados.', false);
                    } else {
                        addMessage(`Error: ${data.error}`, false);
                    }
                }
            } catch (error) {
                typingDiv.remove();
                addMessage(`Error de conexión: ${error.message}`, false);
            }
            
            sendBtn.disabled = false;
            sendBtn.textContent = 'Analizar';
        }

        function logout() {
            localStorage.removeItem('token');
            currentUser = null;
            marketData = {};
            
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('chat-messages').innerHTML = '';
            
            // Limpiar formulario
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('name').value = '';
            
            showStatus('Sesión cerrada correctamente', false);
        }

        // Verificar sesión existente
        async function checkExistingSession() {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/api/user-profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    currentUser = data.user;
                    showDashboard();
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }

        // Auto-resize textarea
        document.addEventListener('DOMContentLoaded', () => {
            checkExistingSession();
            
            const textarea = document.getElementById('message-input');
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        });
    </script>
</body>
</html>
