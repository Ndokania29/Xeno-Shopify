const { Shopify } = require('@shopify/shopify-api');
const { sequelize } = require('../config/db');
const random = require('random-number-csprng');
require('dotenv').config();

// Initialize Shopify
const shopify = new Shopify({
  shopName: process.env.SHOP_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: '2023-07'
});

async function generateRandomOrders(count = 10) {
  try {
    console.log(`Starting to generate ${count} random orders...`);

    // Fetch existing customers and products from your database
    const customers = await sequelize.query(
      'SELECT * FROM customers WHERE tenant_id = :tenantId',
      {
        replacements: { tenantId: process.env.TENANT_ID },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const products = await sequelize.query(
      'SELECT * FROM products WHERE tenant_id = :tenantId',
      {
        replacements: { tenantId: process.env.TENANT_ID },
        type: sequelize.QueryTypes.SELECT
      }
    );

    for (let i = 0; i < count; i++) {
      // Pick random customer
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      // Generate 1-3 random line items
      const numberOfItems = Math.floor(Math.random() * 3) + 1;
      const lineItems = [];

      for (let j = 0; j < numberOfItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        
        lineItems.push({
          variant_id: product.shopify_variant_id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.price
        });
      }

      // Create random date within last 90 days
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90));

      // Create order in Shopify
      const shopifyOrder = await shopify.order.create({
        customer: { id: customer.shopify_customer_id },
        line_items: lineItems,
        financial_status: Math.random() > 0.2 ? 'paid' : 'pending',
        created_at: randomDate.toISOString()
      });

      // Save order to local database
      await sequelize.query(`
        INSERT INTO orders (
          tenant_id, 
          shopify_order_id, 
          customer_id, 
          order_number, 
          total_amount, 
          status, 
          created_at
        ) VALUES (
          :tenantId,
          :shopifyOrderId,
          :customerId,
          :orderNumber,
          :totalAmount,
          :status,
          :createdAt
        )`,
        {
          replacements: {
            tenantId: process.env.TENANT_ID,
            shopifyOrderId: shopifyOrder.id,
            customerId: customer.id,
            orderNumber: shopifyOrder.order_number,
            totalAmount: shopifyOrder.total_price,
            status: shopifyOrder.financial_status,
            createdAt: shopifyOrder.created_at
          },
          type: sequelize.QueryTypes.INSERT
        }
      );

      console.log(`Created order #${shopifyOrder.order_number} for customer ${customer.email}`);
    }

    console.log('Order generation complete!');
  } catch (error) {
    console.error('Error generating orders:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the generator if file is executed directly
if (require.main === module) {
  generateRandomOrders()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { generateRandomOrders };