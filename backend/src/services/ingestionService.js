const ShopifyService = require('./shopifyService');
const { Customer, Product, Order, Tenant } = require('../models');
const logger = require('../utils/logger');

class IngestionService {
  constructor(tenant) {
    this.tenant = tenant;
    this.tenantId = tenant.id;
    this.shopifyService = new ShopifyService(tenant);
  }

  // Initialize and test connection
  async initialize() {
    try {
      // Test connection
      const isConnected = await this.shopifyService.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Shopify store');
      }

      logger.info('Ingestion service initialized', {
        tenantId: this.tenantId,
        shopDomain: this.tenant.shopifyDomain
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize ingestion service', {
        operation: 'initialize_ingestion_service',
        tenantId: this.tenantId,
        error: error.message
      });
      throw error;
    }
  }

  // Sync all data
  async syncAllData(forceFullSync = false) {
    try {
      await this.initialize();

      const results = {
        customers: { synced: 0, errors: 0 },
        products: { synced: 0, errors: 0 },
        orders: { synced: 0, errors: 0 }
      };

      // Sync customers
      try {
        const customerResult = await this.syncCustomers({ limit: 250 });
        results.customers = customerResult;
      } catch (error) {
        logger.error('Customer sync failed', { error: error.message });
        results.customers.errors = 1;
      }

      // Sync products
      try {
        const productResult = await this.syncProducts({ limit: 250 });
        results.products = productResult;
      } catch (error) {
        logger.error('Product sync failed', { error: error.message });
        results.products.errors = 1;
      }

      // Sync orders
      try {
        const orderResult = await this.syncOrders({ limit: 250 });
        results.orders = orderResult;
      } catch (error) {
        logger.error('Order sync failed', { error: error.message });
        results.orders.errors = 1;
      }

      logger.info('Full sync completed', {
        tenantId: this.tenantId,
        results
      });

      return results;
    } catch (error) {
      logger.error('Full sync failed', {
        tenantId: this.tenantId,
        error: error.message
      });
      throw error;
    }
  }

  // Sync customers
  async syncCustomers(options = {}) {
    try {
      const { sinceId, limit = 250 } = options;
      
      const customers = await this.shopifyService.getCustomers({ sinceId, limit });
      let synced = 0;
      let errors = 0;

      for (const customerData of customers) {
        try {
          await Customer.upsert({
            tenantId: this.tenantId,
            shopifyId: customerData.id,
            email: customerData.email,
            firstName: customerData.first_name,
            lastName: customerData.last_name,
            phone: customerData.phone,
            acceptsMarketing: customerData.accepts_marketing || false,
            totalSpent: parseFloat(customerData.total_spent) || 0,
            totalOrders: customerData.orders_count || 0,
            state: customerData.state || 'enabled',
            shopifyCreatedAt: customerData.created_at,
            shopifyUpdatedAt: customerData.updated_at,
            syncedAt: new Date()
          });
          synced++;
        } catch (error) {
          logger.error('Failed to sync customer', {
            customerId: customerData.id,
            error: error.message
          });
          errors++;
        }
      }

      return { synced, errors };
    } catch (error) {
      logger.error('Customer sync failed', { error: error.message });
      throw error;
    }
  }

  // Sync products
  async syncProducts(options = {}) {
    try {
      const { sinceId, limit = 250 } = options;
      
      const products = await this.shopifyService.getProducts({ sinceId, limit });
      let synced = 0;
      let errors = 0;

      for (const productData of products) {
        try {
          await Product.upsert({
            tenantId: this.tenantId,
            shopifyId: productData.id,
            title: productData.title,
            vendor: productData.vendor,
            productType: productData.product_type,
            status: productData.status,
            price: parseFloat(productData.variants?.[0]?.price) || 0,
            cost: parseFloat(productData.variants?.[0]?.cost_per_item) || 0,
            tags: productData.tags ? productData.tags.split(',').map(tag => tag.trim()) : [],
            variants: productData.variants || [],
            shopifyCreatedAt: productData.created_at,
            shopifyUpdatedAt: productData.updated_at,
            syncedAt: new Date()
          });
          synced++;
        } catch (error) {
          logger.error('Failed to sync product', {
            productId: productData.id,
            error: error.message
          });
          errors++;
        }
      }

      return { synced, errors };
    } catch (error) {
      logger.error('Product sync failed', { error: error.message });
      throw error;
    }
  }

  // Sync orders
  async syncOrders(options = {}) {
    try {
      const { sinceId, limit = 250, status = 'any' } = options;
      
      const orders = await this.shopifyService.getOrders({ sinceId, limit, status });
      let synced = 0;
      let errors = 0;

      for (const orderData of orders) {
        try {
          await Order.upsert({
            tenantId: this.tenantId,
            customerId: orderData.customer ? await this.getCustomerId(orderData.customer.id) : null,
            shopifyId: orderData.id,
            financialStatus: orderData.financial_status,
            currency: orderData.currency,
            totalPrice: parseFloat(orderData.total_price) || 0,
            totalQuantity: orderData.total_quantity || 0,
            processedAt: orderData.processed_at,
            shopifyCreatedAt: orderData.created_at,
            shopifyUpdatedAt: orderData.updated_at,
            syncedAt: new Date()
          });
          synced++;
        } catch (error) {
          logger.error('Failed to sync order', {
            orderId: orderData.id,
            error: error.message
          });
          errors++;
        }
      }

      return { synced, errors };
    } catch (error) {
      logger.error('Order sync failed', { error: error.message });
      throw error;
    }
  }

  // Helper method to get customer ID
  async getCustomerId(shopifyCustomerId) {
    const customer = await Customer.findOne({
      where: { tenantId: this.tenantId, shopifyId: shopifyCustomerId }
    });
    return customer ? customer.id : null;
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const [customerCount, productCount, orderCount] = await Promise.all([
        Customer.count({ where: { tenantId: this.tenantId } }),
        Product.count({ where: { tenantId: this.tenantId } }),
        Order.count({ where: { tenantId: this.tenantId } })
      ]);

      const lastSync = await Order.findOne({
        where: { tenantId: this.tenantId },
        order: [['syncedAt', 'DESC']],
        attributes: ['syncedAt']
      });

      return {
        tenantId: this.tenantId,
        counts: {
          customers: customerCount,
          products: productCount,
          orders: orderCount
        },
        lastSync: lastSync ? lastSync.syncedAt : null,
        status: 'ready'
      };
    } catch (error) {
      logger.error('Failed to get sync status', { error: error.message });
      throw error;
    }
  }
}

module.exports = IngestionService;