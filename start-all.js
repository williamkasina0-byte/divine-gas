import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_PORT = 3000;

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

function tryCloudflaredTunnel(port) {
    return new Promise((resolve) => {
        const proc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let found = false;

        function handleOutput(data) {
            const text = data.toString();
            const match = text.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/);
            if (match && !found) {
                found = true;
                console.log(`\x1b[32m🌍 GLOBAL ACCESS ENABLED (Cloudflare)\x1b[0m`);
                console.log(`\x1b[36m🔗 Public URL: ${match[0]}\x1b[0m`);
                console.log(`\x1b[32m✅ No password required — share this link with anyone!\x1b[0m`);
                resolve(true);
            }
        }

        proc.stdout.on('data', handleOutput);
        proc.stderr.on('data', handleOutput);

        // If cloudflared isn't installed/found, fall back to localtunnel
        proc.on('error', () => {
            if (!found) {
                console.log(`\x1b[33m⚠️  cloudflared not found. Using localtunnel instead...\x1b[0m`);
                resolve(false);
            }
        });

        // 15 second timeout — if cloudflared doesn't give us a URL, fall back
        setTimeout(() => {
            if (!found) {
                console.log(`\x1b[33m⚠️  cloudflared timed out. Using localtunnel...\x1b[0m`);
                proc.kill();
                resolve(false);
            }
        }, 15000);
    });
}

async function startLocaltunnel(port) {
    try {
        const { default: localtunnel } = await import('localtunnel');
        const subdomain = 'divine-gas-ruai-' + Math.floor(Math.random() * 10000);
        const tunnel = await localtunnel({ port, subdomain: `${subdomain}-web` });

        console.log(`\x1b[32m🌍 GLOBAL ACCESS ENABLED (localtunnel)\x1b[0m`);
        console.log(`\x1b[36m🔗 Public URL: ${tunnel.url}\x1b[0m`);

        // Fetch the correct tunnel password
        try {
            const res = await fetch('https://loca.lt/mytunnelpassword');
            const password = (await res.text()).trim();
            console.log(`\x1b[33m🔑 Tunnel Password: ${password}  (enter this on the bypass page)\x1b[0m`);
        } catch { }

        tunnel.on('error', () => { });
        tunnel.on('close', () => {
            console.log(`\x1b[33m🔄 Tunnel closed. Reconnecting in 5s...\x1b[0m`);
            setTimeout(() => startLocaltunnel(port), 5000);
        });
    } catch (err) {
        console.error('Tunnel error:', err.message);
    }
}

async function startTunnel(port) {
    console.log(`\x1b[2mAttempting Cloudflare tunnel...\x1b[0m`);
    const cloudflareWorked = await tryCloudflaredTunnel(port);
    if (!cloudflareWorked) {
        await startLocaltunnel(port);
    }
}

function runCommand(command, args, name, colorCode, cwd = process.cwd()) {
    const proc = spawn(command, args, {
        shell: true,
        stdio: 'inherit',
        cwd: cwd
    });

    console.log(`\x1b[${colorCode}m[${name}] Started\x1b[0m`);

    proc.on('error', (err) => {
        console.error(`\x1b[31m[${name}] Error: ${err.message}\x1b[0m`);
    });

    return proc;
}

async function main() {
    console.log('\x1b[1m\x1b[35m--- DIVINE GAS SYSTEM STARTUP ---\x1b[0m\n');

    const localIp = getLocalIp();
    console.log(`\x1b[33m🏠 LAN Access:   http://${localIp}:${FRONTEND_PORT}\x1b[0m`);
    console.log(`\x1b[33m💻 Local Access: http://localhost:${FRONTEND_PORT}\x1b[0m`);
    console.log(`\x1b[2mStarting services...\x1b[0m\n`);

    // Start Backend
    runCommand('npm', ['run', 'dev'], 'Backend', '34', path.join(__dirname, 'backend'));

    // Start Frontend
    runCommand('npm', ['run', 'dev'], 'Frontend', '36');

    // Wait for Vite to fully start (it takes ~13s) before opening the tunnel
    console.log(`\x1b[2mWaiting 16s for Vite to be ready before starting tunnel...\x1b[0m`);
    setTimeout(async () => {
        await startTunnel(FRONTEND_PORT);
        console.log('\n\x1b[1m\x1b[32m🚀 System is ready for cross-device access!\x1b[0m');
        console.log('\x1b[2mKeep this terminal open to maintain access.\x1b[0m\n');
    }, 16000);
}

main().catch(err => {
    console.error('Startup failed:', err);
});
