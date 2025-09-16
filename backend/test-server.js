// Script para testar se o servidor está funcionando
const http = require('http');

const endpoints = [
  { name: 'Health Check', path: '/health' },
  { name: 'API Status', path: '/api/status' },
  { name: 'Stellar Status', path: '/api/stellar/status' },
  { name: 'Cronjobs Status', path: '/api/cronjobs/status' }
];

let currentIndex = 0;

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: 'GET'
    };

    console.log(`\n🔍 Testing ${endpoint.name} (${endpoint.path})...`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ ${endpoint.name}: ${res.statusCode}`);
          console.log(`📊 Response:`, JSON.stringify(jsonData, null, 2));
          resolve();
        } catch (e) {
          console.log(`✅ ${endpoint.name}: ${res.statusCode}`);
          console.log(`📊 Response:`, data);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${endpoint.name} Error:`, error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.error(`⏰ ${endpoint.name} Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting backend tests...\n');
  
  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    } catch (error) {
      console.error(`❌ Failed to test ${endpoint.name}`);
    }
  }
  
  console.log('\n🎯 All tests completed!');
  process.exit(0);
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
