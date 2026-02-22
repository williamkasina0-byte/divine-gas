const API_URL = '/api';

export async function login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
}

export async function register(username: string, password: string, fullName: string, phone: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName, phone }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
}

export async function fetchProducts() {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
}

export async function saveProduct(product: any, token: string) {
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save product');
    }
    return response.json();
}

export async function deleteProduct(id: string, token: string) {
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
}

export async function placeOrder(order: any) {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
}

export const fetchMyOrders = async (token: string) => {
    const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
};

export const fetchAllOrders = async (token: string) => {
    const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch all orders");
    return response.json();
};

export const updateOrderStatus = async (token: string, orderId: string, status: string) => {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Failed to update order status");
    return response.json();
};

export const fetchAdminStats = async (token: string) => {
    const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch admin stats");
    return response.json();
};

export const fetchAdminUsers = async (token: string) => {
    const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
};

export const updateUserRole = async (token: string, userId: number, role: string) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error("Failed to update user role");
    return response.json();
};

export const deleteUser = async (token: string, userId: number) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to delete user");
    return response.json();
};

export const fetchSettings = async () => {
    const response = await fetch(`${API_URL}/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
};

export const updateSettings = async (token: string, settings: any) => {
    const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
};

export async function payWithMpesa(phone: string, amount: number, orderId: string) {
    const response = await fetch(`${API_URL}/pay/mpesa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, orderId }),
    });
    if (!response.ok) throw new Error('Payment request failed');
    return response.json();
}

export async function getChatResponse(userMessage: string) {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.text || "I'm having a little trouble connecting. Please call us directly for immediate assistance!";
    } catch (error) {
        console.error("API Error:", error);
        return "Pole! I'm currently offline. But don't worry, your gas delivery is our priority. Feel free to place your order!";
    }
}

export async function generateGasImage(brand: string, size: string) {
    try {
        const response = await fetch(`${API_URL}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ brand, size }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return data.image; // May be null if backend doesn't support it

    } catch (error) {
        console.error("Image Generation Error:", error);
        return null;
    }
}
