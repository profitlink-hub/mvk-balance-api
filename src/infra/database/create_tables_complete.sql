-- ================================
-- MVK BALANCE - SCRIPT COMPLETO DE CRIAÇÃO DE TABELAS
-- Inclui: Clientes, Produtos, Leituras de Peso e PrateleiraS
-- ================================

-- ================================
-- EXTENSÕES E CONFIGURAÇÕES
-- ================================

-- Extensão para UUIDs (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- TABELA DE CLIENTES
-- ================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Inserir clientes padrão
INSERT INTO clients (client_id, client_secret, name) VALUES 
    ('arduino_client_001', 'secret_arduino_2025', 'Arduino Balança Principal'),
    ('web_client_001', 'secret_web_2025', 'Aplicação Web')
ON CONFLICT (client_id) DO NOTHING;

-- ================================
-- TABELA DE PRODUTOS
-- ================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL CHECK (weight >= 0),
    expected_weight DECIMAL(10, 2) NULL CHECK (expected_weight >= 0),
    arduino_id INTEGER NULL,
    arduino_timestamp BIGINT NULL,
    registered_at TIMESTAMPTZ NULL,
    source VARCHAR(50) DEFAULT 'api',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);

-- ================================
-- TABELA DE PrateleiraS (NOVA)
-- ================================

CREATE TABLE IF NOT EXISTS shelfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NULL,
    products JSONB DEFAULT '[]'::jsonb,
    total_weight DECIMAL(10, 2) DEFAULT 0 CHECK (total_weight >= 0),
    max_capacity DECIMAL(10, 2) NULL CHECK (max_capacity >= 0),
    location VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_shelfs_name ON shelfs(name);
CREATE INDEX IF NOT EXISTS idx_shelfs_is_active ON shelfs(is_active);
CREATE INDEX IF NOT EXISTS idx_shelfs_location ON shelfs(location);
CREATE INDEX IF NOT EXISTS idx_shelfs_total_weight ON shelfs(total_weight);

-- Índice GIN para busca eficiente no JSON de produtos
CREATE INDEX IF NOT EXISTS idx_shelfs_products_gin ON shelfs USING GIN (products);

-- ================================
-- TABELA DE ITENS DA Prateleira (RELACIONAMENTO)
-- ================================

CREATE TABLE IF NOT EXISTS shelf_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelf_id UUID NOT NULL REFERENCES shelfs(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit_weight DECIMAL(10, 2) NOT NULL CHECK (unit_weight >= 0),
    total_item_weight DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_weight) STORED,
    position INTEGER NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que um produto não seja duplicado na mesma Prateleira
    UNIQUE(shelf_id, product_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_shelf_items_shelf_id ON shelf_items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_product_id ON shelf_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_quantity ON shelf_items(quantity);

-- ================================
-- TABELA DE LEITURAS DE PESO
-- ================================

CREATE TABLE IF NOT EXISTS weight_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL CHECK (weight >= 0),
    action VARCHAR(20) NULL,
    arduino_id INTEGER NULL,
    shelf_id UUID NULL REFERENCES shelfs(id),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    day_of_week VARCHAR(20) NULL
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_weight_readings_product_name ON weight_readings(product_name);
CREATE INDEX IF NOT EXISTS idx_weight_readings_timestamp ON weight_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_weight_readings_created_at ON weight_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_weight_readings_shelf_id ON weight_readings(shelf_id);

-- ================================
-- FUNÇÕES E TRIGGERS
-- ================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular peso total da Prateleira
CREATE OR REPLACE FUNCTION update_shelf_total_weight()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar peso total da Prateleira quando itens são modificados
    UPDATE shelfs 
    SET total_weight = (
        SELECT COALESCE(SUM(total_item_weight), 0)
        FROM shelf_items 
        WHERE shelf_id = COALESCE(NEW.shelf_id, OLD.shelf_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.shelf_id, OLD.shelf_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar produtos JSON na Prateleira
CREATE OR REPLACE FUNCTION sync_shelf_products_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar campo JSON com produtos da Prateleira
    UPDATE shelfs 
    SET products = (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'productId', si.product_id,
                    'productName', p.name,
                    'quantity', si.quantity,
                    'unitWeight', si.unit_weight,
                    'totalWeight', si.total_item_weight
                ) ORDER BY si.position NULLS LAST, p.name
            ),
            '[]'::jsonb
        )
        FROM shelf_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.shelf_id = COALESCE(NEW.shelf_id, OLD.shelf_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.shelf_id, OLD.shelf_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CRIAÇÃO DE TRIGGERS
-- ================================

-- Triggers para atualizar updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shelfs_updated_at') THEN
        CREATE TRIGGER update_shelfs_updated_at BEFORE UPDATE ON shelfs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shelf_items_updated_at') THEN
        CREATE TRIGGER update_shelf_items_updated_at BEFORE UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Triggers para sincronização automática de Prateleiras
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_insert') THEN
        CREATE TRIGGER sync_shelf_weight_on_insert AFTER INSERT ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_update') THEN
        CREATE TRIGGER sync_shelf_weight_on_update AFTER UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_delete') THEN
        CREATE TRIGGER sync_shelf_weight_on_delete AFTER DELETE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_insert') THEN
        CREATE TRIGGER sync_shelf_json_on_insert AFTER INSERT ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_update') THEN
        CREATE TRIGGER sync_shelf_json_on_update AFTER UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_delete') THEN
        CREATE TRIGGER sync_shelf_json_on_delete AFTER DELETE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
    END IF;
END $$;

-- ================================
-- VIEWS ÚTEIS
-- ================================

-- View de resumo de peso por produto
CREATE OR REPLACE VIEW v_weight_summary AS
SELECT 
    product_name,
    COUNT(*) as total_readings,
    AVG(weight) as avg_weight,
    MIN(weight) as min_weight,
    MAX(weight) as max_weight,
    MIN(timestamp) as first_reading,
    MAX(timestamp) as last_reading
FROM weight_readings 
GROUP BY product_name;

-- View de leituras recentes
CREATE OR REPLACE VIEW v_recent_readings AS
SELECT 
    wr.*,
    s.name as shelf_name,
    RANK() OVER (PARTITION BY product_name ORDER BY timestamp DESC) as reading_rank
FROM weight_readings wr
LEFT JOIN shelfs s ON s.id = wr.shelf_id
ORDER BY timestamp DESC;

-- View de Prateleiras com detalhes
CREATE OR REPLACE VIEW v_shelfs_detailed AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.total_weight,
    s.max_capacity,
    s.location,
    s.is_active,
    COUNT(si.id) as total_products,
    COALESCE(SUM(si.quantity), 0) as total_items,
    CASE 
        WHEN s.max_capacity > 0 THEN ROUND((s.total_weight / s.max_capacity * 100), 2)
        ELSE NULL 
    END as capacity_usage_percent,
    s.created_at,
    s.updated_at
FROM shelfs s
LEFT JOIN shelf_items si ON si.shelf_id = s.id
GROUP BY s.id, s.name, s.description, s.total_weight, s.max_capacity, s.location, s.is_active, s.created_at, s.updated_at;

-- View de produtos mais utilizados em Prateleiras
CREATE OR REPLACE VIEW v_popular_products AS
SELECT 
    p.id,
    p.name,
    p.weight as unit_weight,
    COUNT(si.shelf_id) as used_in_shelfs,
    COALESCE(SUM(si.quantity), 0) as total_quantity,
    COALESCE(SUM(si.total_item_weight), 0) as total_weight_in_shelfs
FROM products p
LEFT JOIN shelf_items si ON si.product_id = p.id
GROUP BY p.id, p.name, p.weight
ORDER BY used_in_shelfs DESC, total_quantity DESC;

-- ================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================

COMMENT ON TABLE clients IS 'Tabela de clientes autenticados (Arduino e Web)';
COMMENT ON COLUMN clients.client_id IS 'Identificador único do cliente usado para autenticação';
COMMENT ON COLUMN clients.client_secret IS 'Segredo do cliente para autenticação';
COMMENT ON COLUMN clients.is_active IS 'Status ativo/inativo do cliente';

COMMENT ON TABLE products IS 'Tabela de produtos cadastrados no sistema';
COMMENT ON COLUMN products.name IS 'Nome único do produto';
COMMENT ON COLUMN products.weight IS 'Peso padrão do produto em gramas';
COMMENT ON COLUMN products.expected_weight IS 'Peso esperado do produto (dados do Arduino)';
COMMENT ON COLUMN products.arduino_id IS 'ID do Arduino que cadastrou o produto';
COMMENT ON COLUMN products.arduino_timestamp IS 'Timestamp original do Arduino';
COMMENT ON COLUMN products.registered_at IS 'Data/hora de registro pelo Arduino';
COMMENT ON COLUMN products.source IS 'Fonte dos dados: api ou arduino';

COMMENT ON TABLE shelfs IS 'Tabela de Prateleiras do sistema';
COMMENT ON COLUMN shelfs.name IS 'Nome único da Prateleira';
COMMENT ON COLUMN shelfs.description IS 'Descrição detalhada da Prateleira';
COMMENT ON COLUMN shelfs.products IS 'JSON com produtos e quantidades da Prateleira';
COMMENT ON COLUMN shelfs.total_weight IS 'Peso total calculado automaticamente';
COMMENT ON COLUMN shelfs.max_capacity IS 'Capacidade máxima da Prateleira em gramas';
COMMENT ON COLUMN shelfs.location IS 'Localização física da Prateleira';

COMMENT ON TABLE shelf_items IS 'Relacionamento entre Prateleiras e produtos';
COMMENT ON COLUMN shelf_items.quantity IS 'Quantidade do produto na Prateleira';
COMMENT ON COLUMN shelf_items.unit_weight IS 'Peso unitário do produto (cópia)';
COMMENT ON COLUMN shelf_items.total_item_weight IS 'Peso total calculado (quantidade × peso)';
COMMENT ON COLUMN shelf_items.position IS 'Posição do produto na Prateleira';

COMMENT ON TABLE weight_readings IS 'Tabela de leituras de peso enviadas pelo Arduino';
COMMENT ON COLUMN weight_readings.product_name IS 'Nome do produto pesado';
COMMENT ON COLUMN weight_readings.weight IS 'Peso lido em gramas';
COMMENT ON COLUMN weight_readings.action IS 'Ação realizada: RETIRADO ou COLOCADO';
COMMENT ON COLUMN weight_readings.arduino_id IS 'ID do Arduino que registrou a leitura';
COMMENT ON COLUMN weight_readings.shelf_id IS 'Prateleira onde ocorreu a leitura';
COMMENT ON COLUMN weight_readings.timestamp IS 'Timestamp da leitura (do Arduino)';
COMMENT ON COLUMN weight_readings.day_of_week IS 'Dia da semana da leitura em português';

-- ================================
-- MIGRAÇÃO PARA COMPATIBILIDADE
-- ================================

-- Migração: Adicionar colunas do Arduino à tabela products (se não existirem)
DO $$
BEGIN
    -- expected_weight
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'expected_weight') THEN
        ALTER TABLE products ADD COLUMN expected_weight DECIMAL(10, 2) NULL CHECK (expected_weight >= 0);
    END IF;
    
    -- arduino_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'arduino_id') THEN
        ALTER TABLE products ADD COLUMN arduino_id INTEGER NULL;
    END IF;
    
    -- arduino_timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'arduino_timestamp') THEN
        ALTER TABLE products ADD COLUMN arduino_timestamp BIGINT NULL;
    END IF;
    
    -- registered_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'registered_at') THEN
        ALTER TABLE products ADD COLUMN registered_at TIMESTAMPTZ NULL;
    END IF;
    
    -- source
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'source') THEN
        ALTER TABLE products ADD COLUMN source VARCHAR(50) DEFAULT 'api';
    END IF;
END $$;

-- Migração: Adicionar colunas à tabela weight_readings (se não existirem)
DO $$
BEGIN
    -- action
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weight_readings' AND column_name = 'action') THEN
        ALTER TABLE weight_readings ADD COLUMN action VARCHAR(20) NULL;
    END IF;
    
    -- arduino_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weight_readings' AND column_name = 'arduino_id') THEN
        ALTER TABLE weight_readings ADD COLUMN arduino_id INTEGER NULL;
    END IF;
    
    -- shelf_id (NOVO)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weight_readings' AND column_name = 'shelf_id') THEN
        ALTER TABLE weight_readings ADD COLUMN shelf_id UUID NULL REFERENCES shelfs(id);
    END IF;
    
    -- day_of_week
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weight_readings' AND column_name = 'day_of_week') THEN
        ALTER TABLE weight_readings ADD COLUMN day_of_week VARCHAR(20) NULL;
    END IF;
END $$;

-- ================================
-- FINALIZAÇÃO
-- ================================

-- Estatísticas de criação
DO $$
BEGIN
    RAISE NOTICE '✅ Script de criação completo executado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: clients, products, shelfs, shelf_items, weight_readings';
    RAISE NOTICE '📈 Views criadas: v_weight_summary, v_recent_readings, v_shelfs_detailed, v_popular_products';
    RAISE NOTICE '⚡ Triggers e funções configurados para sincronização automática';
    RAISE NOTICE '🔗 Sistema de Prateleiras totalmente integrado e funcional';
END $$; 