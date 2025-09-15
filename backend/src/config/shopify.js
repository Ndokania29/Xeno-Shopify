const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Core configuration
const shopifyConfig = {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
    apiVersion:  '2025-07',
    timeout: 30000,

    // Rate limiting settings
    rateLimits: {
        requestsPerSecond: 2,
        burstLimit: 40,
        retryAfter: 2000
    },

    // Webhook topics to handle
    webhookTopics: [
        'orders/create',
        'orders/updated',
        'orders/cancelled',
        'customers/create',
        'customers/update',
        'products/create',
        'products/update',
        // Bonus events for cart abandonment
        'checkouts/create',
        'checkouts/update',
        'carts/update'
    ]
};


/**
 * Create Shopify REST client for a tenant
 * @param {string} shopDomain - Store's myshopify domain
 * @param {string} accessToken - Store's access token
 */
function createShopifyClient(shopDomain, accessToken) {
    if (!shopDomain || !accessToken) {
        throw new Error('Shop domain and access token required');
    }

    const baseURL = `https://${shopDomain}/admin/api/${shopifyConfig.apiVersion}`;

    return axios.create({
        baseURL,
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        },
        timeout: shopifyConfig.timeout
    });
}


 // Verify Shopify webhook authenticity
 
function verifyWebhook(rawBody, hmacHeader) {
    const secret = shopifyConfig.webhookSecret;
    if (!secret) return false;

    const digest = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

    return crypto.timingSafeEqual(
        Buffer.from(digest),
        Buffer.from(hmacHeader || '', 'utf8')
    );
}


 // Data fetching helpers
 
async function fetchProducts(client) {
    const res = await client.get('/products.json?limit=250');
    return res.data.products || [];
}

async function fetchCustomers(client) {
    const res = await client.get('/customers.json?limit=250');
    return res.data.customers || [];
}

async function fetchOrders(client) {
    const res = await client.get('/orders.json?status=any&limit=250');
    return res.data.orders || [];
}

/**
 * Utility functions
 */
function getWebhookUrl(baseUrl, tenantId) {
    const clean = baseUrl.replace(/\/$/, '');
    return `${clean}/api/webhooks/shopify/${tenantId}`;
}

function validateConfig() {
    const required = ['apiKey', 'apiSecret', 'webhookSecret'];
    const missing = required.filter(key => !shopifyConfig[key]);
    
    if (missing.length > 0) {
        console.warn(`Missing Shopify configuration: ${missing.join(', ')}`);
        return false;
    }
    return true;
}

module.exports = {
    shopifyConfig,
    createShopifyClient,
    verifyWebhook,
    getWebhookUrl,
    validateConfig,
    fetchProducts,
    fetchCustomers,
    fetchOrders
};