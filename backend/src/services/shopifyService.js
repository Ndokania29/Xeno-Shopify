const { createShopifyClient } = require('../config/shopify');
const { Tenant, Product, Customer, Order, OrderItem } = require('../models');
const { logError, logEvent } = require('../utils/logger');

class ShopifyService {
    constructor(tenant) {
        this.tenant = tenant;
        this.client = createShopifyClient(
            tenant.shopifyDomain,
            tenant.shopifyAccessToken
        );
    }

    // Test connection to Shopify
    async testConnection() {
        try {
            await this.client.get('/shop.json');
            return true;
        } catch (error) {
            logError(error, { operation: 'testConnection', tenantId: this.tenant.id });
            return false;
        }
    }

    // Get customers with pagination
    async getCustomers(options = {}) {
        try {
            const { sinceId, limit = 250 } = options;
            let url = `/customers.json?limit=${limit}`;
            if (sinceId) url += `&since_id=${sinceId}`;
            
            const response = await this.client.get(url);
            return response.data.customers || [];
        } catch (error) {
            logError(error, { operation: 'getCustomers', tenantId: this.tenant.id });
            throw error;
        }
    }

    // Get products with pagination
    async getProducts(options = {}) {
        try {
            const { sinceId, limit = 250 } = options;
            let url = `/products.json?limit=${limit}`;
            if (sinceId) url += `&since_id=${sinceId}`;
            
            const response = await this.client.get(url);
            return response.data.products || [];
        } catch (error) {
            logError(error, { operation: 'getProducts', tenantId: this.tenant.id });
            throw error;
        }
    }

    // Get orders with pagination
    async getOrders(options = {}) {
        try {
            const { sinceId, limit = 250, status = 'any' } = options;
            let url = `/orders.json?limit=${limit}&status=${status}`;
            if (sinceId) url += `&since_id=${sinceId}`;
            
            const response = await this.client.get(url);
            return response.data.orders || [];
        } catch (error) {
            logError(error, { operation: 'getOrders', tenantId: this.tenant.id });
            throw error;
        }
    }

    // Fetch and sync products
    async syncProducts() {
        try {
            const products = await this.client.get('/products.json');
            
            for (const shopifyProduct of products.data.products) {
                await Product.upsert({
                    tenantId: this.tenant.id,
                    shopifyId: shopifyProduct.id,
                    title: shopifyProduct.title,
                    vendor: shopifyProduct.vendor,
                    productType: shopifyProduct.product_type,
                    status: shopifyProduct.status,
                    price: shopifyProduct.variants[0]?.price || 0,
                    tags: shopifyProduct.tags,
                    shopifyCreatedAt: shopifyProduct.created_at,
                    shopifyUpdatedAt: shopifyProduct.updated_at
                });
            }

            logEvent('products_synced', {
                tenantId: this.tenant.id,
                count: products.data.products.length
            });

            return products.data.products;
        } catch (error) {
            logError(error, {
                operation: 'syncProducts',
                tenantId: this.tenant.id
            });
            throw error;
        }
    }

    // Fetch and sync customers
    async syncCustomers() {
        try {
            const customers = await this.client.get('/customers.json');
            
            for (const shopifyCustomer of customers.data.customers) {
                await Customer.upsert({
                    tenantId: this.tenant.id,
                    shopifyId: shopifyCustomer.id,
                    email: shopifyCustomer.email,
                    firstName: shopifyCustomer.first_name,
                    lastName: shopifyCustomer.last_name,
                    totalSpent: shopifyCustomer.total_spent,
                    ordersCount: shopifyCustomer.orders_count,
                    state: shopifyCustomer.state,
                    verifiedEmail: shopifyCustomer.verified_email,
                    shopifyCreatedAt: shopifyCustomer.created_at
                });
            }

            logEvent('customers_synced', {
                tenantId: this.tenant.id,
                count: customers.data.customers.length
            });

            return customers.data.customers;
        } catch (error) {
            logError(error, {
                operation: 'syncCustomers',
                tenantId: this.tenant.id
            });
            throw error;
        }
    }

    // Fetch and sync orders
    async syncOrders() {
        try {
            const orders = await this.client.get('/orders.json?status=any');
            
            for (const shopifyOrder of orders.data.orders) {
                const order = await Order.upsert({
                    tenantId: this.tenant.id,
                    shopifyId: shopifyOrder.id,
                    customerId: shopifyOrder.customer?.id,
                    orderNumber: shopifyOrder.order_number,
                    totalPrice: shopifyOrder.total_price,
                    status: shopifyOrder.financial_status,
                    shopifyCreatedAt: shopifyOrder.created_at
                });

                // Sync order items
                for (const item of shopifyOrder.line_items) {
                    await OrderItem.upsert({
                        orderId: order[0].id,
                        productId: item.product_id,
                        quantity: item.quantity,
                        priceAtTime: item.price,
                        totalPrice: item.price * item.quantity,
                        title: item.title,
                        shopifyLineItemId: item.id
                    });
                }
            }

            logEvent('orders_synced', {
                tenantId: this.tenant.id,
                count: orders.data.orders.length
            });

            return orders.data.orders;
        } catch (error) {
            logError(error, {
                operation: 'syncOrders',
                tenantId: this.tenant.id
            });
            throw error;
        }
    }
}

module.exports = ShopifyService;