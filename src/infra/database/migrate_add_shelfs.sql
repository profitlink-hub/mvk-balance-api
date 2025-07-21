-- ================================
-- MIGRAÇÃO: ADICIONAR SISTEMA DE PRATILEIRAS
-- Script para adicionar tabelas de pratileiras a um banco existente
-- ================================

-- ================================
-- EXTENSÕES NECESSÁRIAS
-- ================================

-- Extensão para UUIDs (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- CRIAR TABELA DE PRATILEIRAS
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_shelfs_name ON shelfs(name);
CREATE INDEX IF NOT EXISTS idx_shelfs_is_active ON shelfs(is_active);
CREATE INDEX IF NOT EXISTS idx_shelfs_location ON shelfs(location);
CREATE INDEX IF NOT EXISTS idx_shelfs_total_weight ON shelfs(total_weight);
CREATE INDEX IF NOT EXISTS idx_shelfs_products_gin ON shelfs USING GIN (products);

-- ================================
-- CRIAR TABELA DE ITENS DA PRATILEIRA
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
    
    -- Constraint única para evitar duplicatas
    UNIQUE(shelf_id, product_id)
);

-- Índices para relacionamentos
CREATE INDEX IF NOT EXISTS idx_shelf_items_shelf_id ON shelf_items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_product_id ON shelf_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_quantity ON shelf_items(quantity);

-- ================================
-- ADICIONAR COLUNA SHELF_ID À TABELA WEIGHT_READINGS
-- ================================

DO $$
BEGIN
    -- Adicionar referência para pratileira nas leituras de peso
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'weight_readings' AND column_name = 'shelf_id') THEN
        ALTER TABLE weight_readings ADD COLUMN shelf_id UUID NULL REFERENCES shelfs(id);
        CREATE INDEX IF NOT EXISTS idx_weight_readings_shelf_id ON weight_readings(shelf_id);
        RAISE NOTICE '✅ Coluna shelf_id adicionada à tabela weight_readings';
    ELSE
        RAISE NOTICE '⚠️  Coluna shelf_id já existe na tabela weight_readings';
    END IF;
END $$;

-- ================================
-- FUNÇÕES PARA SINCRONIZAÇÃO AUTOMÁTICA
-- ================================

-- Função para recalcular peso total da pratileira
CREATE OR REPLACE FUNCTION update_shelf_total_weight()
RETURNS TRIGGER AS $$
BEGIN
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

-- Função para sincronizar produtos JSON na pratileira
CREATE OR REPLACE FUNCTION sync_shelf_products_json()
RETURNS TRIGGER AS $$
BEGIN
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
-- TRIGGERS PARA SINCRONIZAÇÃO
-- ================================

-- Triggers para atualizar updated_at das pratileiras
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shelfs_updated_at') THEN
        CREATE TRIGGER update_shelfs_updated_at BEFORE UPDATE ON shelfs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_shelfs_updated_at criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shelf_items_updated_at') THEN
        CREATE TRIGGER update_shelf_items_updated_at BEFORE UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_shelf_items_updated_at criado';
    END IF;
END $$;

-- Triggers para sincronização de peso total
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_insert') THEN
        CREATE TRIGGER sync_shelf_weight_on_insert AFTER INSERT ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
        RAISE NOTICE '✅ Trigger sync_shelf_weight_on_insert criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_update') THEN
        CREATE TRIGGER sync_shelf_weight_on_update AFTER UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
        RAISE NOTICE '✅ Trigger sync_shelf_weight_on_update criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_weight_on_delete') THEN
        CREATE TRIGGER sync_shelf_weight_on_delete AFTER DELETE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION update_shelf_total_weight();
        RAISE NOTICE '✅ Trigger sync_shelf_weight_on_delete criado';
    END IF;
END $$;

-- Triggers para sincronização do JSON de produtos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_insert') THEN
        CREATE TRIGGER sync_shelf_json_on_insert AFTER INSERT ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
        RAISE NOTICE '✅ Trigger sync_shelf_json_on_insert criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_update') THEN
        CREATE TRIGGER sync_shelf_json_on_update AFTER UPDATE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
        RAISE NOTICE '✅ Trigger sync_shelf_json_on_update criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_shelf_json_on_delete') THEN
        CREATE TRIGGER sync_shelf_json_on_delete AFTER DELETE ON shelf_items
            FOR EACH ROW EXECUTE FUNCTION sync_shelf_products_json();
        RAISE NOTICE '✅ Trigger sync_shelf_json_on_delete criado';
    END IF;
END $$;

-- ================================
-- VIEWS ESPECÍFICAS DAS PRATILEIRAS
-- ================================

-- View de pratileiras com detalhes completos
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

-- View de produtos utilizados em pratileiras
CREATE OR REPLACE VIEW v_shelf_products AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.weight as unit_weight,
    s.id as shelf_id,
    s.name as shelf_name,
    si.quantity,
    si.total_item_weight,
    si.position,
    si.added_at
FROM shelf_items si
JOIN products p ON p.id = si.product_id
JOIN shelfs s ON s.id = si.shelf_id
ORDER BY s.name, si.position NULLS LAST, p.name;

-- ================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================

COMMENT ON TABLE shelfs IS 'Tabela de pratileiras do sistema com cálculo automático de peso';
COMMENT ON COLUMN shelfs.name IS 'Nome único da pratileira';
COMMENT ON COLUMN shelfs.description IS 'Descrição detalhada da pratileira';
COMMENT ON COLUMN shelfs.products IS 'JSON com produtos e quantidades (atualizado automaticamente)';
COMMENT ON COLUMN shelfs.total_weight IS 'Peso total calculado automaticamente via triggers';
COMMENT ON COLUMN shelfs.max_capacity IS 'Capacidade máxima da pratileira em gramas';
COMMENT ON COLUMN shelfs.location IS 'Localização física da pratileira';

COMMENT ON TABLE shelf_items IS 'Relacionamento entre pratileiras e produtos com cálculo automático';
COMMENT ON COLUMN shelf_items.quantity IS 'Quantidade do produto na pratileira';
COMMENT ON COLUMN shelf_items.unit_weight IS 'Peso unitário do produto (cópia do products.weight)';
COMMENT ON COLUMN shelf_items.total_item_weight IS 'Peso total calculado (quantidade × peso unitário)';
COMMENT ON COLUMN shelf_items.position IS 'Posição do produto na pratileira (ordem)';

-- ================================
-- VERIFICAÇÃO FINAL
-- ================================

DO $$
DECLARE
    shelf_count INTEGER;
    item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shelf_count FROM shelfs;
    SELECT COUNT(*) INTO item_count FROM shelf_items;
    
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ MIGRAÇÃO DE PRATILEIRAS CONCLUÍDA!';
    RAISE NOTICE '📊 Tabelas: shelfs, shelf_items';
    RAISE NOTICE '📈 Views: v_shelfs_detailed, v_shelf_products';
    RAISE NOTICE '⚡ Triggers: sincronização automática configurada';
    RAISE NOTICE '📦 Pratileiras: % | Itens: %', shelf_count, item_count;
    RAISE NOTICE '🚀 Sistema pronto para usar endpoints de pratileiras!';
    RAISE NOTICE '================================';
END $$; 