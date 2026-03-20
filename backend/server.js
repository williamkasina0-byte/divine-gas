const express = require('express');
const cors = require('cors');
const { getDb, initializeDatabase, logActivity } = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'divine-secret-key-change-this';

// Check if using PostgreSQL
const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize DB
initializeDatabase().catch(err => console.error("DB Init Failed:", err));

// Helper function to execute queries based on database type
async function executeQuery(db, sql, params = []) {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return result.rows;
    } else {
        // SQLite
        if (sql.trim().toLowerCase().startsWith('select')) {
            if (sql.includes('count(*)')) {
                return await db.get(sql, params);
            }
            return await db.all(sql, params);
        } else {
            return await db.run(sql, params);
        }
    }
}

async function executeGet(db, sql, params = []) {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return result.rows[0] || null;
    } else {
        return await db.get(sql, params);
    }
}

async function executeRun(db, sql, params = []) {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return { lastID: result.rows[0]?.id || 0, changes: result.rowCount };
    } else {
        return await db.run(sql, params);
    }
}

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTE ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await getDb();

    try {
        const user = await executeGet(db,
            isPostgres ? 'SELECT * FROM users WHERE username = $1' : 'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'customer' }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role || 'customer',
                fullName: user.full_name,
                phone: user.phone
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Login failed" });
    }
});

// Helper to check for disposable email addresses
function isDisposableEmail(email) {
    const disposableDomains = [
        'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'tempmail.com', 
        'dispostable.com', 'getnada.com', '10minutemail.com', 'sharklasers.com',
        'trashmail.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com',
        'burnermiler.com', 'mintemail.com', 'mailexpire.com', 'email.com',
        'asdf.com', 'test.com', 'example.com'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
}

function isRealEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(email)) return false;

    if (isDisposableEmail(email)) return false;

    const [localPart, domain] = email.split('@');
    
    // Check for repetitive chars in local part
    if (/(.)\1{4,}/.test(localPart)) return false;

    // Check for common typo domains
    const typos = ['gamil.com', 'gmial.com', 'yaho.com', 'hotmial.com', 'outlok.com'];
    if (typos.includes(domain.toLowerCase())) return false;

    return true;
}

// Helper to check for "fake" names or repetitive patterns
function isFakeName(name) {
    const lowerName = name.toLowerCase().trim();
    const fakeNames = ['test', 'guest', 'admin', 'user', 'asdf', 'qwerty', 'divine'];
    
    // Check for common fake names
    if (fakeNames.some(f => lowerName.includes(f))) return true;
    
    // Check for repetitive characters (e.g., "aaaaa")
    if (/(.)\1{4,}/.test(lowerName)) return true;
    
    // Check for at least two words (First and Last name)
    const words = lowerName.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) return true;

    return false;
}

// --- OTP ROUTE ---
app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    // Validate phone format briefly
    const phoneClean = phone.replace(/\s/g, '');
    const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
        return res.status(400).json({ error: "Invalid phone number format" });
    }

    const db = await getDb();
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    try {
        await executeRun(db,
            isPostgres 
                ? 'INSERT INTO otps (phone, code, expires_at, verified) VALUES ($1, $2, $3, $4) ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = $3, verified = $4'
                : 'INSERT OR REPLACE INTO otps (phone, code, expires_at, verified) VALUES (?, ?, ?, ?)',
            [phoneClean, code, expiresAt, isPostgres ? false : 0]
        );

        await notificationService.sendSmsOtp(phoneClean, code);
        res.json({ success: true, message: "Verification code sent" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "Phone and code are required" });

    const db = await getDb();
    const phoneClean = phone.replace(/\s/g, '');

    try {
        const otpEntry = await executeGet(db,
            isPostgres ? 'SELECT * FROM otps WHERE phone = $1' : 'SELECT * FROM otps WHERE phone = ?',
            [phoneClean]
        );

        if (!otpEntry || otpEntry.code !== code) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        if (new Date(otpEntry.expires_at) < new Date()) {
            return res.status(400).json({ error: "Verification code has expired" });
        }

        await executeRun(db,
            isPostgres ? 'UPDATE otps SET verified = true WHERE phone = $1' : 'UPDATE otps SET verified = 1 WHERE phone = ?',
            [phoneClean]
        );

        res.json({ success: true, message: "Phone verified successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Verification failed" });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullName, phone } = req.body;
    const db = await getDb();

    // 1. Advanced Registration Validation (Real Data Recognition)
    
    // Email Validation
    if (!username || !isRealEmail(username)) {
        return res.status(400).json({ error: "Please provide a valid, professional email address" });
    }

    // Name Validation
    if (!fullName || isFakeName(fullName)) {
        return res.status(400).json({ 
            error: "Please provide your real First and Last Name (letters only, no fake names)" 
        });
    }

    // Phone Validation (Kenyan Carrier Prefixes)
    const phoneClean = phone.replace(/\s/g, '');
    const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
    if (!phoneClean || !phoneRegex.test(phoneClean)) {
        return res.status(400).json({ error: "Please provide a valid Kenyan phone number (e.g., 0712345678)" });
    }

    // Strict Prefix Check
    const localPhone = phoneClean.slice(-9); // Get last 9 digits (e.g., 712345678)
    const prefix = localPhone.slice(0, 2); // e.g., 71
    const validPrefixes = [
        '70', '71', '72', '74', '75', '76', '79', '11', // Safaricom
        '73', '78', '10',                               // Airtel
        '77'                                            // Telkom
    ];
    if (!validPrefixes.includes(prefix)) {
        return res.status(400).json({ error: "The phone number must belong to a recognized Kenyan carrier (Safaricom, Airtel, or Telkom)" });
    }

    // 1.5 Verify Phone OTP
    const otpEntry = await executeGet(db,
        isPostgres ? 'SELECT * FROM otps WHERE phone = $1 AND verified = true' : 'SELECT * FROM otps WHERE phone = ? AND verified = 1',
        [phoneClean]
    );

    if (!otpEntry) {
        return res.status(400).json({ error: "Please verify your phone number first via SMS code." });
    }
    
    // Check if verification is still fresh (e.g., within 1 hour)
    const verificationTime = new Date(otpEntry.expires_at).getTime() + (50 * 60 * 1000); // Adding 50 mins buffer to 10 min expiry = 1 hour window
    if (Date.now() > verificationTime) {
        return res.status(400).json({ error: "Phone verification expired. Please request a new code." });
    }

    // 2. Validate strong password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: "Password is too weak. It must be at least 8 characters long, include uppercase, lowercase, a digit, and a special character." 
        });
    }

    try {
        const existingUser = await executeGet(db,
            isPostgres ? 'SELECT * FROM users WHERE username = $1' : 'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existingUser) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await executeRun(db,
            isPostgres
                ? 'INSERT INTO users (username, password_hash, role, full_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id'
                : 'INSERT INTO users (username, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, hash, 'customer', fullName, phone]
        );

        const userId = isPostgres ? result[0]?.id : result.lastID;
        const token = jwt.sign({ id: userId, username, role: 'customer' }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: userId,
                username,
                role: 'customer',
                fullName,
                phone
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Registration failed" });
    }
});

// --- PRODUCTS ROUTES ---
app.get('/api/products', async (req, res) => {
    const db = await getDb();
    try {
        const products = await executeQuery(db, 'SELECT * FROM products');
        res.json(products);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    const { id, brand, size, price, deposit, image } = req.body;
    const db = await getDb();

    try {
        await executeRun(db,
            isPostgres
                ? 'INSERT INTO products (id, brand, size, price, deposit, image) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET brand = $2, size = $3, price = $4, deposit = $5, image = $6'
                : 'INSERT OR REPLACE INTO products (id, brand, size, price, deposit, image) VALUES (?, ?, ?, ?, ?, ?)',
            [id, brand, size, price, deposit, image]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to save product" });
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const db = await getDb();
    try {
        await executeRun(db,
            isPostgres ? 'DELETE FROM products WHERE id = $1' : 'DELETE FROM products WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

// --- ORDERS ROUTES ---
// Import notification service
const notificationService = require('./notifications');

app.post('/api/orders', async (req, res) => {
    const order = req.body;
    const db = await getDb();

    try {
        const orderId = order.id || Math.random().toString(36).substr(2, 9);
        const userId = order.userId || null;

        // Handle both field name formats (customer_name or name)
        const customerName = order.customer_name || order.name || 'Guest';
        const phone = order.phone || '';
        const address = order.address || '';
        const createdAt = new Date().toISOString();

        await executeRun(db,
            isPostgres
                ? 'INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, customerName, phone, address, order.total, order.status || 'PENDING', createdAt]
        );

        // Store items with product details for notification
        const orderItems = [];
        for (const item of order.items) {
            await executeRun(db,
                isPostgres
                    ? 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, purchase_type) VALUES ($1, $2, $3, $4, $5)'
                    : 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, purchase_type) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.finalPrice, item.purchaseType]
            );

            // Get product details for notification
            const product = await executeGet(db,
                isPostgres ? 'SELECT * FROM products WHERE id = $1' : 'SELECT * FROM products WHERE id = ?',
                [item.id]
            );
            orderItems.push({
                ...item,
                brand: product?.brand || 'Unknown',
                size: product?.size || 'Unknown'
            });
        }

        // Send notifications (non-blocking)
        const orderWithDetails = {
            id: orderId,
            name: customerName,
            phone: phone,
            address: address,
            total: order.total,
            items: orderItems,
            paymentMethod: order.paymentMethod,
            created_at: createdAt
        };

        // Notify admin
        notificationService.notifyAdminOfOrder(orderWithDetails).catch(err =>
            console.error('Failed to notify admin:', err)
        );

        // Notify customer
        notificationService.notifyCustomerOfOrder(orderWithDetails).catch(err =>
            console.error('Failed to notify customer:', err)
        );

        res.json({ success: true, orderId: orderId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create order" });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role === 'admin') {
        try {
            const orders = await executeQuery(db, 'SELECT * FROM orders ORDER BY created_at DESC');
            for (const order of orders) {
                order.items = await executeQuery(db,
                    isPostgres ? 'SELECT * FROM order_items WHERE order_id = $1' : 'SELECT * FROM order_items WHERE order_id = ?',
                    [order.id]
                );
            }
            res.json(orders);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Failed to fetch all orders" });
        }
    } else {
        res.status(403).json({ error: "Access denied" });
    }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDb();

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin rights required" });
    }

    try {
        await executeRun(db,
            isPostgres ? 'UPDATE orders SET status = $1 WHERE id = $2' : 'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update status" });
    }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
    const db = await getDb();
    const userId = req.user.id;
    try {
        const orders = await executeQuery(db,
            isPostgres ? 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC' : 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        for (const order of orders) {
            order.items = await executeQuery(db,
                isPostgres ? 'SELECT * FROM order_items WHERE order_id = $1' : 'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );
        }

        res.json(orders);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch user orders" });
    }
});

// --- ADMIN MANAGEMENT ROUTES ---

app.get('/api/admin/notifications/stream', (req, res, next) => {
    // Custom authentication for SSE since passing Bearer header is hard in browser EventSource
    const token = req.query.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'admin') {
            console.error("SSE Auth Rejected.", "Error:", err, "User:", user);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}, (req, res) => {
    notificationService.addAdminClient(req, res);
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        let usersCount, ordersCount, revenue, productsCount;

        if (isPostgres) {
            usersCount = await executeGet(db, 'SELECT COUNT(*) as count FROM users');
            ordersCount = await executeGet(db, 'SELECT COUNT(*) as count FROM orders');
            revenue = await executeGet(db, 'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != $1', ['CANCELLED']);
            productsCount = await executeGet(db, 'SELECT COUNT(*) as count FROM products');
        } else {
            usersCount = await executeGet(db, 'SELECT count(*) as count FROM users');
            ordersCount = await executeGet(db, 'SELECT count(*) as count FROM orders');
            revenue = await executeGet(db, 'SELECT sum(total_amount) as total FROM orders WHERE status != ?', ['CANCELLED']);
            productsCount = await executeGet(db, 'SELECT count(*) as count FROM products');
        }

        res.json({
            users: parseInt(usersCount?.count || 0),
            orders: parseInt(ordersCount?.count || 0),
            revenue: parseInt(revenue?.total || 0),
            products: parseInt(productsCount?.count || 0)
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        const users = await executeQuery(db,
            isPostgres
                ? 'SELECT id, username, role, full_name, phone, created_at FROM users ORDER BY created_at DESC'
                : 'SELECT id, username, role, full_name, phone, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.patch('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        await executeRun(db,
            isPostgres ? 'UPDATE users SET role = $1 WHERE id = $2' : 'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to update role" });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        await executeRun(db,
            isPostgres ? 'DELETE FROM users WHERE id = $1' : 'DELETE FROM users WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.get('/api/settings', async (req, res) => {
    const db = await getDb();
    try {
        const settings = await executeQuery(db, 'SELECT * FROM settings');
        const result = {};
        settings.forEach(s => result[s.key] = s.value);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
    const settings = req.body;
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        for (const [key, value] of Object.entries(settings)) {
            await executeRun(db,
                isPostgres
                    ? 'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2'
                    : 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                [key, value]
            );
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to update settings" });
    }
});

// --- USER ACTIVITY ROUTES ---
app.get('/api/admin/activity', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        const activities = await executeQuery(db,
            isPostgres
                ? 'SELECT * FROM user_activity ORDER BY created_at DESC LIMIT 100'
                : 'SELECT * FROM user_activity ORDER BY created_at DESC LIMIT 100'
        );
        res.json(activities);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch activity" });
    }
});

app.post('/api/activity/log', async (req, res) => {
    const { userId, username, action, details } = req.body;
    try {
        await logActivity(userId, username, action, details, req.ip, req.headers['user-agent']);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to log activity" });
    }
});

// --- PAYMENTS ROUTE ---
const mpesaService = require('./mpesa');

app.post('/api/pay/mpesa', async (req, res) => {
    const { phone, amount, orderId } = req.body;
    try {
        const response = await mpesaService.initiateSTKPush(phone, amount, orderId);
        res.json(response);
    } catch (error) {
        console.error("Payment Error:", error);
        res.json({ ResponseCode: "0", CustomerMessage: "Simulated Request (Check Console)" });
    }
});

// System Instruction for AI Chat
const SYSTEM_INSTRUCTION = `
You are 'Divine', the AI Assistant for Divine Gas, a premium cooking gas delivery service in Ruai, Kenya.
Your ABSOLUTE PRIORITY is to communicate our unique value proposition:
- OPERATING HOURS: We are open Monday to Sunday, from 8am to 10pm.
- FREE DELIVERY for all orders.
- 15-MINUTE GUARANTEE: If we are not there in 15 minutes, delivery is still free but we apologize profusely.

Your goal is to help customers with:
1. Choosing the right gas brand (K-Gas, Total, Rubis, Pro-Gas, etc.).
2. Explaining safety tips (keeping cylinders upright, checking for leaks with soapy water).
3. Informing about the 15-minute FREE delivery guarantee in Ruai and Utawala.
4. Answering questions about pricing:
   - 6kg Refill: KES 1,100 (Free Delivery)
   - 6kg New Cylinder (with gas): KES 4,500 (Free Delivery)
   - 13kg Refill: KES 2,500 (Free Delivery)
   - 13kg New Cylinder (with gas): KES 8,500 (Free Delivery)

Keep your tone friendly, efficient, and locally relevant to Ruai/Kenya. Use occasional Kenyan English (Sheng) like 'Karibu' or 'Asante' if it feels natural.
If users ask about delivery outside Ruai, politely mention we currently specialize in 15-minute ultra-fast FREE delivery specifically in Ruai and Utawala environs.
`;

// Simple keyword-based response logic
function getSimpleResponse(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
        if (lowerMsg.includes('6kg')) return "A 6kg refill is KES 1,100, and a new cylinder with gas is KES 4,500. Delivery is completely FREE!";
        if (lowerMsg.includes('13kg')) return "A 13kg refill is KES 2,500, and a new cylinder with gas is KES 8,500. We deliver for FREE!";
        return "Our prices are:\n- 6kg Refill: KES 1,100\n- 6kg New: KES 4,500\n- 13kg Refill: KES 2,500\n- 13kg New: KES 8,500.\nAll with FREE delivery!";
    }

    if (lowerMsg.includes('delivery') || lowerMsg.includes('deliver') || lowerMsg.includes('location') || lowerMsg.includes('where')) {
        return "We offer FREE delivery within 15 minutes to Ruai, Utawala, and environs! We are open every day from 8am to 10pm. Karibu!";
    }

    if (lowerMsg.includes('safety') || lowerMsg.includes('safe') || lowerMsg.includes('leak')) {
        return "Safety first! Keep your cylinder upright and in a ventilated area. Use soapy water to check for leaks (bubbles indicate a leak). Never use a flame to check for leaks!";
    }

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('jambo')) {
        return "Jambo! Welcome to Divine Gas. I'm Divine, your assistant. How can I help you get cooking today?";
    }

    if (lowerMsg.includes('thank') || lowerMsg.includes('asante')) {
        return "Karibu sana! We are happy to serve you.";
    }

    return "Thanks for reaching out! To place an order or for urgent inquiries, please call us directly at 0795556620, or ask me about our prices and delivery areas.";
}

app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        setTimeout(() => {
            const response = getSimpleResponse(message);
            res.json({ text: response });
        }, 500);

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/generate-image', (req, res) => {
    res.json({ image: null });
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual seed endpoint - call this to seed the database
app.post('/api/admin/seed', async (req, res) => {
    const db = await getDb();
    try {
        // Seed Admin User
        const adminExists = await executeGet(db,
            isPostgres ? 'SELECT * FROM users WHERE username = $1' : 'SELECT * FROM users WHERE username = ?',
            ['admin']
        );
        if (!adminExists) {
            const hash = await bcrypt.hash('admin123', 10);
            await executeRun(db,
                isPostgres
                    ? 'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id'
                    : 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ['admin', hash, 'admin']
            );
            console.log("Admin user created");
        }

        // Seed Initial Products
        const productsCount = await executeGet(db,
            isPostgres ? 'SELECT COUNT(*) as count FROM products' : 'SELECT count(*) as count FROM products'
        );
        if (parseInt(productsCount?.count || 0) < 16) {
            const initialProducts = [
                { id: '1', brand: 'Pro-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=400' },
                { id: '2', brand: 'Pro-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=401' },
                { id: '3', brand: 'K-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=402' },
                { id: '4', brand: 'K-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=403' },
                { id: '5', brand: 'Total', size: '6kg', price: 1200, deposit: 3500, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=404' },
                { id: '6', brand: 'Total', size: '13kg', price: 2600, deposit: 6100, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=405' },
                { id: '7', brand: 'Rubis', size: '6kg', price: 1150, deposit: 3450, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=406' },
                { id: '8', brand: 'Rubis', size: '13kg', price: 2550, deposit: 6050, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=407' },
                { id: '9', brand: 'Shell', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=408' },
                { id: '10', brand: 'Shell', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=409' },
                { id: '11', brand: 'Gas', size: '6kg', price: 1050, deposit: 3300, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=410' },
                { id: '12', brand: 'Gas', size: '13kg', price: 2400, deposit: 5900, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=411' },
                { id: '13', brand: 'Flexi-Gas', size: '6kg', price: 1000, deposit: 3200, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=412' },
                { id: '14', brand: 'Flexi-Gas', size: '13kg', price: 2300, deposit: 5800, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=413' },
                { id: '15', brand: 'King Gas', size: '6kg', price: 1080, deposit: 3350, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=414' },
                { id: '16', brand: 'King Gas', size: '13kg', price: 2450, deposit: 5950, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=415' }
            ];

            for (const p of initialProducts) {
                await executeRun(db,
                    isPostgres
                        ? 'INSERT INTO products (id, brand, size, price, deposit, image) VALUES ($1, $2, $3, $4, $5, $6)'
                        : 'INSERT INTO products (id, brand, size, price, deposit, image) VALUES (?, ?, ?, ?, ?, ?)',
                    [p.id, p.brand, p.size, p.price, p.deposit, p.image]
                );
            }
            console.log("Products seeded");
        }

        // Seed Settings
        const settingsCount = await executeGet(db,
            isPostgres ? 'SELECT COUNT(*) as count FROM settings' : 'SELECT count(*) as count FROM settings'
        );
        if (parseInt(settingsCount?.count || 0) === 0) {
            const defaultSettings = [
                { key: 'site_name', value: 'DIVINE GAS' },
                { key: 'phone', value: '0795556620' },
                { key: 'whatsapp', value: '254795556620' },
                { key: 'operating_hours', value: 'Open Mon-Sun: 8am - 10pm' },
                { key: 'delivery_guarantee', value: 'Free 15-Min Delivery' }
            ];
            for (const s of defaultSettings) {
                await executeRun(db,
                    isPostgres
                        ? 'INSERT INTO settings (key, value) VALUES ($1, $2)'
                        : 'INSERT INTO settings (key, value) VALUES (?, ?)',
                    [s.key, s.value]
                );
            }
            console.log("Settings seeded");
        }

        res.json({ success: true, message: "Database seeded successfully" });
    } catch (e) {
        console.error("Seed error:", e);
        res.status(500).json({ error: "Failed to seed database: " + e.message });
    }
});

// Import products from JSON file - admin endpoint
app.post('/api/admin/import-products', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Invalid products format. Expected array of products." });
        }

        let importedCount = 0;
        for (const p of products) {
            if (p.id && p.brand && p.size && p.price !== undefined && p.deposit !== undefined) {
                await executeRun(db,
                    isPostgres
                        ? 'INSERT INTO products (id, brand, size, price, deposit, image) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET brand = $2, size = $3, price = $4, deposit = $5, image = $6'
                        : 'INSERT OR REPLACE INTO products (id, brand, size, price, deposit, image) VALUES (?, ?, ?, ?, ?, ?)',
                    [p.id, p.brand, p.size, p.price, p.deposit, p.image || '']
                );
                importedCount++;
            }
        }

        res.json({ success: true, message: `Successfully imported ${importedCount} products` });
    } catch (e) {
        console.error("Import error:", e);
        res.status(500).json({ error: "Failed to import products: " + e.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port} (Accessible on LAN)`);
});
