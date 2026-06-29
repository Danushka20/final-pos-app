# POS Mobile

A React Native mobile client for a cloud-connected Point of Sale (POS) system. Connect to your POS backend, run sales on the shop floor, manage inventory, record purchases, print receipts over Bluetooth, and view reports — all from an Android device.

**App name:** POS Mobile  
**Package:** `com.posmobile`  
**Platform:** Android (primary), iOS supported via React Native

---

## Table of Contents

1. [How the App Works](#how-the-app-works)
2. [First-Time Setup](#first-time-setup)
3. [App Navigation](#app-navigation)
4. [User Guide](#user-guide)
   - [Home / Dashboard](#home--dashboard)
   - [Sales (POS)](#sales-pos)
   - [Products & Inventory](#products--inventory)
   - [Purchases](#purchases)
   - [Reports](#reports)
   - [Customers & Expenses](#customers--expenses)
   - [Settings & Printer](#settings--printer)
5. [Features Summary](#features-summary)
6. [Developer Setup](#developer-setup)
7. [Building an APK](#building-an-apk)
8. [Troubleshooting](#troubleshooting)

---

## How the App Works

POS Mobile is **not a standalone app**. It connects to your existing POS server (same backend used by desktop/web POS) over the internet or local network.

```
┌─────────────┐       HTTPS / HTTP        ┌──────────────────┐
│  POS Mobile │  ◄──────────────────────►  │   POS Backend    │
│  (Android)  │      REST API + Auth      │  (Laravel API)   │
└─────────────┘                           └──────────────────┘
       │
       │ Bluetooth
       ▼
┌─────────────┐
│  Thermal    │
│  Printer    │
└─────────────┘
```

**What happens when you use the app:**

1. You enter your **server URL** once (Settings or login screen).
2. You **log in** with your POS user email and password.
3. The app loads **products, customers, settings, and stock** from the server.
4. Every sale, purchase, adjustment, or expense you save is sent to the server and updates live inventory.
5. Receipts can be **printed** via a paired Bluetooth thermal printer or **shared** as an image.

Data syncs in real time while you work. If the network drops, actions may fail until connection is restored.

---

## First-Time Setup

Follow these steps when installing the app for the first time on a shop device.

### Step 1 — Install the APK

Install `app-release.apk` on the Android phone/tablet. Allow **Install from unknown sources** if prompted.

### Step 2 — Connect to your server

1. Open the app.
2. On the welcome screen, tap **Get started** → go to login.
3. Tap **Server / API** (or after login: **Profile tab → Settings → Server / API**).
4. Enter your POS server address, for example:
   - Production: `https://yourshop.com`
   - Local network: `http://192.168.1.100:8000`
5. Tap **Test & Save**. Wait for “Connection successful”.
6. Go back and log in with your POS user **email** and **password**.

### Step 3 — Set up receipt printer (optional but recommended)

1. Pair your Bluetooth thermal printer in **Android Settings → Bluetooth** first.
2. In the app: **Profile → Settings → Receipt printer**.
3. Choose connection type (Bluetooth / Network), scan or enter printer address, and run a test print.

### Step 4 — Check company settings

Go to **Profile → Settings → Company** and confirm shop name, currency, and tax settings loaded correctly from the server.

You are ready to sell.

---

## App Navigation

The app uses a **bottom tab bar** with five main sections:

| Tab | Purpose |
|-----|---------|
| **Home** | Dashboard, quick actions, alerts, today’s activity |
| **Sales** | POS checkout — add items, pay, hold, returns |
| **Products** | Inventory list, stock management, purchases |
| **Reports** | Business reports — sales, stock, finance, expiry |
| **Profile** | Settings, user profile, server config, sign out |

The tab bar hides automatically when you open inner screens (order screen, item form, report view, etc.). Use the **back arrow** or swipe back to return.

---

## User Guide

### Home / Dashboard

The **Home** tab shows your business at a glance.

**What you see:**
- Today’s revenue and monthly revenue
- Order count, product count, low-stock count
- Sales chart and recent transactions
- Alert badge (expiry, cheques, etc.)

**Quick actions** (tap to jump directly):

| Action | Goes to |
|--------|---------|
| New Sale | Sales tab (POS) |
| Inventory | Products tab |
| Expenses / Add Expense | Expense list or form |
| Customers / Add Customer | Customer list or form |
| Purchases | Purchase list |
| Reports | Reports tab |

**Other Home screens:**
- **Today’s activity** — detailed list of today’s sales, purchases, expenses
- **Alerts** — expiry warnings, cheque due dates, and system alerts
- **Customers** — browse and manage customer records
- **Expenses** — record and view shop expenses

Pull down to **refresh** dashboard data.

---

### Sales (POS)

The **Sales** tab is the main checkout screen.

#### Normal sale — step by step

1. Open **Sales** tab.
2. Make sure mode is **Sale** (not Return) — toggle at the top if needed.
3. **Browse products** by category or use **search**.
4. **Tap a product** to add it to the cart (qty +1 each tap).
5. If the product has **batches** (expiry stock), tap the **layers icon** on the product to choose:
   - **Unbatched stock**, or
   - A specific **batch** (nearest expiry shown first — FEFO)
6. Tap the **floating cart button** at the bottom to open the **Order** screen.
7. On the order screen:
   - Change **quantity** by typing in the qty field or using +/−
   - Select **customer** (default: Walk-in Customer)
   - Apply **discount** (% or fixed amount) if needed — offers may auto-apply
   - Choose **payment method** (Cash, Card, Cheque, Credit, Bank Transfer, Online)
   - Enter payment details (amount received, cheque no., bank, reference, etc.)
8. Tap **Complete sale** (or **Save & Pay**).
9. Receipt screen opens — **Print**, **Share**, or start a **new sale**.

#### Batch sales (products with expiry)

- Products with batch stock show a **batch badge** on the product tile.
- Tap the **layers button** to open the batch picker.
- Select qty from **unbatched** and/or **batch rows**, then **Add**.
- Each batch line appears separately in the cart.
- Offers and returns respect the batch line.

#### Hold orders

Use hold when a customer is not ready to pay yet.

1. Build the cart and open the **Order** screen.
2. Tap **Hold order** instead of completing payment.
3. Set a **hold PIN** (first time) or enter your saved PIN.
4. The order is saved on the server.
5. To resume: tap **Hold** button on the Sales header → select the held order → enter PIN → complete payment.

#### Return sales

1. On the Sales screen, switch to **Return** mode.
2. Choose one of:
   - **Select a sale bill** — pick the original invoice and return items from it, or
   - **Return without bill** — manual return (if allowed)
3. Add return items to cart (respects max return qty per line/batch).
4. Open order screen, choose refund payment method, and complete.

Stock is restored to the correct batch when returning batch items.

#### Payment methods

| Method | What to enter |
|--------|---------------|
| Cash | Amount received (change calculated) |
| Card | Card last 4 digits (optional) |
| Cheque | Cheque number + bank account |
| Credit | Customer account (customer required) |
| Bank Transfer | Transfer reference |
| Online | Transaction / approval ID |

---

### Products & Inventory

The **Products** tab lists all inventory items for the selected branch.

#### Browse & filter

- **Branch / Area** — filter stock by location
- **Product type** — filter by item type
- **Category** — filter by category
- **Search** — find by name, ID, or SKU
- Tap any item row to **edit** it

#### Inventory activity menu

Tap the **sliders icon** (top right) on the Products screen to open **Inventory activity**:

| Action | What it does |
|--------|--------------|
| **Add item** | Create a new product |
| **Modify item** | Pick an item and edit details |
| **Stock & batches** | View/manage batches, expiry, branch qty |
| **Stock adjustment** | Increase or decrease on-hand qty |
| **TOG transfer** | Move stock between locations |
| **Item activity** | View stock movement history for an item |
| **Add location** | Create a new branch/storage location |

#### Item form (add / edit product)

- Set description, prices (selling / purchase), UOM, category, SKU
- Upload product image (camera or gallery)
- Configure batch / expiry settings
- Link to **batches screen** for batch-level stock

#### Batch management

From **Stock & batches** or the item form:

- See **total / unbatched / batch** stock breakdown
- View batches per branch with expiry dates
- **Add batch** — set qty and expiry
- **Edit / delete** batch entries

---

### Purchases

Record stock received from suppliers.

#### Create a purchase — step by step

1. **Products tab** → tap **truck icon** (top right) → **Purchases list**.
2. Tap **New purchase** (or use Dashboard quick action **Purchases**).
3. Select products (same grid as sales) — tap to add to purchase cart.
4. Tap the **cart button** → **Purchase order** screen.
5. For each line item set:
   - **Purchase price** — type the buying price (different price creates a new batch automatically)
   - **Expiry date** — tap to open calendar picker (optional; used for batch expiry)
   - **Qty** — type quantity or use +/−
6. Select **stock location** (branch receiving the goods).
7. Select **supplier** (Walk-in Supplier or choose from list).
8. Choose **payment method** and enter payment details.
9. Tap **Save & Pay**.
10. Purchase receipt opens — print or share.

**Batch rules on purchase:**
- Same **price + expiry** → merges into one batch
- Different **purchase price** → always creates a new batch
- No expiry → batch by price only

---

### Reports

The **Reports** tab lists all system reports grouped by category.

#### Report categories

| Section | Reports |
|---------|---------|
| **Overview** | Daily summary |
| **Sales & customers** | Sales, expenses, customers, settlements, returns, credit sales |
| **Inventory** | Item report, reorder, expiry |
| **Finance** | Cash in hand, payments, customer aging, finance reports |
| **Purchases** | Purchase report |

#### How to use a report

1. Tap a report name.
2. Set **date range** or filters shown on screen.
3. View results on screen.
4. Use **Print** to send to your Bluetooth printer (if configured).
5. Some reports support sharing or export.

Reports are read-only — they do not change inventory.

---

### Customers & Expenses

#### Customers

- **Home → Customers** or Dashboard quick action
- View customer list with contact info and location
- Tap **Add Customer** to create: name, phone, address, etc.
- In a sale, tap customer row on order screen to select or add new customer

#### Expenses

- **Home → Expenses** to view history
- **Add Expense** to record a new cost (amount, category, notes, date)
- Expenses appear in dashboard totals and expense reports

---

### Settings & Printer

Open **Profile tab → Settings**.

| Setting | Purpose |
|---------|---------|
| **Company** | Shop name, address, currency (from server) |
| **Inventory** | Default location, stock display options |
| **Orders** | POS order preferences |
| **Receipt printer** | Bluetooth / network printer setup |
| **Receipt layout** | Logo, font size, header/footer text |
| **System reports** | Default report print options |
| **Notifications** | SMS / email notification preferences |
| **Alerts** | Expiry and cheque reminder settings |
| **Employees** | Staff list (view from mobile) |
| **User profile** | Change name, password |
| **Server / API** | Change backend URL |
| **Sign out** | Log out of the app |

#### Receipt printer setup

1. **Settings → Receipt printer**
2. Select **Bluetooth** or **Network**
3. For Bluetooth: enable BT + location permissions, scan devices, pick your printer
4. Choose **paper width** profile (58mm / 80mm)
5. Tap **Test print** to verify
6. Saved printer is used automatically after every sale/purchase/report print

#### Receipt customization

**Settings → Receipt layout:**
- Upload shop logo
- Set receipt title and footer message
- Adjust font size and alignment

---

## Features Summary

### Sales (POS)
- Product grid/list with categories, search, and stock visibility
- Batch-aware sales (FEFO batch selection, unbatched + batch stock)
- Cart with editable quantity, discounts, and auto-applied product/order offers
- Multiple payment methods (Cash, Card, Cheque, Credit, Bank Transfer, Online)
- Hold orders with PIN protection
- Sales returns with batch stock restore
- Customer selection and quick customer creation
- Receipt preview, share, and Bluetooth thermal printing

### Products & Inventory
- Product catalog browsing
- Add/edit items with images and UOM
- Stock adjustments and item history
- Batch management (expiry, branch stock, add/edit/delete batches)
- Location transfers (TOG transfer)
- Purchase orders with supplier, price, expiry date, and auto batch creation
- Purchase receipt printing

### Dashboard & Operations
- Revenue dashboard and today’s activity
- Customers and expenses
- Alerts (expiry, cheques, etc.)
- System reports (daily summary, sales, purchases, reorder, and more)

### Settings
- Company, inventory, and order preferences
- Receipt layout customization (logo, font, footer)
- Bluetooth receipt printer setup
- Notification and alert settings
- Server / API URL configuration
- User profile and sign out

---

## Developer Setup

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.85 |
| Language | TypeScript |
| UI | Gluestack UI, React Native Paper, NativeWind (Tailwind) |
| Navigation | React Navigation (bottom tabs + native stacks) |
| HTTP | Axios |
| Storage | AsyncStorage |
| Printing | react-native-thermal-receipt-printer (Bluetooth) |
| Icons | Lucide React Native |

### Prerequisites

- **Node.js** ≥ 22.11.0
- **npm** (or yarn)
- **JDK 17+**
- **Android Studio** with Android SDK (API 24+, compile SDK 36)
- A running **POS backend API** (Laravel-based server)

Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) for Android.

### Backend connection (development)

For local development, set your machine IP in `src/config/env.ts`:

```ts
export const DEV_MACHINE_IP = '192.168.8.100';
export const DEV_API_PORT = 8000;
```

Used only when no saved server URL exists and the app runs in development mode.

### Installation

```bash
git clone <your-repo-url>
cd pos-app--2
npm install
npm run link:fonts   # if needed
```

### Run in development

```bash
npm start          # Terminal 1 — Metro bundler
npm run android    # Terminal 2 — build & install on device
```

Reset Metro cache if modules fail to resolve:

```bash
npx react-native start --reset-cache
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run build:apk` | Build release APK |
| `npm run build:apk:debug` | Build debug APK |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

### Project structure

```
src/
├── App.tsx                 # App root, providers, navigation
├── components/             # Reusable UI (sales, settings, inputs)
├── config/                 # Environment configuration
├── context/                # React contexts (auth, POS sale, settings)
├── hooks/                  # Business logic hooks
├── navigation/             # Tab and stack navigators
├── screens/                # Feature screens
├── services/               # API, Bluetooth, storage
├── theme/                  # Colors, typography
├── types/                  # TypeScript types
└── utils/                  # Helpers (offers, batches, receipts)
```

Path alias: `@/` → `src/`

---

## Building an APK

### Release APK (install on shop devices)

```bash
npm run build:apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Debug APK (testing)

```bash
npm run build:apk:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install via USB

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

> Release builds currently use the debug keystore. For Play Store, configure a production keystore in `android/app/build.gradle`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot log in / API error | Check **Settings → Server / API** URL; phone and server must be on same network for local IP |
| Dashboard shows no data | Pull to refresh; confirm user has permissions on server |
| Product not in list | Check branch/location filter on Products screen |
| Batch picker empty | Item may have no batch stock at selected branch |
| Offer not applied | Open order screen — offers recalculate when cart changes |
| Printer not printing | Re-pair in Android BT settings; re-run **Receipt printer** setup |
| Hold order PIN forgotten | Clear saved PIN from hold screen or sign out and ask admin |
| Metro “Unable to resolve module” | `npm install` then `npx react-native start --reset-cache` |
| Build fails | `cd android && gradlew.bat clean && cd ..` then rebuild |
| Cleartext HTTP blocked | Use HTTPS in production; HTTP allowed in dev builds |

### Android permissions

The app may request: Internet, Bluetooth, Camera, Notifications, Location (for Bluetooth scan). Grant when prompted.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Commit your changes
4. Push and open a Pull Request

Run `npm run lint` and `npx tsc --noEmit` before submitting.

---

## License

This project is private by default. Add your license here if you plan to open-source it.
