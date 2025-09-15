# Xeno Shopify Data Ingestion & Insights

A production-ready, multi-tenant analytics platform for Shopify stores. It ingests products, customers, and orders, then surfaces actionable insights on revenue, funnels, inventory, and profitability. The stack is React (Vite) on the frontend and Node.js/Express with Sequelize/MySQL on the backend.

---

## 1. Quick Start

### Backend

```bash
cd backend
npm install
# Configure .env (see below)
npm run migrate     # Run Sequelize migrations
npm run seed        # (Optional) Seed initial data
npm start           # http://localhost:3000
```

Environment variables (`backend/.env`):

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=xeno_shopify
JWT_SECRET=supersecretkey
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=yourapppassword
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

- Auth pages live at `/login` and `/register`.
- JWT is stored in `localStorage` and attached via the Axios interceptor in `frontend/src/utils/api.js`.
- Local dev uses a Vite proxy to `http://localhost:3000` for all `/api` requests (`frontend/vite.config.js`).

---

## 2. High-Level Architecture

The PlantUML source below can be rendered with any PlantUML-compatible tool. A simplified Mermaid flow is also included.


<img width="1021" height="762" alt="image" src="https://github.com/user-attachments/assets/b1c63984-c767-481e-8a0d-f4a68530216a" />



---

## 3. API

Base URL: `/api`

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/resend-verification`

### Dashboard (protected)
- `GET /api/dashboard/overview`
- `GET /api/dashboard/full`
- `GET /api/dashboard/orders-by-date?startDate=...&endDate=...&groupBy=day|week|month`
- `GET /api/dashboard/products/performance?topN=...`
- `GET /api/dashboard/customers/insights`
- `GET /api/dashboard/funnel?days=...`
- `GET /api/dashboard/profitability?topN=...`

### Sync (protected)
- `POST /api/sync/full`
- `POST /api/sync/customers`
- `POST /api/sync/products`
- `POST /api/sync/orders`
- `GET /api/sync/status`

### Products (protected)
- `GET /api/products?limit=10`

---

## 4. Data Model (Sequelize)

### Tenants (`tenants`)
- `id` UUID (PK)
- `name` string, `email` string (unique), `password` hash
- `shopifyDomain` string (unique)
- `shopifyAccessToken`, `shopifyApiKey`, `shopifyApiSecret`
- `isActive` boolean, `lastSyncAt` date, `syncStatus` enum
- `isEmailVerified` boolean, `emailVerificationToken`, `emailVerificationExpires`
- `metadata` JSON

### Customers (`customers`)
- `id` UUID (PK), `tenantId` UUID (FK), `shopifyId` bigint (unique per tenant)
- `email`, `firstName`, `lastName`, `phone`, `state`
- `acceptsMarketing`, `verifiedEmail`, `marketingOptInLevel`
- `totalSpent` decimal, `totalOrders` int
- `lastOrderId`, `lastOrderName`
- `addresses` JSON, `tags` text (exposed as array)
- `syncedAt`, timestamps, soft-delete

### Products (`products`)
- `id` UUID (PK), `tenantId` UUID (FK), `shopifyId` bigint (unique per tenant)
- `title`, `vendor`, `productType`, `status`
- `price` decimal, `cost` decimal, `inventoryQuantity` int
- `sku`, `variants` JSON, `tags` text (exposed as array)
- `shopifyCreatedAt`, `shopifyUpdatedAt`, `syncedAt`, timestamps, soft-delete

### Orders (`orders`)
- `id` UUID (PK), `tenantId` UUID (FK), `customerId` UUID (FK), `shopifyId` bigint (unique per tenant)
- `orderNumber`, `name`, `email`, `phone`
- `financialStatus`, `fulfillmentStatus`, `currency`
- `subtotalPrice`, `totalTax`, `totalDiscounts`, `totalPrice` decimals
- `totalQuantity` int, `processedAt`, `cancelledAt`, `closedAt`, `cancelReason`
- `note`, `tags` (exposed as array), flags: `test`, `buyerAcceptsMarketing`, `confirmed`
- `referringSite`, `landingSite`, `sourceName`, `noteAttributes` JSON, `processingMethod`
- `billingAddress` JSON, `shippingAddress` JSON, `customerLocale`
- `shopifyCreatedAt`, `shopifyUpdatedAt`, `syncedAt`, timestamps, soft-delete

### Order Items (`order_items`)
- `id` UUID (PK), `orderId` UUID (FK), `productId` UUID (FK), `shopifyLineItemId` bigint (unique)
- `quantity` int, `priceAtTime` decimal, `totalPrice` decimal
- `title`, `variantInfo` JSON, `sku`, `discounted` bool, `discountAmount` decimal

---

## 5. Features

- Revenue analytics with day/week/month grouping and moving averages
- Forecast snapshot (next 30 days) with seasonality-aware trend smoothing
- Profitability and margin insights (price vs cost, discount impact, tax/fees context)
- Inventory intelligence: low-stock alerts, sell-through, days-on-hand, stockout risk
- Product performance: velocity, contribution margin, variant/option-level breakdowns
- Customer intelligence: Pareto distribution, buckets, new vs returning, cohort retention
- RFM scoring and customer lifetime value (CLV) approximation by segment
- Funnel analysis from cart → checkout → order with recovery potential estimates
- Attribution hooks for UTM/source to tie revenue to campaigns and channels
- Anomaly detection for revenue and order volume with alerting hooks
- Export endpoints for CSV/Excel and BI connectors (planned; see roadmap)

---

## 6. Mailer Service

The backend uses NodeMailer with Gmail SMTP for verification, password resets, and alerts. Configuration lives in `backend/src/utils/mailer.js`.

```js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
```

Switching to providers like SendGrid or SES is straightforward via transport configuration.

---

## 7. Operational Notes

- Shopify API rate limits can slow full syncs; batching and backoff are implemented in services.
- Multi-tenant support is optimized for small-to-medium datasets (~100k orders).
- Forecasting is heuristic-based; no ML model yet.
- Default email transport is Gmail; production setups should use a dedicated SMTP/ESP.

---

## 8. Roadmap

- Ingestion & Scalability
  - Message queues (Kafka/RabbitMQ) and scheduled backfills
  - Background workers with distributed locks and idempotent sync
  - Rate-limit–aware backoff and partial retry strategies
- Data & Performance
  - Precomputed aggregates/materialized views for dashboards
  - Read replicas and caching (Redis) for hot queries
  - Columnar warehouse export (BigQuery/Snowflake) for deep analysis
- Analytics & Product
  - RFM and CLV baked into dashboard segments
  - Cohort retention visualization and churn propensity scoring
  - A/B testing hooks and price experimentation workflows
  - Multi-warehouse inventory and demand forecasting
- Integrations
  - ESPs (SendGrid/SES), observability (Grafana/Prometheus), and alerting (Slack/Email)
  - Marketing platforms (GA4, Meta Ads) and BI connectors (Tableau/Power BI)
- Security & Compliance
  - RBAC, audit logs, SSO/SAML; environment hardening
  - GDPR tooling (export/delete), secrets management, SOC2 readiness
- Developer Experience
  - One-click seed datasets, fixture generators, and API SDKs
  - Canary deployments and zero-downtime migrations

---

## 9. Development Tips

- Frontend Axios base URL is `/api` with token injection and auto-refresh in `frontend/src/utils/api.js`.
- Vite dev server proxies `/api` to `http://localhost:3000`.
- `backend/package.json` exposes `dev` script for nodemon: `npm run dev`.

---

## License

MIT
