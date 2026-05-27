const url = 'https://oitgbsnnhvugglvmxjkq.supabase.co/rest/v1/exercises?select=*&limit=2';
const key1 = 'sb_publishable_dP1JBFIO30iObXUHf3Q6tg_x7xj39Gh';
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdGdic25uaHZ1Z2dsdm14amtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTM5MDAsImV4cCI6MjA5MjY4OTkwMH0.N4_jHlkPL86hz8Gr5iiYkIqW6FF905U_Jn9FklMZOx8';

async function test(name, key) {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log(`${name} Status:`, res.status);
    const text = await res.text();
    console.log(`${name} Length:`, text.length);
    console.log(`${name} Sample:`, text.substring(0, 100));
  } catch (err) {
    console.error(`${name} Error:`, err);
  }
}

async function run() {
  await test('Stripe/Clerk key', key1);
  await test('Standard JWT key', key2);
}

run();
