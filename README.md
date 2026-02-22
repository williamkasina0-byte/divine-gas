      <div align="center">
<img width="1200" height="475" alt="Divine Gas - Premium Cooking Gas Delivery" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Divine Gas - Premium Cooking Gas Delivery

Divine Gas is a premium cooking gas delivery service in Ruai, Kenya. We offer fast, safe, and reliable gas delivery with a 15-minute guarantee.

## Features

- 🛒 Browse and order cooking gas (6kg and 13kg cylinders)
- 💬 AI-powered chat support for product inquiries
- 📍 Delivery coverage in Ruai and Utawala areas
- 📱 Order tracking in real-time
- 📱 WhatsApp ordering support

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start (Cross-Network Access)

To start the entire system (Frontend, Backend, and Global Tunnel) with one command and enable access from different networks and devices:

```bash
npm run start:all
```

This will:
- Start the **Backend** on port 3002.
- Start the **Frontend** on port 3000.
- Print your **Local IP** for access on the same Wi-Fi.
- Generate a **Public URL** (via localtunnel) for access from anywhere.

## Manual Setup

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Start the backend: `npm run dev` (Runs on http://localhost:3002)

### Frontend Setup
1. From the root directory, install dependencies: `npm install`
2. Start the frontend: `npm run dev` (Runs on http://localhost:3000)

## Accessing the System

| Access Type | URL Format | Use Case |
|-------------|------------|----------|
| **Local** | `http://localhost:3000` | Same machine |
| **LAN (Wi-Fi)** | `http://<your-local-ip>:3000` | Different device on same Wi-Fi |
| **Global** | `https://divine-gas-ruai-XXXX.loca.lt` | Anywhere in the world |

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
```

## API Endpoints

### Chat API
- `POST /api/chat` - Get AI response for customer inquiries

### Orders API
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order by ID

### Products API
- `GET /api/products` - Get all products

## License

© 2026 Divine Express Limited. All Rights Reserved.
