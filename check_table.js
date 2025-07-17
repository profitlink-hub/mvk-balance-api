const databaseConfig = require('./src/infra/database/database.config');

(async () => {
  try {
    console.log('🔌 Conectando ao banco...');
    await databaseConfig.initialize();
    
    console.log('📋 Verificando estrutura da tabela products...');
    const result = await databaseConfig.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela products:');
    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable} ${defaultVal}`);
    });
    
    console.log('\n🔍 Verificando se há produtos na tabela...');
    const countResult = await databaseConfig.query('SELECT COUNT(*) as total FROM products');
    console.log(`Total de produtos: ${countResult.rows[0].total}`);
    
    if (countResult.rows[0].total > 0) {
      const productsResult = await databaseConfig.query('SELECT * FROM products LIMIT 5');
      console.log('\n📦 Produtos existentes:');
      productsResult.rows.forEach(product => {
        console.log(`  - ID: ${product.id}, Nome: ${product.name}, Peso: ${product.weight}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await databaseConfig.close();
    process.exit(0);
  }
})(); 
