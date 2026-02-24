/**
 * Notification Service for Divine Gas
 * Handles Server-Sent Events (SSE) for real-time admin notifications.
 */

// Store active SSE connections
const adminClients = new Set();

/**
 * Add a new admin client to the SSE connections
 */
function addAdminClient(req, res) {
    // Keep connection alive
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Flush headers to establish connection
    res.flushHeaders();

    // Add to our clients list
    adminClients.add(res);
    console.log(`🔌 Admin SSE connected. Total connected: ${adminClients.size}`);

    // Send initial connection success message (optional, but good for testing)
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Connection Established' })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
        adminClients.delete(res);
        console.log(`🔌 Admin SSE disconnected. Total connected: ${adminClients.size}`);
    });
}

// Heartbeat to keep connections alive through proxies (every 30 seconds)
setInterval(() => {
    const heartbeatMsg = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
    for (const client of adminClients) {
        try {
            client.write(heartbeatMsg);
        } catch (error) {
            adminClients.delete(client);
        }
    }
}, 30000);

/**
 * Send an event to all connected admin clients
 */
function broadcastToAdmins(eventType, payload) {
    const data = `data: ${JSON.stringify({ type: eventType, payload })}\n\n`;
    for (const client of adminClients) {
        try {
            client.write(data);
        } catch (error) {
            console.error("Failed to write to SSE client:", error);
            adminClients.delete(client); // Remove dead client
        }
    }
}

/**
 * Notify admin of a new order
 */
async function notifyAdminOfOrder(order) {
    console.log('🔔 New Order received! Broadcasting to admins...');
    broadcastToAdmins('new_order', order);
}

/**
 * Notify customer of order (stub)
 */
async function notifyCustomerOfOrder(order) {
    // Currently a stubborn to avoid missing function errors.
    // In the future this could be SMS/Email using a provider.
    console.log(`Customer notification skipped: No SMS provider configured for order ${order.id}`);
}

module.exports = {
    addAdminClient,
    notifyAdminOfOrder,
    notifyCustomerOfOrder
};
