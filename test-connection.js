const databaseConfig = require('./src/infra/database/database.config');

async function testConnection() {
  console.log('🧪 Teste de Conexão PostgreSQL\n');
  
  try {
    console.log('📋 Configurações atuais:');
    const info = databaseConfig.getConnectionInfo();
    console.log('   Host:', info.host);
    console.log('   Port:', info.port);
    console.log('   Database:', info.database);
    console.log('   User:', info.user);
    console.log('');
    
    console.log('🔌 Tentando conectar...');
    const connected = await databaseConfig.initialize();
    
    if (connected) {
      console.log('');
      console.log('✅ Conexão estabelecida com sucesso!');
      
      // Testar uma query simples
      console.log('🔍 Testando query simples...');
      const result = await databaseConfig.testConnection();
      
      if (result.success) {
        console.log('✅ Query executada com sucesso!');
        console.log('   Timestamp:', result.data.timestamp);
        console.log('   Versão do PostgreSQL:', result.data.version);
      } else {
        console.log('❌ Erro na query:', result.error);
      }
      
    } else {
      console.log('❌ Falha na conexão');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  } finally {
    // Fechar conexão
    await databaseConfig.close();
    console.log('');
    console.log('🔒 Conexão fechada');
  }
}

// Executar teste
testConnection().catch(console.error); 