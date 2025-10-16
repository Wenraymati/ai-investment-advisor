import React, { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, BarChart3, Bell, Settings, Crown, Zap, Star, Check, X, LogOut, Menu, AlertCircle } from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ==================== COMPONENTE PRINCIPAL ====================
const AIInvestmentAdvisor = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE}/user-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCurrentPage('dashboard');
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setCurrentPage('dashboard');
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const handleRegister = async (email, password, name) => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setCurrentPage('dashboard');
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl">Cargando SmartProIA...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} token={token} setUser={setUser} />;
};

// ==================== PÁGINA DE AUTENTICACIÓN ====================
const AuthPage = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await onLogin(formData.email, formData.password)
      : await onRegister(formData.email, formData.password, formData.name);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <h1 className="text-4xl font-bold mb-2">SmartProIA</h1>
          </div>
          <p className="text-gray-600">Tu Asesor de Inversiones con IA</p>
          <p className="text-sm text-gray-500 mt-2">Especializado en Quantum Computing & IA</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Registrarse Gratis'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', name: '' });
            }}
            className="text-blue-600 hover:text-blue-700 font-medium transition"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Al registrarte, aceptas nuestros términos y condiciones</p>
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ user, onLogout, token, setUser }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'chat', label: 'Chat IA', icon: MessageCircle },
    { id: 'portfolio', label: 'Portfolio', icon: BarChart3, premium: true },
    { id: 'alerts', label: 'Alertas', icon: Bell },
    { id: 'pricing', label: 'Planes', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmartProIA
              </h1>
              {user?.subscription_plan === 'premium' && (
                <Crown className="ml-2 h-5 w-5 text-yellow-500" />
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Hola, <span className="font-medium">{user?.name}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  user?.subscription_plan === 'premium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : user?.subscription_plan === 'basic'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.subscription_plan === 'free' ? 'Gratis' : user?.subscription_plan}
                </span>
              </div>
              {user?.subscription_plan !== 'free' && (
                <div className="text-xs text-gray-500">
                  Consultas: {user?.queries_used || 0}
                  {user?.subscription_plan === 'basic' ? '/50' : ''}
                </div>
              )}
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Salir
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-2">
              <div className="text-sm text-gray-600 pb-2 border-b">
                {user?.name} ({user?.subscription_plan})
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-2 md:space-x-4">
            {tabs.map(({ id, label, icon: Icon, premium }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
                {premium && user?.subscription_plan !== 'premium' && (
                  <Crown className="h-4 w-4 ml-1 text-yellow-500" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' && <ChatTab token={token} user={user} />}
        {activeTab === 'portfolio' && <PortfolioTab token={token} user={user} />}
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'pricing' && <PricingTab token={token} user={user} setUser={setUser} />}
      </div>
    </div>
  );
};

// ==================== CHAT TAB ====================
const ChatTab = ({ token, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { type: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
      } else {
        if (data.upgradeRequired) {
          setMessages(prev => [...prev, {
            type: 'upgrade',
            content: data.error
          }]);
        } else {
          setMessages(prev => [...prev, { type: 'error', content: data.error }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Error de conexión. Verifica tu internet.'
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Consulta a tu Asesor de IA</h2>
        {user?.subscription_plan === 'basic' && (
          <div className="text-sm text-gray-500">
            {user.queries_used || 0}/50 consultas
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">¡Hola! Soy tu asesor de inversiones en IA</p>
            <p className="mb-4">¿En qué puedo ayudarte hoy?</p>
            <div className="mt-6 text-sm text-left max-w-md mx-auto bg-white p-4 rounded-lg shadow">
              <p className="font-medium mb-2">Puedes preguntarme sobre:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Análisis de acciones (NVIDIA, Google, Tesla, etc.)</li>
                <li>• Inversión en computación cuántica (IonQ, Rigetti)</li>
                <li>• Criptomonedas y blockchain</li>
                <li>• Tendencias del mercado tecnológico</li>
                <li>• Estrategias de portfolio diversificado</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : message.type === 'upgrade'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-white text-gray-900 shadow-md border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block bg-white text-gray-900 px-4 py-3 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Analizando con IA...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu consulta sobre inversiones... (Presiona Enter para enviar)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          rows="2"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          Enviar
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        ⚠️ Esto no es asesoría financiera certificada. Consulta con un profesional antes de invertir.
      </p>
    </div>
  );
};

// ==================== PORTFOLIO TAB ====================
const PortfolioTab = ({ token, user }) => {
  const [stocks, setStocks] = useState(['NVDA', 'GOOGL', 'MSFT', 'IONQ']);
  const [newStock, setNewStock] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addStock = () => {
    const ticker = newStock.toUpperCase().trim();
    if (ticker && !stocks.includes(ticker)) {
      setStocks([...stocks, ticker]);
      setNewStock('');
    }
  };

  const removeStock = (stock) => {
    setStocks(stocks.filter(s => s !== stock));
  };

  const analyzePortfolio = async () => {
    if (user?.subscription_plan !== 'premium') {
      alert('⚠️ Esta función es exclusiva para usuarios Premium.\n\nActualiza tu plan para acceder a análisis completo de portfolio.');
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch(`${API_BASE}/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stocks })
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        alert(data.error || 'Error al analizar portfolio');
      }
    } catch (error) {
      alert('Error de conexión al analizar portfolio');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mi Portfolio de Inversión</h2>

        {/* Add Stock */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && addStock()}
            placeholder="Ticker (ej: NVDA, IONQ)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={5}
          />
          <button
            onClick={addStock}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Agregar
          </button>
        </div>

        {/* Stock List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stocks.map(stock => (
            <div key={stock} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-lg border border-blue-200 hover:shadow-md transition">
              <span className="font-bold text-blue-900">{stock}</span>
              <button
                onClick={() => removeStock(stock)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzePortfolio}
          disabled={isLoading || stocks.length === 0}
          className={`w-full py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center ${
            user?.subscription_plan === 'premium'
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analizando con IA...
            </>
          ) : (
            <>
              <BarChart3 className="h-5 w-5 mr-2" />
              {user?.subscription_plan === 'premium'
                ? 'Analizar Portfolio con IA'
                : 'Actualizar a Premium para Analizar'}
              {user?.subscription_plan !== 'premium' && <Crown className="h-5 w-5 ml-2" />}
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Análisis Detallado del Portfolio
          </h3>
          <div className="prose prose-blue max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{analysis}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ALERTS TAB ====================
const AlertsTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Alertas de Inversión</h2>
      <div className="text-center text-gray-500 py-12">
        <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Próximamente: Sistema de Alertas Personalizadas</p>
        <p className="text-sm mt-2">Te notificaremos sobre:</p>
        <ul className="mt-4 text-sm space-y-2 max-w-md mx-auto">
          <li>✓ Cambios significativos en tus inversiones</li>
          <li>✓ Oportunidades de compra/venta</li>
          <li>✓ Noticias relevantes del mercado</li>
          <li>✓ Alertas de precio personalizadas</li>
        </ul>
      </div>
    </div>
  );
};

// ==================== PRICING TAB ====================
const PricingTab = ({ token, user, setUser }) => {
  const [loading, setLoading] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: '$9',
      features: [
        '50 consultas al mes con IA',
        'Análisis básico de acciones',
        'Alertas por email',
        'Soporte por email',
        'Acceso a comunidad'
      ],
      current: user?.subscription_plan === 'basic'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$47',
      features: [
        'Consultas ILIMITADAS con IA',
        'Análisis completo de portfolio',
        'Alertas en tiempo real',
        'Reportes semanales personalizados',
        'Datos de mercado en vivo',
        'Soporte prioritario 24/7',
        'Acceso anticipado a nuevas features'
      ],
      current: user?.subscription_plan === 'premium',
      popular: true
    }
  ];

  const handleUpgrade = async (planId) => {
    setLoading(planId);

    try {
      const response = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planId })
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al procesar el pago');
        setLoading(null);
      }
    } catch (error) {
      alert('Error de conexión al procesar el pago');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes de Suscripción</h2>
        <p className="text-gray-600 text-lg">Elige el plan que mejor se adapte a tus necesidades de inversión</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-xl p-8 relative transition-all hover:shadow-2xl ${
              plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Más Popular
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
              <div className="text-5xl font-extrabold text-blue-600 mb-2">
                {plan.price}
                <span className="text-xl text-gray-500 font-normal">/mes</span>
              </div>
              {plan.id === 'premium' && (
                <p className="text-sm text-gray-500 mt-2">Menos de $1.60 por día</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.current || loading === plan.id}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed ${
                plan.current
                  ? 'bg-gray-100 text-gray-500'
                  : plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
            >
              {loading === plan.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : plan.current ? (
                '✓ Plan Actual'
              ) : (
                `Seleccionar ${plan.name}`
              )}
            </button>

            {plan.id === 'premium' && !plan.current && (
              <p className="text-center text-sm text-gray-500 mt-4">
                💳 Cancela cuando quieras. Sin compromisos.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
        <h3 className="font-semibold text-blue-900 mb-2">🔐 Pago 100% Seguro</h3>
        <p className="text-sm text-blue-800">
          Procesado por Stripe. No guardamos tu información de tarjeta. Puedes cancelar tu suscripción en cualquier momento desde tu cuenta.
        </p>
      </div>
    </div>
  );
};

export default AIInvestmentAdvisor;
