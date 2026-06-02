# Run POS Mobile on a real phone

## Why dashboard / login fails on a physical device

| Address | Works on emulator? | Works on real phone? |
|---------|-------------------|----------------------|
| `127.0.0.1` | Yes (iOS sim) | **No** — that's the phone itself |
| `10.0.2.2` | Yes (Android emu) | **No** — emulator only |
| `192.168.x.x` (PC Wi‑Fi IP) | Yes | **Yes** |

## Steps

### 1. Find your PC IP

```powershell
ipconfig
```

Use **IPv4 Address** on your Wi‑Fi adapter (example: `192.168.8.100`).

### 2. Set it in the app

Edit `src/config/env.ts` — **IP only, port separate**:

```typescript
export const DEV_MACHINE_IP = '192.168.8.100'; // your Wi‑Fi IP
export const DEV_API_PORT = 8000;              // do NOT put :8000 in the IP
```

Correct URL: `http://192.168.8.100:8000/api`  
Wrong: `http://192.168.8.100.8000/api`

### 3. Start Laravel for network access

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

`php artisan serve` alone only listens on `127.0.0.1` — phones cannot connect.

### 4. Firewall

Allow **port 8000** when Windows Firewall asks.

### 5. Same Wi‑Fi

Phone and PC must be on the **same network** (not mobile data).

### 6. Reload the app

```bash
npm start -- --reset-cache
npm run android
```

Login screen (dev mode) shows: `API: http://192.168.x.x:8000/api`

## Test from phone browser

Open: `http://YOUR_PC_IP:8000/api/auth/login`  
You should not get "connection refused". (405/404 is OK — means server is reachable.)
