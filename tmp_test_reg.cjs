import http from 'http';

const testRegistration = (data) => {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 3002,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: { error: body }
                    });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(payload);
        req.end();
    });
};

const runTests = async () => {
    console.log("--- Starting Registration Tests ---");

    try {
        // Test 1: Invalid Email
        console.log("\nTest 1: Invalid Email");
        const res1 = await testRegistration({ username: 'invalid', password: 'Password@123', fullName: 'Test User', phone: '0712345678' });
        console.log("Status:", res1.status, "Error:", res1.body.error);

        // Test 2: Short Name
        console.log("\nTest 2: Short Name");
        const res2 = await testRegistration({ username: 'test@example.com', password: 'Password@123', fullName: 'Ab', phone: '0712345678' });
        console.log("Status:", res2.status, "Error:", res2.body.error);

        // Test 3: Weak Password
        console.log("\nTest 3: Weak Password");
        const res3 = await testRegistration({ username: 'test@example.com', password: '123', fullName: 'Test User', phone: '0712345678' });
        console.log("Status:", res3.status, "Error:", res3.body.error);

        // Test 4: Invalid Phone
        console.log("\nTest 4: Invalid Phone");
        const res4 = await testRegistration({ username: 'test@example.com', password: 'Password@123', fullName: 'Test User', phone: '12345' });
        console.log("Status:", res4.status, "Error:", res4.body.error);

        // Test 5: Valid Details
        console.log("\nTest 5: Valid Details");
        const res5 = await testRegistration({ username: `test${Date.now()}@example.com`, password: 'StrongPassword@123', fullName: 'Real User', phone: '0712345678' });
        console.log("Status:", res5.status, "Success:", !!res5.body.token);

    } catch (e) {
        console.error("Test failed:", e.message);
    }
};

runTests();
