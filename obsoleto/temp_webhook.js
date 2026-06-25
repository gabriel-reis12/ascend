import https from 'node:https';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'STRIPE_RESTRICTED_KEY_PLACEholder';

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach(v => postData.append(key, v));
      } else {
        postData.append(key, value);
      }
    }
    const postDataStr = postData.toString();
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataStr)
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
    req.write(postDataStr);
    req.end();
  });
}

async function main() {
  try {
    console.log('--- Criando Endpoint de Webhook no Stripe ---');
    const endpoint = await makeRequest('https://api.stripe.com/v1/webhook_endpoints', {
      url: 'https://oitgbsnnhvugglvmxjkq.supabase.co/functions/v1/stripe-webhook',
      'enabled_events[]': [
        'checkout.session.completed',
        'customer.subscription.deleted',
        'customer.subscription.updated'
      ],
      description: 'Webhook do Ascend para sincronizacao de assinaturas no Supabase.'
    });
    
    console.log('\n=============================================');
    console.log('Webhook configurado com sucesso no Stripe!');
    console.log('Webhook Secret:', endpoint.secret);
    console.log('=============================================');
  } catch (err) {
    console.error('❌ Erro ao criar webhook no Stripe:', err);
  }
}

main();
