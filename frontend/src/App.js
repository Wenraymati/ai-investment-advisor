import React, { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, BarChart3, Bell, Settings, Crown, Zap, Star, Check, X, LogOut, Menu, AlertCircle, Globe, Moon, Sun } from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ==================== TRANSLATIONS ====================
const translations = {
  en: {
    // Auth Page
    appTitle: 'SmartProIA',
    appSubtitle: 'Your AI-Powered Investment Advisor',
    appDescription: 'Specialized in Quantum Computing & AI',
    fullName: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    password: 'Password',
    passwordPlaceholder: 'Minimum 8 characters',
    signIn: 'Sign In',
    signUp: 'Sign Up Free',
    processing: 'Processing...',
    noAccount: "Don't have an account? Sign up free",
    haveAccount: 'Already have an account? Sign in',
    termsText: 'By signing up, you accept our terms and conditions',

    // Dashboard
    greeting: 'Hello',
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
    queries: 'Queries',
    logout: 'Logout',

    // Tabs
    chatTab: 'AI Chat',
    portfolioTab: 'Portfolio',
    alertsTab: 'Alerts',
    pricingTab: 'Plans',

    // Chat
    chatTitle: 'Consult Your AI Advisor',
    chatPlaceholder: 'Write your investment question... (Press Enter to send)',
    send: 'Send',
    analyzing: 'Analyzing with AI...',
    chatWelcome: 'Hi! I\'m your AI investment advisor',
    chatWelcomeQuestion: 'How can I help you today?',
    chatCanAsk: 'You can ask me about:',
    chatTopics: [
      '• Stock analysis (NVIDIA, Google, Tesla, etc.)',
      '• Quantum computing investment (IonQ, Rigetti)',
      '• Cryptocurrencies and blockchain',
      '• Tech market trends',
      '• Diversified portfolio strategies'
    ],
    disclaimer: '⚠️ This is not certified financial advice. Consult with a professional before investing.',

    // Portfolio
    portfolioTitle: 'My Investment Portfolio',
    tickerPlaceholder: 'Ticker (e.g: NVDA, IONQ)',
    add: 'Add',
    analyzePortfolio: 'Analyze Portfolio with AI',
    upgradePremiumAnalyze: 'Upgrade to Premium to Analyze',
    portfolioAnalysisTitle: 'Detailed Portfolio Analysis',
    premiumFeatureAlert: '⚠️ This feature is exclusive to Premium users.\n\nUpgrade your plan to access complete portfolio analysis.',

    // Alerts
    alertsTitle: 'Investment Alerts',
    alertsComingSoon: 'Coming Soon: Personalized Alert System',
    alertsNotifyAbout: 'We will notify you about:',
    alertsFeatures: [
      '✓ Significant changes in your investments',
      '✓ Buy/sell opportunities',
      '✓ Relevant market news',
      '✓ Personalized price alerts'
    ],

    // Pricing
    pricingTitle: 'Subscription Plans',
    pricingSubtitle: 'Choose the plan that best fits your investment needs',
    mostPopular: '⭐ Most Popular',
    perMonth: '/month',
    perDay: 'Less than $1.60 per day',
    currentPlan: '✓ Current Plan',
    selectPlan: 'Select',
    cancelAnytime: '💳 Cancel anytime. No commitments.',
    securePayment: '🔐 100% Secure Payment',
    securePaymentText: 'Processed by Stripe. We don\'t store your card information. You can cancel your subscription anytime from your account.',

    // Plan Features
    basicPlan: 'Basic',
    premiumPlan: 'Premium',
    basicFeatures: [
      '50 AI queries per month',
      'Basic stock analysis',
      'Email alerts',
      'Email support',
      'Community access'
    ],
    premiumFeatures: [
      'UNLIMITED AI queries',
      'Complete portfolio analysis',
      'Real-time alerts',
      'Personalized weekly reports',
      'Live market data',
      'Priority 24/7 support',
      'Early access to new features'
    ],

    // Errors
    connectionError: 'Connection error. Check your internet.',
    errorOccurred: 'An error occurred',

    // Loading
    loadingApp: 'Loading SmartProIA...'
  },
  es: {
    // Auth Page
    appTitle: 'SmartProIA',
    appSubtitle: 'Tu Asesor de Inversiones con IA',
    appDescription: 'Especializado en Computación Cuántica e IA',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Juan Pérez',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres',
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse Gratis',
    processing: 'Procesando...',
    noAccount: '¿No tienes cuenta? Regístrate gratis',
    haveAccount: '¿Ya tienes cuenta? Inicia sesión',
    termsText: 'Al registrarte, aceptas nuestros términos y condiciones',

    // Dashboard
    greeting: 'Hola',
    free: 'Gratis',
    basic: 'Básico',
    premium: 'Premium',
    queries: 'Consultas',
    logout: 'Salir',

    // Tabs
    chatTab: 'Chat IA',
    portfolioTab: 'Portfolio',
    alertsTab: 'Alertas',
    pricingTab: 'Planes',

    // Chat
    chatTitle: 'Consulta a tu Asesor de IA',
    chatPlaceholder: 'Escribe tu consulta sobre inversiones... (Presiona Enter para enviar)',
    send: 'Enviar',
    analyzing: 'Analizando con IA...',
    chatWelcome: '¡Hola! Soy tu asesor de inversiones con IA',
    chatWelcomeQuestion: '¿En qué puedo ayudarte hoy?',
    chatCanAsk: 'Puedes preguntarme sobre:',
    chatTopics: [
      '• Análisis de acciones (NVIDIA, Google, Tesla, etc.)',
      '• Inversión en computación cuántica (IonQ, Rigetti)',
      '• Criptomonedas y blockchain',
      '• Tendencias del mercado tecnológico',
      '• Estrategias de portfolio diversificado'
    ],
    disclaimer: '⚠️ Esto no es asesoría financiera certificada. Consulta con un profesional antes de invertir.',

    // Portfolio
    portfolioTitle: 'Mi Portfolio de Inversión',
    tickerPlaceholder: 'Ticker (ej: NVDA, IONQ)',
    add: 'Agregar',
    analyzePortfolio: 'Analizar Portfolio con IA',
    upgradePremiumAnalyze: 'Actualizar a Premium para Analizar',
    portfolioAnalysisTitle: 'Análisis Detallado del Portfolio',
    premiumFeatureAlert: '⚠️ Esta función es exclusiva para usuarios Premium.\n\nActualiza tu plan para acceder a análisis completo de portfolio.',

    // Alerts
    alertsTitle: 'Alertas de Inversión',
    alertsComingSoon: 'Próximamente: Sistema de Alertas Personalizadas',
    alertsNotifyAbout: 'Te notificaremos sobre:',
    alertsFeatures: [
      '✓ Cambios significativos en tus inversiones',
      '✓ Oportunidades de compra/venta',
      '✓ Noticias relevantes del mercado',
      '✓ Alertas de precio personalizadas'
    ],

    // Pricing
    pricingTitle: 'Planes de Suscripción',
    pricingSubtitle: 'Elige el plan que mejor se adapte a tus necesidades de inversión',
    mostPopular: '⭐ Más Popular',
    perMonth: '/mes',
    perDay: 'Menos de $1.60 por día',
    currentPlan: '✓ Plan Actual',
    selectPlan: 'Seleccionar',
    cancelAnytime: '💳 Cancela cuando quieras. Sin compromisos.',
    securePayment: '🔐 Pago 100% Seguro',
    securePaymentText: 'Procesado por Stripe. No guardamos tu información de tarjeta. Puedes cancelar tu suscripción en cualquier momento desde tu cuenta.',

    // Plan Features
    basicPlan: 'Básico',
    premiumPlan: 'Premium',
    basicFeatures: [
      '50 consultas al mes con IA',
      'Análisis básico de acciones',
      'Alertas por email',
      'Soporte por email',
      'Acceso a comunidad'
    ],
    premiumFeatures: [
      'Consultas ILIMITADAS con IA',
      'Análisis completo de portfolio',
      'Alertas en tiempo real',
      'Reportes semanales personalizados',
      'Datos de mercado en vivo',
      'Soporte prioritario 24/7',
      'Acceso anticipado a nuevas features'
    ],

    // Errors
    connectionError: 'Error de conexión. Verifica tu internet.',
    errorOccurred: 'Ocurrió un error',

    // Loading
    loadingApp: 'Cargando SmartProIA...'
  }
};

// ==================== COMPONENTE PRINCIPAL ====================
const AIInvestmentAdvisor = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

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
      return { success: false, error: t.connectionError };
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
      return { success: false, error: t.connectionError };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('login');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl font-semibold">{t.loadingApp}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} language={language} toggleLanguage={toggleLanguage} t={t} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} token={token} setUser={setUser} language={language} toggleLanguage={toggleLanguage} t={t} />;
};

// ==================== PÁGINA DE AUTENTICACIÓN ====================
const AuthPage = ({ onLogin, onRegister, language, toggleLanguage, t }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center space-x-2 transition-all shadow-lg z-10"
      >
        <Globe className="h-5 w-5" />
        <span className="font-medium">{language === 'en' ? 'ES' : 'EN'}</span>
      </button>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <TrendingUp className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.appTitle}
          </h1>
          <p className="text-gray-700 font-medium text-lg">{t.appSubtitle}</p>
          <p className="text-sm text-gray-500 mt-2">{t.appDescription}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start animate-fade-in">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.fullName}
              </label>
              <input
                type="text"
                placeholder={t.fullNamePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.email}
            </label>
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.password}
            </label>
            <input
              type="password"
              placeholder={t.passwordPlaceholder}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t.processing}
              </>
            ) : (
              isLogin ? t.signIn : t.signUp
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
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            {isLogin ? t.noAccount : t.haveAccount}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>{t.termsText}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ user, onLogout, token, setUser, language, toggleLanguage, t }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'chat', label: t.chatTab, icon: MessageCircle },
    { id: 'portfolio', label: t.portfolioTab, icon: BarChart3, premium: true },
    { id: 'alerts', label: t.alertsTab, icon: Bell },
    { id: 'pricing', label: t.pricingTab, icon: Star }
  ];

  const getPlanLabel = (plan) => {
    if (plan === 'free') return t.free;
    if (plan === 'basic') return t.basic;
    if (plan === 'premium') return t.premium;
    return plan;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              {user?.subscription_plan === 'premium' && (
                <Crown className="h-5 w-5 text-yellow-500 animate-pulse" />
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Change language"
              >
                <Globe className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-sm text-gray-600">
                {t.greeting}, <span className="font-semibold">{user?.name}</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
                  user?.subscription_plan === 'premium'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900'
                    : user?.subscription_plan === 'basic'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {getPlanLabel(user?.subscription_plan)}
                </span>
              </div>
              {user?.subscription_plan !== 'premium' && (
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {t.queries}: {user?.queries_used || 0}
                  {user?.subscription_plan === 'basic' ? '/50' : '/10'}
                </div>
              )}
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all"
              >
                <LogOut className="h-5 w-5 mr-1" />
                {t.logout}
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-lg animate-slide-in">
            <div className="px-4 py-3 space-y-2">
              <div className="text-sm text-gray-600 pb-2 border-b flex items-center justify-between">
                <span>{user?.name} ({getPlanLabel(user?.subscription_plan)})</span>
                <button onClick={toggleLanguage} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Globe className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.logout}
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 md:mb-8">
          <nav className="flex flex-wrap gap-2 md:space-x-2">
            {tabs.map(({ id, label, icon: Icon, premium }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 bg-white/50'
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
        {activeTab === 'chat' && <ChatTab token={token} user={user} language={language} t={t} />}
        {activeTab === 'portfolio' && <PortfolioTab token={token} user={user} t={t} />}
        {activeTab === 'alerts' && <AlertsTab t={t} />}
        {activeTab === 'pricing' && <PricingTab token={token} user={user} setUser={setUser} t={t} />}
      </div>
    </div>
  );
};

// ==================== CHAT TAB ====================
const ChatTab = ({ token, user, language, t }) => {
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
        body: JSON.stringify({ message: inputMessage, language })
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
        content: t.connectionError
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
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t.chatTitle}</h2>
        {user?.subscription_plan !== 'premium' && (
          <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {user?.queries_used || 0}/{user?.subscription_plan === 'basic' ? '50' : '10'}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-[400px] md:h-[500px] overflow-y-auto mb-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-12 md:mt-20 animate-fade-in">
            <div className="inline-block p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <MessageCircle className="h-12 w-12 md:h-16 md:w-16 text-white" />
            </div>
            <p className="text-lg md:text-xl font-bold mb-2 text-gray-900">{t.chatWelcome}</p>
            <p className="mb-6 text-gray-600">{t.chatWelcomeQuestion}</p>
            <div className="mt-6 text-sm text-left max-w-md mx-auto bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100">
              <p className="font-bold mb-3 text-gray-900">{t.chatCanAsk}</p>
              <ul className="space-y-2 text-gray-600">
                {t.chatTopics.map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'} animate-fade-in`}
          >
            <div
              className={`inline-block max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-700 border-2 border-red-200'
                  : message.type === 'upgrade'
                  ? 'bg-yellow-50 text-yellow-900 border-2 border-yellow-300'
                  : 'bg-white text-gray-900 shadow-md border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-left mb-4 animate-fade-in">
            <div className="inline-block bg-white text-gray-900 px-4 py-3 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-sm font-medium">{t.analyzing}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t.chatPlaceholder}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
          rows="2"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-bold"
        >
          {t.send}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {t.disclaimer}
      </p>
    </div>
  );
};

// ==================== PORTFOLIO TAB ====================
const PortfolioTab = ({ token, user, t }) => {
  const [stocks, setStocks] = useState(['NVDA', 'GOOGL', 'MSFT', 'IONQ']);
  const [newStock, setNewStock] = useState('');

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

  const analyzePortfolio = () => {
    if (user?.subscription_plan !== 'premium') {
      alert(t.premiumFeatureAlert);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">{t.portfolioTitle}</h2>

      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-6">
        <input
          type="text"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && addStock()}
          placeholder={t.tickerPlaceholder}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          maxLength={5}
        />
        <button
          onClick={addStock}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold"
        >
          {t.add}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stocks.map(stock => (
          <div key={stock} className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-xl border-2 border-indigo-200 hover:shadow-lg transition-all">
            <span className="font-bold text-indigo-900">{stock}</span>
            <button
              onClick={() => removeStock(stock)}
              className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={analyzePortfolio}
        disabled={stocks.length === 0}
        className={`w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center ${
          user?.subscription_plan === 'premium'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 shadow-lg hover:shadow-xl hover:scale-105'
        }`}
      >
        <BarChart3 className="h-6 w-6 mr-2" />
        {user?.subscription_plan === 'premium' ? t.analyzePortfolio : t.upgradePremiumAnalyze}
        {user?.subscription_plan !== 'premium' && <Crown className="h-5 w-5 ml-2" />}
      </button>
    </div>
  );
};

// ==================== ALERTS TAB ====================
const AlertsTab = ({ t }) => {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">{t.alertsTitle}</h2>
      <div className="text-center text-gray-600 py-12">
        <div className="inline-block p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl mb-4">
          <Bell className="h-16 w-16 text-indigo-600" />
        </div>
        <p className="text-lg font-bold mb-2 text-gray-900">{t.alertsComingSoon}</p>
        <p className="text-sm mt-2 mb-4">{t.alertsNotifyAbout}</p>
        <ul className="mt-6 text-sm space-y-2 max-w-md mx-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl shadow-inner">
          {t.alertsFeatures.map((feature, idx) => (
            <li key={idx} className="text-left">{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ==================== PRICING TAB ====================
const PricingTab = ({ token, user, setUser, t }) => {
  const [loading, setLoading] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: t.basicPlan,
      price: '$9',
      features: t.basicFeatures,
      current: user?.subscription_plan === 'basic'
    },
    {
      id: 'premium',
      name: t.premiumPlan,
      price: '$47',
      features: t.premiumFeatures,
      current: user?.subscription_plan === 'premium',
      popular: true
    }
  ];

  const handleUpgrade = async (planId) => {
    setLoading(planId);
    alert(`Stripe integration coming soon! You selected: ${planId}`);
    setLoading(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t.pricingTitle}</h2>
        <p className="text-gray-600 text-lg">{t.pricingSubtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-8 relative transition-all hover:shadow-2xl ${
              plan.popular ? 'ring-4 ring-indigo-500 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  {t.mostPopular}
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-3 text-gray-900">{plan.name}</h3>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {plan.price}
                <span className="text-xl text-gray-500 font-normal">{t.perMonth}</span>
              </div>
              {plan.id === 'premium' && (
                <p className="text-sm text-gray-500 mt-2">{t.perDay}</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="flex-shrink-0 p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.current || loading === plan.id}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:cursor-not-allowed ${
                plan.current
                  ? 'bg-gray-100 text-gray-500'
                  : plan.popular
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-800 hover:bg-gray-900 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading === plan.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t.processing}
                </div>
              ) : plan.current ? (
                t.currentPlan
              ) : (
                `${t.selectPlan} ${plan.name}`
              )}
            </button>

            {plan.id === 'premium' && !plan.current && (
              <p className="text-center text-sm text-gray-500 mt-4">
                {t.cancelAnytime}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 max-w-3xl mx-auto">
        <h3 className="font-bold text-indigo-900 mb-2">{t.securePayment}</h3>
        <p className="text-sm text-indigo-800">
          {t.securePaymentText}
        </p>
      </div>
    </div>
  );
};

export default AIInvestmentAdvisor;
