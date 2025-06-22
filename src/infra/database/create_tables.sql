-- Tabela de Clientes
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
    ('arduino_client_001', 'secret_arduino_2023', 'Arduino Balança Principal'),
    ('web_client_001', 'secret_web_2023', 'Aplicação Web')
ON CONFLICT (client_id) DO NOTHING;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL CHECK (weight >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Leituras de Peso
CREATE TABLE IF NOT EXISTS weight_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL CHECK (weight >= 0),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_weight_readings_product_name ON weight_readings(product_name);
CREATE INDEX IF NOT EXISTS idx_weight_readings_timestamp ON weight_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_weight_readings_created_at ON weight_readings(created_at);

-- Comentários para documentação
COMMENT ON TABLE clients IS 'Tabela de clientes autenticados (Arduino e Web)';
COMMENT ON COLUMN clients.client_id IS 'Identificador único do cliente usado para autenticação';
COMMENT ON COLUMN clients.client_secret IS 'Segredo do cliente para autenticação';
COMMENT ON COLUMN clients.is_active IS 'Status ativo/inativo do cliente';

COMMENT ON TABLE products IS 'Tabela de produtos cadastrados no sistema';
COMMENT ON COLUMN products.name IS 'Nome único do produto';
COMMENT ON COLUMN products.weight IS 'Peso padrão do produto em gramas';

COMMENT ON TABLE weight_readings IS 'Tabela de leituras de peso enviadas pelo Arduino';
COMMENT ON COLUMN weight_readings.product_name IS 'Nome do produto pesado';
COMMENT ON COLUMN weight_readings.weight IS 'Peso lido em gramas';
COMMENT ON COLUMN weight_readings.timestamp IS 'Timestamp da leitura (do Arduino)';

-- Visualizações úteis
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

CREATE OR REPLACE VIEW v_recent_readings AS
SELECT 
    wr.*,
    RANK() OVER (PARTITION BY product_name ORDER BY timestamp DESC) as reading_rank
FROM weight_readings wr
ORDER BY timestamp DESC;

-- RLS (Row Level Security) - Opcional para maior segurança
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE weight_readings ENABLE ROW LEVEL SECURITY; 