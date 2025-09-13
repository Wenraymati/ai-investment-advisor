const { Pool } = require('pg');
require('dotenv').config();

// Ultra Database Initialization System
class UltraDatabaseSetup {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async initializeUltraDatabase() {
    console.log('🚀 === SMARTPROIA ULTRA DATABASE SETUP v4.0 ===');
    console.log('📊 Initializing ultra-intelligent database schema...\n');

    try {
      const client = await this.pool.connect();

      try {
        // Enable extensions
        await this.enableExtensions(client);
        
        // Create tables in order
        await this.createUsersTable(client);
        await this.createChatHistoryTable(client);
        await this.createAlertsTable(client);
        await this.createMarketDataTable(client);
        await this.createPerformanceTable(client);
        await this.createAnalyticsTable(client);
        
        // Create indexes for performance
        await this.createIndexes(client);
        
        // Create stored procedures
        await this.createStoredProcedures(client);

        console.log('\n✅ Ultra Database initialized successfully!');
        console.log('🎯 All tables, indexes, and procedures created');
        console.log('📈 Ready for ultra-intelligent operations\n');

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  async enableExtensions(client) {
    console.log('🔧 Enabling PostgreSQL extensions...');
    
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('   ✅ Extensions enabled');
    } catch (error) {
      console.log('   ⚠️ Extensions already exist or not available');
    }
  }

  async createUsersTable(client) {
    console.log('👥 Creating ultra users table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        
        -- Subscription info
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'active',
        subscription_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subscription_end TIMESTAMP,
        
        -- Usage tracking
        queries_used INTEGER DEFAULT 0,
        queries_used_today INTEGER DEFAULT 0,
        total_queries INTEGER DEFAULT 0,
        last_query_reset DATE DEFAULT CURRENT_DATE,
        
        -- User preferences
        risk_profile VARCHAR(50) DEFAULT 'moderate',
        preferred_assets TEXT[] DEFAULT '{}',
        notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
        timezone VARCHAR(100) DEFAULT 'UTC',
        language VARCHAR(10) DEFAULT 'es',
        
        -- Performance tracking
        total_profit_loss DECIMAL(15,2) DEFAULT 0,
        win_rate DECIMAL(5,2) DEFAULT 0,
        avg_holding_time INTEGER DEFAULT 0,
        
        -- Security
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        last_active TIMESTAMP,
        ip_address INET,
        
        -- Soft delete
        deleted_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    console.log('   ✅ Users table created with ultra features');
  }

  async createChatHistoryTable(client) {
    console.log('💬 Creating ultra chat history table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Message content
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'analysis',
        
        -- Analysis metadata
        symbols_analyzed TEXT[] DEFAULT '{}',
        analysis_type VARCHAR(50) DEFAULT 'ultra_ai',
        confidence_score DECIMAL(5,2),
        
        -- Technical data
        market_data JSONB,
        technical_indicators JSONB,
        risk_metrics JSONB,
        
        -- Performance metrics
        user_plan VARCHAR(50),
        response_time_ms INTEGER,
        ai_model_used VARCHAR(100) DEFAULT 'claude-3-haiku',
        tokens_used INTEGER,
        
        -- Data sources
        data_sources TEXT[] DEFAULT '{}',
        real_time_data BOOLEAN DEFAULT false,
        data_freshness_seconds INTEGER,
        
        -- Feedback and learning
        user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
        user_feedback TEXT,
        followed_recommendation BOOLEAN,
        recommendation_outcome DECIMAL(10,4),
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('   ✅ Chat history table with ultra AI tracking');
  }

  async createAlertsTable(client) {
    console.log('🚨 Creating ultra alerts system...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Alert configuration
        symbol VARCHAR(20) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        condition_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'rsi_oversold', etc.
        condition_value DECIMAL(15,8),
        current_value DECIMAL(15,8),
        
        -- Alert settings
        is_active BOOLEAN DEFAULT true,
        repeat_alert BOOLEAN DEFAULT false,
        max_triggers INTEGER DEFAULT 1,
        trigger_count INTEGER DEFAULT 0,
        
        -- Notification preferences
        notify_email BOOLEAN DEFAULT true,
        notify_push BOOLEAN DEFAULT true,
        
        -- Trigger tracking
        triggered_at TIMESTAMP,
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_frequency INTEGER DEFAULT 300, -- seconds
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);
    
    console.log('   ✅ Ultra alerts system ready');
  }

  async createMarketDataTable(client) {
    console.log('📊 Creating market data cache table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_data_cache (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        
        -- Price data
        price DECIMAL(15,8) NOT NULL,
        price_change DECIMAL(15,8),
        price_change_percent DECIMAL(10,4),
        volume BIGINT,
        market_cap BIGINT,
        
        -- OHLC data
        open_price DECIMAL(15,8),
        high_price DECIMAL(15,8),
        low_price DECIMAL(15,8),
        close_price DECIMAL(15,8),
        
        -- Technical indicators
        rsi DECIMAL(6,2),
        support_level DECIMAL(15,8),
        resistance_level DECIMAL(15,8),
        trend_direction VARCHAR(20),
        volatility DECIMAL(6,2),
        
        -- Additional data
        data_source VARCHAR(50) NOT NULL,
        data_quality DECIMAL(4,2) DEFAULT 100.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Performance optimization
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(symbol, data_source)
      )
    `);
    
    console.log('   ✅ Market data caching system ready');
  }

  async createPerformanceTable(client) {
    console.log('📈 Creating performance tracking table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_performance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Trade tracking
        symbol VARCHAR(20),
        action VARCHAR(10), -- 'buy', 'sell', 'hold'
        recommended_price DECIMAL(15,8),
        actual_price DECIMAL(15,8),
        quantity DECIMAL(15,8),
        
        -- Performance metrics
        profit_loss DECIMAL(15,4),
        roi_percentage DECIMAL(10,4),
        holding_time_days INTEGER,
        
        -- Recommendation tracking
        chat_id INTEGER REFERENCES chat_history(id),
        recommendation_followed BOOLEAN,
        outcome_rating INTEGER CHECK (outcome_rating BETWEEN 1 AND 5),
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP
      )
    `);
    
    console.log('   ✅ Performance tracking ready');
  }

  async createAnalyticsTable(client) {
    console.log('📊 Creating analytics table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        
        -- Event data
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(50),
        event_action VARCHAR(100),
        event_label VARCHAR(200),
        event_value DECIMAL(15,4),
        
        -- Session data
        session_id VARCHAR(255),
        user_agent TEXT,
        ip_address INET,
        referrer TEXT,
        
        -- Technical data
        page_url TEXT,
        response_time_ms INTEGER,
        error_message TEXT,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('   ✅ Analytics tracking ready');
  }

  async createIndexes(client) {
    console.log('⚡ Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription ON users(subscription_plan, subscription_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active, deleted_at)',
      
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_created ON chat_history(user_id, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_symbols ON chat_history USING GIN(symbols_analyzed)',
      
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_user_active ON alerts(user_id, is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_symbol_active ON alerts(symbol, is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_next_check ON alerts(next_check) WHERE is_active = true',
      
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_symbol_source ON market_data_cache(symbol, data_source)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_updated ON market_data_cache(last_updated DESC)',
      
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_user_created ON user_performance(user_id, created_at DESC)',
      
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_type_created ON analytics_events(event_type, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_created ON analytics_events(user_id, created_at DESC)'
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`   ⚠️ Index might already exist: ${error.message}`);
      }
    }
    
    console.log('   ✅ Performance indexes created');
  }

  async createStoredProcedures(client) {
    console.log('⚙️ Creating stored procedures...');
    
    // Reset daily query limits
    await client.query(`
      CREATE OR REPLACE FUNCTION reset_daily_queries()
      RETURNS void AS $$
      BEGIN
        UPDATE users 
        SET queries_used_today = 0, last_query_reset = CURRENT_DATE 
        WHERE last_query_reset < CURRENT_DATE;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Calculate user performance
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_user_performance(p_user_id INTEGER)
      RETURNS TABLE(
        total_trades INTEGER,
        winning_trades INTEGER,
        win_rate DECIMAL,
        total_pnl DECIMAL,
        avg_roi DECIMAL
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COUNT(*)::INTEGER as total_trades,
          COUNT(CASE WHEN profit_loss > 0 THEN 1 END)::INTEGER as winning_trades,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              ROUND((COUNT(CASE WHEN profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0 
          END as win_rate,
          COALESCE(SUM(profit_loss), 0) as total_pnl,
          COALESCE(AVG(roi_percentage), 0) as avg_roi
        FROM user_performance 
        WHERE user_id = p_user_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Get user query limits
    await client.query(`
      CREATE OR REPLACE FUNCTION get_user_limits(p_user_id INTEGER)
      RETURNS TABLE(
        plan VARCHAR,
        queries_limit INTEGER,
        queries_used INTEGER,
        queries_remaining INTEGER
      ) AS $$
      DECLARE
        user_plan VARCHAR(50);
        daily_limit INTEGER;
        used_today INTEGER;
      BEGIN
        SELECT subscription_plan, queries_used_today 
        INTO user_plan, used_today
        FROM users WHERE id = p_user_id;
        
        daily_limit := CASE user_plan
          WHEN 'free' THEN 5
          WHEN 'pro' THEN 50
          WHEN 'premium' THEN 200
          WHEN 'enterprise' THEN 999
          ELSE 5
        END;
        
        RETURN QUERY SELECT 
          user_plan,
          daily_limit,
          COALESCE(used_today, 0),
          daily_limit - COALESCE(used_today, 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Stored procedures created');
  }
}

// Execute if run directly
if (require.main === module) {
  const setup = new UltraDatabaseSetup();
  
  setup.initializeUltraDatabase()
    .then(() => {
      console.log('🎉 SmartProIA Ultra Database Setup Complete!');
      console.log('🚀 System ready for ultra-intelligent operations');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { UltraDatabaseSetup };
