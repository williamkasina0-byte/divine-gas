const express = require('express');
const cors = require('cors');
const { getDb, initializeDatabase } = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'divine-secret-key-change-this';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize DB
initializeDatabase().catch(err => console.error("DB Init Failed:", err));

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
        const user = await db.get('SELECT * FROM users WHERE username = ?', username);
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
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (username, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            username, hash, 'customer', fullName, phone
        );

        const userId = result.lastID;
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
    const products = await db.all('SELECT * FROM products');
    res.json(products);
});

app.post('/api/products', authenticateToken, async (req, res) => {
    const { id, brand, size, price, deposit, image } = req.body;
    const db = await getDb();

    try {
        await db.run(
            'INSERT OR REPLACE INTO products (id, brand, size, price, deposit, image) VALUES (?, ?, ?, ?, ?, ?)',
            id, brand, size, price, deposit, image
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
        await db.run('DELETE FROM products WHERE id = ?', id);
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
        // Generate ID if not present
        const orderId = order.id || Math.random().toString(36).substr(2, 9);
        // Link to user if userId is provided
        const userId = order.userId || null;

        await db.run(
            'INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            orderId, userId, order.name, order.phone, order.address, order.total, order.status, new Date().toISOString()
        );

        for (const item of order.items) {
            await db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, purchase_type) VALUES (?, ?, ?, ?, ?)',
                orderId, item.id, item.quantity, item.finalPrice, item.purchaseType
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
    // Admin sees all orders
    if (req.user.role === 'admin') {
        try {
            const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
            for (const order of orders) {
                order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
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
        await db.run('UPDATE orders SET status = ? WHERE id = ?', status, id);
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
        const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', userId);

        // Enhance with items if needed, but for list view usually single query or separate calls.
        // Let's just return the orders for now. 
        // If items are needed, the frontend might need to fetch them or we join.
        // The Order types usually include items. Accessing items might need a join.
        // The original GET /api/orders didn't return items either!
        // Wait, the original code: 
        //     const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
        // It returns just the order rows.

        // Let's fetch items for these orders to be helpful
        for (const order of orders) {
            order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
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
        const usersCount = await db.get('SELECT count(*) as count FROM users');
        const ordersCount = await db.get('SELECT count(*) as count FROM orders');
        const revenue = await db.get('SELECT sum(total_amount) as total FROM orders WHERE status != "CANCELLED"');
        const productsCount = await db.get('SELECT count(*) as count FROM products');

        res.json({
            users: usersCount.count,
            orders: ordersCount.count,
            revenue: revenue.total || 0,
            products: productsCount.count
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        const users = await db.all('SELECT id, username, role, full_name, phone, created_at FROM users ORDER BY created_at DESC');
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
        await db.run('UPDATE users SET role = ? WHERE id = ?', role, id);
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
        await db.run('DELETE FROM users WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.get('/api/settings', async (req, res) => {
    const db = await getDb();
    try {
        const settings = await db.all('SELECT * FROM settings');
        const result = {};
        settings.forEach(s => result[s.key] = s.value);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }
    const db = await getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to update settings" });
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
        // Fallback for demo if keys are missing
        res.json({ ResponseCode: "0", CustomerMessage: "Simulated Request (Check Console)" });
    }
});


// System Instruction derived from original geminiService.ts
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

// Simple keyword-based response logic to simulate AI without external dependency
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

        // Simulate AI delay
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
    // Return null or a placeholder since we aren't using real AI generation
    // Ideally this would return a static image based on brand/size if we had them
    res.json({ image: null });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port} (Accessible on LAN)`);
});
