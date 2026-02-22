
import localtunnel from 'localtunnel';

const port = 3000;
const subdomain = 'divine-gas-ruai-' + Math.floor(Math.random() * 10000);

async function startTunnel() {
    const tunnel = await localtunnel({
        port: port,
        subdomain: subdomain
    });

    console.log('-------------------------------------------');
    console.log('🌍 DIVINE GAS GLOBAL ACCESS ENABLED');
    console.log(`🔗 Public URL: ${tunnel.url}`);
    console.log('💡 Note: Ensure your local dev server (npm run dev) is running!');
    console.log('-------------------------------------------');

    tunnel.on('close', () => {
        console.log('Tunnel closed');
    });
}

startTunnel().catch(err => {
    console.error('Error starting tunnel:', err);
});
