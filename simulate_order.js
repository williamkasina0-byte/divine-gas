const http = require('http');

const orderData = JSON.stringify({
    customer_name: 'Test Customer',
    phone: '0712345678',
    address: 'Test Address Ruai',
    total: 3600,
    items: [
        { id: '1', quantity: 1, finalPrice: 1100, purchaseType: 'refill' },
        { id: '4', quantity: 1, finalPrice: 2500, purchaseType: 'new' }
    ],
    paymentMethod: 'cash_on_delivery'
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderData)
    }
};

console.log("Simulating new order...");

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Data: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(orderData);
req.end();
