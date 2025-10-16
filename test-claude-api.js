require('dotenv').config();

async function testClaudeAPI() {
  console.log('🧪 Testeando API de Claude...\n');

  console.log('API Key:', process.env.ANTHROPIC_API_KEY ?
    '✅ ' + process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...' :
    '❌ No configurada');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('\n❌ Error: ANTHROPIC_API_KEY no está configurada');
    return;
  }

  try {
    console.log('\n📡 Enviando petición a Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: '¿Funciona esta API key? Responde solo "Sí, funciona correctamente"'
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('\n❌ Error en la API:');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    console.log('\n✅ ¡API Key funciona!');
    console.log('\n📝 Respuesta de Claude:');
    console.log(data.content[0].text);
    console.log('\n🎉 TODO FUNCIONANDO CORRECTAMENTE');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testClaudeAPI();
