import https from 'node:https';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'STRIPE_RESTRICTED_KEY_PLACEholder';

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(json);
          }
        } catch (e) {
          reject(new Error('Falha ao decodificar JSON: ' + body));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('--- Criando Produto no Stripe ---');
    const product = await makeRequest('https://api.stripe.com/v1/products', {
      name: 'Despertar Premium',
      description: 'Desbloqueie fendas Rank S, IA nutricional e ferramentas de finanças no Ascend.',
      active: 'true'
    });
    console.log('✓ Produto criado com sucesso! ID:', product.id);

    console.log('--- Criando Preço Recorrente ($2.00/mês) ---');
    const price = await makeRequest('https://api.stripe.com/v1/prices', {
      product: product.id,
      unit_amount: '200', // $2.00 em centavos
      currency: 'usd',
      'recurring[interval]': 'month'
    });
    console.log('✓ Preço criado com sucesso! ID:', price.id);
    
    console.log('\n=============================================');
    console.log('Produto e Preço configurados com sucesso!');
    console.log('Price ID:', price.id);
    console.log('=============================================');
  } catch (err) {
    console.error('❌ Erro na operação do Stripe:', err);
  }
}

main();
