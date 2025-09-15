// services/dashboardService.js
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const { Customer, Product, Order, OrderItem, Event } = require('../models'); // ensure Event imported if used
const sequelize = require('../config/db').sequelize;

/**
 * Helper - parse number safely
 */
const safeNum = (v) => (v == null ? 0 : Number(v));

/**
 * Forecasting: simple linear regression on daily revenue
 * Input: array of {date: 'YYYY-MM-DD', revenue: number}
 * Returns predicted revenue for next N days as array and single nextWeekValue.
 */
function linearForecast(dailyData, daysOut = 30) {
  if (!dailyData || dailyData.length < 3) {
    // fallback: moving average of last 7 days
    const last7 = dailyData.slice(-7).map(d => d.revenue || 0);
    const avg = last7.length ? last7.reduce((s,x)=>s+x,0)/last7.length : 0;
    return { forecast: Array(daysOut).fill(avg), nextWeek: avg };
  }

  // map to x (0..n-1) and y
  const xs = dailyData.map((d,i)=>i);
  const ys = dailyData.map(d=>d.revenue || 0);
  const n = xs.length;
  const sumX = xs.reduce((s,x)=>s+x,0);
  const sumY = ys.reduce((s,y)=>s+y,0);
  const sumXY = xs.reduce((s,x,i)=>s + x*ys[i], 0);
  const sumXX = xs.reduce((s,x)=>s + x*x,0);
  const denom = (n * sumXX - sumX * sumX) || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // forecast next days
  const forecast = [];
  for (let k = 0; k < daysOut; k++) {
    const x = n + k;
    const y = intercept + slope * x;
    forecast.push(Math.max(0, y));
  }
  // next week = sum of next 7 days
  const nextWeek = forecast.slice(0,7).reduce((s,v)=>s+v,0);
  return { forecast, nextWeek };
}

/**
 * Get Overview: counts + revenue totals + growth % vs last week
 */
async function getOverview(tenantId) {
  // counts
  const [customers, products, orders] = await Promise.all([
    Customer.count({ where: { tenantId } }),
    Product.count({ where: { tenantId } }),
    Order.count({ where: { tenantId } })
  ]);

  // revenue total & avg order value
  const revenueRow = await Order.findOne({
    where: { tenantId },
    attributes: [
      [fn('COALESCE', fn('SUM', col('totalPrice')), 0), 'totalRevenue'],
      [fn('COALESCE', fn('AVG', col('totalPrice')), 0), 'avgOrderValue']
    ],
    raw: true
  });

  const totalRevenue = safeNum(revenueRow.totalRevenue);
  const avgOrderValue = safeNum(revenueRow.avgOrderValue);

  // revenue this week vs last week
  // using JS date ranges: current week (last 7 days) vs previous 7 days
  const now = new Date();
  const endCurrent = now;
  const startCurrent = new Date(now);
  startCurrent.setDate(now.getDate() - 6); // include today + previous 6 => 7 days

  const startPrev = new Date(startCurrent);
  startPrev.setDate(startCurrent.getDate() - 7);
  const endPrev = new Date(startCurrent);
  endPrev.setDate(startCurrent.getDate() - 1);

  const revenues = await Order.findAll({
    where: {
      tenantId,
      createdAt: { [Op.between]: [startPrev, endCurrent] }
    },
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('SUM', col('totalPrice')), 'revenue']
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true
  });

  // roll sums
  const revMap = {};
  revenues.forEach(r => { revMap[r.date] = Number(r.revenue); });

  // compute sums
  let thisWeekTotal = 0, prevWeekTotal = 0;
  const curDates = [];
  for (let d = 0; d < 7; d++) {
    const dt = new Date(startCurrent); dt.setDate(startCurrent.getDate() + d);
    const key = dt.toISOString().slice(0,10);
    curDates.push(key);
    thisWeekTotal += safeNum(revMap[key]);
  }
  for (let d = 0; d < 7; d++) {
    const dt = new Date(startPrev); dt.setDate(startPrev.getDate() + d);
    const key = dt.toISOString().slice(0,10);
    prevWeekTotal += safeNum(revMap[key]);
  }

  const growthPercent = prevWeekTotal === 0 ? (thisWeekTotal === 0 ? 0 : 100) :
    ((thisWeekTotal - prevWeekTotal) / Math.abs(prevWeekTotal) * 100);

  return {
    counts: { customers, products, orders, thisWeekOrders: null },
    revenue: { total: totalRevenue, averageOrderValue: avgOrderValue, thisWeekTotal, prevWeekTotal, growthPercent }
  };
}

/**
 * Orders by date (daily) + prepare for forecast
 * Query for a date range (optional)
 */
async function getOrdersByDate(tenantId, { startDate, endDate, groupBy = 'day' } = {}) {
  // We'll return data normalized: [{date:'YYYY-MM-DD', count, revenue }]
  // For simplicity take daily grouping
  const start = startDate ? new Date(startDate) : (d => { d.setDate(d.getDate()-29); return d; })(new Date());
  const end = endDate ? new Date(endDate) : new Date();

  // Use Sequelize to group by DATE(createdAt)
  const rows = await Order.findAll({
    where: {
      tenantId,
      createdAt: { [Op.between]: [start, end] }
    },
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('totalPrice')), 'revenue']
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true
  });

  // build daily array between start..end to fill zeros
  const dayMs = 24*60*60*1000;
  const data = [];
  for (let t = new Date(start); t <= end; t = new Date(t.getTime() + dayMs)) {
    const key = t.toISOString().slice(0,10);
    const row = rows.find(r => r.date === key);
    data.push({
      date: key,
      count: row ? Number(row.count) : 0,
      revenue: row ? Number(row.revenue) : 0
    });
  }

  // forecast on this series
  const { forecast, nextWeek } = linearForecast(data, 30);

  // append forecast as separate array or include as dotted values on chart
  return { data, forecast, nextWeek };
}

/**
 * Top products by revenue & by quantity plus low-stock alerts and margin suggestions
 */
async function getProductPerformance(tenantId, { topN = 5, lowStockThresholdDays = 7 } = {}) {
  // Top products by revenue (join OrderItem -> Product)
  const topByRevenue = await OrderItem.findAll({
    include: [{ model: Product, attributes: ['id','title','price','inventoryQuantity','vendor','productType'] }],
    attributes: [
      'productId',
      [fn('SUM', col('OrderItem.quantity')), 'totalQuantity'],
      [fn('SUM', col('OrderItem.totalPrice')), 'totalRevenue']
    ],
    where: { '$Product.tenantId$': tenantId },
    group: ['productId','Product.id'],
    order: [[fn('SUM', col('OrderItem.totalPrice')), 'DESC']],
    limit: topN,
    raw: true,
    nest: true
  });

  // Top by quantity
  const topByQuantity = await OrderItem.findAll({
    include: [{ model: Product, attributes: ['id','title'] }],
    attributes: ['productId', [fn('SUM', col('OrderItem.quantity')), 'totalQuantity']],
    where: { '$Product.tenantId$': tenantId },
    group: ['productId','Product.id'],
    order: [[fn('SUM', col('OrderItem.quantity')), 'DESC']],
    limit: topN,
    raw: true,
    nest: true
  });

  // Low stock alerts: for each product, compute recent sales velocity (last N days)
  const lookbackDays = 14;
  const lookbackStart = new Date(); lookbackStart.setDate(lookbackStart.getDate() - lookbackDays);
  // total sold per product in last lookback
  const soldRows = await OrderItem.findAll({
    include: [{ model: Product, attributes: ['id','title','inventoryQuantity'] }],
    attributes: ['productId', [fn('SUM', col('OrderItem.quantity')), 'soldQty']],
    where: {
      '$Product.tenantId$': tenantId,
      createdAt: { [Op.gte]: lookbackStart }
    },
    group: ['productId','Product.id'],
    raw: true,
    nest: true
  });

  // build alerts list
  const lowStock = [];
  for (const r of soldRows) {
    const soldQty = Number(r.soldQty || 0);
    const velocity = soldQty / lookbackDays; // units/day
    const inventory = r.Product.inventoryQuantity != null ? Number(r.Product.inventoryQuantity) : null;
    if (inventory == null) continue; // can't alert if inventory unknown
    const daysLeft = velocity > 0 ? Math.ceil(inventory / velocity) : Infinity;
    if (daysLeft <= lowStockThresholdDays) {
      lowStock.push({
        productId: r.productId,
        title: r.Product.title,
        inventory,
        velocity: Number(velocity.toFixed(2)),
        daysLeft
      });
    }
  }

  // Margin improvement suggestion: naive heuristic
  // For each top product, compute margin = (price - cost)/price if cost exists (assume Product.cost if exists)
  // We'll suggest small price increases if margin < target and demand healthy
  const marginSuggestions = [];
  for (const t of topByRevenue) {
    const prod = t.Product;
    const price = prod.price != null ? Number(prod.price) : null;
    const cost = prod.cost != null ? Number(prod.cost) : null; // assume field
    const qty = Number(t.totalQuantity || 0);
    const revenue = Number(t.totalRevenue || 0);
    if (price == null || cost == null) continue;
    const marginPct = (price - cost) / price * 100;
    // naive rule: if margin < 25% and product sells > X units, suggest +5% price
    if (marginPct < 25 && qty > 10) {
      const newPrice = +(price * 1.05).toFixed(2);
      const addedMonthly = (newPrice - price) * qty; // rough per lookback
      marginSuggestions.push({
        productId: prod.id,
        title: prod.title,
        currentPrice: price,
        cost,
        marginPct: +marginPct.toFixed(2),
        suggestion: `Increase price by 5% to ₹${newPrice} → approx +₹${Math.round(addedMonthly)} per period`
      });
    }
  }

  return {
    topByRevenue: topByRevenue.map(r => ({
      productId: r.productId,
      title: r.Product.title,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Number(r.totalRevenue)
    })),
    topByQuantity: topByQuantity.map(r => ({
      productId: r.productId,
      title: r.Product.title,
      totalQuantity: Number(r.totalQuantity)
    })),
    lowStock,
    marginSuggestions
  };
}

/**
 * Customer segmentation & cohorts
 */
async function getCustomerInsights(tenantId) {
  // New vs returning in last 30 days
  const last30 = new Date(); last30.setDate(last30.getDate() - 29);
  // find customers with first order date
  // customers who placed first order <=30d ago -> new, else returning
  // We'll compute using orders table
  const customerFirstOrder = await Order.findAll({
    where: { tenantId },
    attributes: ['customerId', [fn('MIN', col('createdAt')), 'firstOrderAt']],
    group: ['customerId'],
    raw: true
  });

  const newCust = customerFirstOrder.filter(r => new Date(r.firstOrderAt) >= last30).length;
  const totalCusts = customerFirstOrder.length;
  const returningCust = totalCusts - newCust;

  // Pareto: top 20% customers by revenue contribution
  const custRevenue = await Order.findAll({
    where: { tenantId },
    attributes: ['customerId', [fn('SUM', col('totalPrice')), 'spent']],
    group: ['customerId'],
    order: [[fn('SUM', col('totalPrice')), 'DESC']],
    raw: true
  });

  const totalRevenue = custRevenue.reduce((s,r)=>s+Number(r.spent||0),0);
  const top20count = Math.max(1, Math.ceil(custRevenue.length * 0.2));
  const top20rev = custRevenue.slice(0, top20count).reduce((s,r)=>s+Number(r.spent||0),0);
  const paretoPct = totalRevenue === 0 ? 0 : +(top20rev / totalRevenue * 100).toFixed(2);

  // Cohort: customers acquired this month vs previous month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevMonthEnd = new Date(thisMonthStart.getTime() - 1);

  const thisMonthCount = await Customer.count({ where: { tenantId, createdAt: { [Op.gte]: thisMonthStart } } });
  const prevMonthCount = await Customer.count({ where: { tenantId, createdAt: { [Op.between]: [prevMonthStart, prevMonthEnd] } } });

  // Price sensitivity buckets using order line totals per order (or customer avg order)
  const orders = await Order.findAll({
    where: { tenantId },
    attributes: ['id', 'totalPrice'],
    raw: true
  });
  const buckets = { low:0, mid:0, high:0, totalOrders: orders.length };
  orders.forEach(o => {
    const p = Number(o.totalPrice || 0);
    if (p <= 500) buckets.low++;
    else if (p <= 1000) buckets.mid++;
    else buckets.high++;
  });

  const bucketPercent = {
    low: buckets.totalOrders ? Math.round(buckets.low / buckets.totalOrders * 100) : 0,
    mid: buckets.totalOrders ? Math.round(buckets.mid / buckets.totalOrders * 100) : 0,
    high: buckets.totalOrders ? Math.round(buckets.high / buckets.totalOrders * 100) : 0
  };

  return {
    newCustomers: newCust,
    returningCustomers: returningCust,
    paretoPct,
    thisMonthCount,
    prevMonthCount,
    priceBuckets: bucketPercent
  };
}

/**
 * Checkout funnel & abandoned carts
 * Requires Event model or stored checkouts. If not available, derive approximate from Orders vs carts
 */
async function getCheckoutFunnel(tenantId, { lookbackDays = 7 } = {}) {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - (lookbackDays - 1));

  // If Event model exists:
  if (typeof Event !== 'undefined') {
    const carts = await Event.count({ where: { tenantId, type: 'cart_created', createdAt: { [Op.between]: [start, end] } } });
    const checkouts = await Event.count({ where: { tenantId, type: 'checkout_started', createdAt: { [Op.between]: [start, end] } } });
    const orders = await Order.count({ where: { tenantId, createdAt: { [Op.between]: [start, end] } } });

    const abandoned = Math.max(0, carts - checkouts);
    // potential recovery = average order value * abandoned (very rough)
    const aovRow = await Order.findOne({
      where: { tenantId },
      attributes: [[fn('AVG', col('totalPrice')), 'aov']],
      raw: true
    });
    const aov = Number(aovRow.aov || 0);
    const recoveryPotential = Math.round(abandoned * aov);

    return {
      carts, checkouts, orders, abandoned, recoveryPotential
    };
  } else {
    // fallback: estimate using Orders and external cart webhook (not available) -> return zeros
    return { carts:0, checkouts:0, orders:0, abandoned:0, recoveryPotential:0 };
  }
}

/**
 * Profitability snapshot
 * Requires product.cost (or orderItem.cost) to compute profit. If missing, skip.
 */
async function getProfitability(tenantId, { topN = 5 } = {}) {
  // If product.cost exists
  const products = await Product.findAll({
    where: { tenantId },
    attributes: ['id','title','price','cost'],
    raw: true
  });

  // compute profit per product from orderitems if cost known
  const profits = [];
  for (const p of products) {
    if (p.cost == null) continue;
    const soldRows = await OrderItem.findOne({
      where: { productId: p.id },
      attributes: [[fn('SUM', col('quantity')), 'qtySold'], [fn('SUM', col('totalPrice')), 'rev']],
      raw: true
    });
    const qtySold = Number(soldRows?.qtySold || 0);
    const rev = Number(soldRows?.rev || 0);
    const profit = qtySold * (Number(p.price) - Number(p.cost));
    profits.push({ productId: p.id, title: p.title, qtySold, revenue: rev, profit });
  }

  profits.sort((a,b)=>b.profit - a.profit);
  return { products: profits.slice(0, topN) };
}

/**
 * Master function composing the full dashboard response
 */
async function getFullDashboard(tenantId) {
  const overview = await getOverview(tenantId);
  const ordersByDateBlock = await getOrdersByDate(tenantId, {});
  const productPerf = await getProductPerformance(tenantId);
  const custInsights = await getCustomerInsights(tenantId);
  const funnel = await getCheckoutFunnel(tenantId);
  const profitability = await getProfitability(tenantId);

  // Advisory tips builder
  const advisory = [];
  productPerf.marginSuggestions.forEach(s => advisory.push(s.suggestion));
  productPerf.lowStock.forEach(p => advisory.push(`Reorder ${p.title} — will run out in ${p.daysLeft} days`));
  if (funnel.abandoned > 0) advisory.push(`${funnel.abandoned} abandoned carts in last 7 days. Recovery potential ₹${funnel.recoveryPotential}`);

  return {
    overview,
    ordersByDate: ordersByDateBlock.data,
    forecast: { series: ordersByDateBlock.forecast, nextWeek: ordersByDateBlock.nextWeek },
    productPerformance: productPerf,
    customerInsights: custInsights,
    funnel,
    profitability,
    advisory
  };
}

module.exports = {
  getOverview,
  getOrdersByDate,
  getProductPerformance,
  getCustomerInsights,
  getCheckoutFunnel,
  getProfitability,
  getFullDashboard
};
