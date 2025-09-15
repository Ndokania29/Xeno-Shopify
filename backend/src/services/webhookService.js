const crypto = require('crypto');
const { shopifyConfig } = require('../config/shopify');
const { Tenant, Product, Customer, Order, OrderItem } = require('../models');
const { logEvent, logError } = require('../utils/logger');

class WebhookService {
    // Verify webhook signature
    verifyWebhook(body, hmac) {
        const hash = crypto
            .createHmac('sha256', shopifyConfig.webhookSecret)
            .update(body, 'utf8')
            .digest('base64');

        return hash === hmac;
    }

    // Handle product webhooks
    async handleProductWebhook(tenantId, data) {
        try {
            await Product.upsert({
                tenantId,
                shopifyId: data.id,
                title: data.title,
                vendor: data.vendor,
                productType: data.product_type,
                status: data.status,
                price: data.variants[0]?.price || 0,
                tags: data.tags,
                shopifyCreatedAt: data.created_at,
                shopifyUpdatedAt: data.updated_at
            });

            logEvent('product_webhook_processed', {
                tenantId,
                productId: data.id
            });
        } catch (error) {
            logError(error, {
                operation: 'handleProductWebhook',
                tenantId,
                productId: data.id
            });
            throw error;
        }
    }

    // Handle customer webhooks
    async handleCustomerWebhook(tenantId, data) {
        try {
            await Customer.upsert({
                tenantId,
                shopifyId: data.id,
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name,
                totalSpent: data.total_spent,
                ordersCount: data.orders_count,
                state: data.state,
                verifiedEmail: data.verified_email
            });

            logEvent('customer_webhook_processed', {
                tenantId,
                customerId: data.id
            });
        } catch (error) {
            logError(error, {
                operation: 'handleCustomerWebhook',
                tenantId,
                customerId: data.id
            });
            throw error;
        }
    }

    // Handle order webhooks
    async handleOrderWebhook(tenantId, data) {
        try {
            const [order] = await Order.upsert({
                tenantId,
                shopifyId: data.id,
                customerId: data.customer?.id,
                orderNumber: data.order_number,
                totalPrice: data.total_price,
                status: data.financial_status,
                shopifyCreatedAt: data.created_at
            });

            // Handle order items
            for (const item of data.line_items) {
                await OrderItem.upsert({
                    orderId: order.id,
                    productId: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    shopifyLineItemId: item.id
                });
            }

            logEvent('order_webhook_processed', {
                tenantId,
                orderId: data.id
            });
        } catch (error) {
            logError(error, {
                operation: 'handleOrderWebhook',
                tenantId,
                orderId: data.id
            });
            throw error;
        }
    }
}

module.exports = new WebhookService();