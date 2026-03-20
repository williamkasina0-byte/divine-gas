const http = require('http');

const tests = [
    {
        name: "Reject Disposable Email",
        data: { username: "fake@mailinator.com", password: "Password123!", fullName: "John Doe", phone: "0712345678" },
        expectedError: "Temporary or disposable"
    },
    {
        name: "Reject Single Name",
        data: { username: "valid@gmail.com", password: "Password123!", fullName: "John", phone: "0712345678" },
        expectedError: "First and Last Name"
    },
    {
        name: "Reject Invalid Kenyan Prefix",
        data: { username: "valid@gmail.com", password: "Password123!", fullName: "John Doe", phone: "0799999999" }, // Assume 0799 is invalid if not in list
        expectedError: "recognized Kenyan carrier"
    },
    {
        name: "Accept Valid Kenyan Regular Data",
        data: { username: "realuser@gmail.com", password: "StrongPass1!", fullName: "William Kasina", phone: "0712345678" },
        expectedStatus: 200
    }
];

async function runTest(test) {
    return new Promise((resolve) => {
        const data = JSON.stringify(test.data);
        const options = {
            hostname: '127.0.0.1',
            port: 3002,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const response = JSON.parse(body);
                if (test.expectedError) {
                    if (response.error && response.error.includes(test.expectedError)) {
                        console.log(`✅ [PASS] ${test.name}`);
                    } else {
                        console.log(`❌ [FAIL] ${test.name}: Expected error containing "${test.expectedError}", got "${response.error}"`);
                    }
                } else if (test.expectedStatus) {
                    if (res.statusCode === 200 || response.message === "User registered successfully") {
                        console.log(`✅ [PASS] ${test.name}`);
                    } else {
                        console.log(`❌ [FAIL] ${test.name}: Expected status 200, got ${res.statusCode}. Error: ${response.error}`);
                    }
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`❌ [ERROR] ${test.name}: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function start() {
    console.log("Starting Advanced Validation Tests...");
    for (const test of tests) {
        await runTest(test);
    }
    process.exit();
}

start();
