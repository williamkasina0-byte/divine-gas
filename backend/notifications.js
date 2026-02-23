// SMS Notification Service
// Supports multiple providers - configure your preferred one in environment variables

const ADMIN_PHONE = process.env.ADMIN_PHONE || '0795556620';

// Provider configurations
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'africastalking'; // Options: 'africastalking', 'mock'

// Africa's Talking Configuration
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY || '';
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';

class NotificationService {
    
    // Send SMS using Africa's Talking
    async sendSMSAfricaSTalking(phone, message) {
        try {
            const response = await fetch(`https://api.africastalking.com/version1/messaging`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${AFRICASTALKING_API_KEY}`
                },
                body: new URLSearchParams({
                    username: AFRICASTALKING_USERNAME,
                    to: phone,
                    message: message
                })
            });
            
            const data = await response.json();
            console.log('SMS Response:', data);
            return data;
        } catch (error) {
            console.error('Africa\'s Talking SMS Error:', error);
            throw error;
        }
    }

    // Send notification (provider-agnostic)
    async sendSMS(phone, message) {
        if (SMS_PROVIDER === 'africastalking' && AFRICASTALKING_API_KEY) {
            return await this.sendSMSAfricaSTalking(phone, message);
        }
        
        // Fallback: Log to console (for development/testing)
        console.log(`[SMS to ${phone}]: ${message}`);
        return { status: 'simulated', message: 'SMS logged to console' };
    }

    // Send order notification to admin
    async notifyAdminOfOrder(order) {
        const message = this.formatOrderMessage(order);
        return await this.sendSMS(ADMIN_PHONE, message);
    }

    // Format order message for admin
    formatOrderMessage(order) {
        const itemsList = order.items.map(item => 
            `${item.quantity}x ${item.brand} ${item.size} (${item.purchaseType})`
        ).join(', ');

        return `🔥 NEW ORDER #${order.id}
        
Customer: ${order.name}
Phone: ${order.phone}
Address: ${order.address}
Items: ${itemsList}
Total: KES ${order.total.toLocaleString()}
Payment: ${order.paymentMethod || 'Pending'}
        
Time: ${new Date(order.created_at || Date.now()).toLocaleString()}`;
    }

    // Send order confirmation to customer
    async notifyCustomerOfOrder(order) {
        const message = `Thank you for your order #${order.id}!
        
Total: KES ${order.total.toLocaleString()}
We will deliver to: ${order.address}
        
Track your order at divine-gas.vercel.app
Questions? Call 0795556620
        
- Divine Gas Team`;
        
        return await this.sendSMS(order.phone, message);
    }
}

module.exports = new NotificationService();
