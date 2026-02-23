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

app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullName, phone } = req.body;
    const db = await getDb();

    try {
        const existingUser = await executeGet(db,
            isPostgres ? 'SELECT * FROM users WHERE username = $1' : 'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
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
app.post('/api/orders', async (req, res) => {
    const order = req.body;
    const db = await getDb();

    try {
        const orderId = order.id || Math.random().toString(36).substr(2, 9);
        const userId = order.userId || null;

        await executeRun(db,
            isPostgres
                ? 'INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, order.name, order.phone, order.address, order.total, order.status, new Date().toISOString()]
        );

        for (const item of order.items) {
            await executeRun(db,
                isPostgres
                    ? 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, purchase_type) VALUES ($1, $2, $3, $4, $5)'
                    : 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, purchase_type) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.finalPrice, item.purchaseType]
            );
        }

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

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port} (Accessible on LAN)`);
});
