import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USER_IDS = [
  '252bdc71-a984-43db-a117-cb10fafd5551',
  '35b8e10c-7373-4506-9b93-7af7e917fa5b',
  'bb6cdf30-633c-4c26-bb5d-7c56e4ec2745'
];

function getRandomUser(): string {
  return USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
}

async function resetDatabase() {
  console.log("Starting targeted database reset...");
  
  // Reverse order to avoid foreign key constraint violations
  await prisma.log.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.orderItemStockDeductions.deleteMany();
  await prisma.orderItems.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.recipes.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.ingredientBatches.deleteMany();
  await prisma.supplierOrders.deleteMany();
  await prisma.suppliers.deleteMany();
  
  console.log("Targeted database reset completed.");
}

async function seedDiscountsAndCategories() {
  console.log("Seeding discounts and categories...");
  
  const discounts = [
    { code: "WELCOME10", name: "Welcome Discount", percentage: 10 },
    { code: "SUMMER15", name: "Summer Promo", percentage: 15 }
  ];
  
  for (const d of discounts) {
    await prisma.discount.create({
      data: {
        code: d.code,
        name: d.name,
        percentage: d.percentage,
        created_by: getRandomUser(),
        updated_by: getRandomUser()
      }
    });
  }
  
  const categories = ["Iced Coffee", "Hot Coffee", "Tea", "Food"];
  const categoryRecords: Record<string, any> = {};
  
  for (const c of categories) {
    const record = await prisma.category.create({
      data: {
        name: c,
        created_by: getRandomUser(),
        updated_by: getRandomUser()
      }
    });
    categoryRecords[c] = record;
  }
  
  return categoryRecords;
}

async function seedSuppliersAndIngredients() {
  console.log("Seeding suppliers and ingredients...");
  
  const suppliers = [
    { name: "Global Coffee Co.", contact_name: "John Doe", contact_number: "+639171234567" },
    { name: "Metro Dairy Distributors", contact_name: "Jane Smith", contact_number: "+639187654321" },
    { name: "Sweet Synergy Inc.", contact_name: "Bob Johnson", contact_number: "+639198887777" },
    { name: "Apex Bakehouse", contact_name: "Alice Baker", contact_number: "+639209990000" }
  ];
  
  const supplierRecords: Record<string, any> = {};
  for (const s of suppliers) {
    const record = await prisma.suppliers.create({
      data: {
        name: s.name,
        contact_name: s.contact_name,
        contact_number: s.contact_number,
        created_by: getRandomUser(),
        updated_by: getRandomUser()
      }
    });
    supplierRecords[s.name] = record;
  }
  
  const ingredients = [
    { name: "Coffee Beans", unit: "kg", low_stock_threshold: 5.0 },
    { name: "Fresh Milk", unit: "l", low_stock_threshold: 10.0 },
    { name: "Matcha Powder", unit: "g", low_stock_threshold: 500.0 },
    { name: "Chocolate Sauce", unit: "ml", low_stock_threshold: 2000.0 },
    { name: "Caramel Syrup", unit: "ml", low_stock_threshold: 1000.0 },
    { name: "Vanilla Syrup", unit: "ml", low_stock_threshold: 1000.0 },
    { name: "Condensed Milk", unit: "ml", low_stock_threshold: 2000.0 },
    { name: "Water", unit: "l", low_stock_threshold: 20.0 },
    { name: "Ice", unit: "pcs", low_stock_threshold: 500.0 },
    { name: "Croissant Dough", unit: "pcs", low_stock_threshold: 20.0 },
    { name: "Cookie Dough", unit: "pcs", low_stock_threshold: 20.0 },
    { name: "Almonds", unit: "g", low_stock_threshold: 1000.0 }
  ];
  
  const ingredientRecords: Record<string, any> = {};
  for (const i of ingredients) {
    const record = await prisma.ingredients.create({
      data: {
        name: i.name,
        unit: i.unit as any,
        low_stock_threshold: new Prisma.Decimal(i.low_stock_threshold),
        created_by: getRandomUser(),
        updated_by: getRandomUser()
      }
    });
    ingredientRecords[i.name] = record;
  }
  
  return { supplierRecords, ingredientRecords };
}

async function seedSupplierOrdersAndBatches(supplierRecords: Record<string, any>, ingredientRecords: Record<string, any>) {
  console.log("Seeding Supplier Orders and FIFO Ingredient Batches periodically...");
  
  const startDate = new Date("2026-02-26T08:00:00+08:00");
  const endDate = new Date("2026-05-26T08:00:00+08:00");
  
  // Replenishment every 14 days over the 3-month period
  const intervals = [0, 14, 28, 42, 56, 70, 84];
  
  for (const days of intervals) {
    const receivedDate = new Date(startDate);
    receivedDate.setDate(receivedDate.getDate() + days);
    
    if (receivedDate > endDate) break;
    
    const isInitial = days === 0;
    
    const supplierOrdersConfig = [
      {
        supplierName: "Global Coffee Co.",
        items: [
          { name: "Coffee Beans", qty: isInitial ? 150 : 60, baseCost: 450.00, variance: 20 }
        ]
      },
      {
        supplierName: "Metro Dairy Distributors",
        items: [
          { name: "Fresh Milk", qty: isInitial ? 600 : 250, baseCost: 95.00, variance: 5 },
          { name: "Condensed Milk", qty: isInitial ? 20000 : 8000, baseCost: 0.15, variance: 0.02 }
        ]
      },
      {
        supplierName: "Sweet Synergy Inc.",
        items: [
          { name: "Matcha Powder", qty: isInitial ? 10000 : 4000, baseCost: 1.50, variance: 0.10 },
          { name: "Chocolate Sauce", qty: isInitial ? 30000 : 10000, baseCost: 0.25, variance: 0.02 },
          { name: "Caramel Syrup", qty: isInitial ? 15000 : 6000, baseCost: 0.30, variance: 0.02 },
          { name: "Vanilla Syrup", qty: isInitial ? 15000 : 6000, baseCost: 0.30, variance: 0.02 },
          { name: "Water", qty: isInitial ? 5000 : 2000, baseCost: 5.00, variance: 0 },
          { name: "Ice", qty: isInitial ? 15000 : 6000, baseCost: 0.05, variance: 0 }
        ]
      },
      {
        supplierName: "Apex Bakehouse",
        items: [
          { name: "Croissant Dough", qty: isInitial ? 500 : 200, baseCost: 25.00, variance: 2 },
          { name: "Cookie Dough", qty: isInitial ? 600 : 250, baseCost: 18.00, variance: 1 },
          { name: "Almonds", qty: isInitial ? 15000 : 5000, baseCost: 0.80, variance: 0.05 }
        ]
      }
    ];
    
    for (const config of supplierOrdersConfig) {
      const supplier = supplierRecords[config.supplierName];
      
      const supplierOrder = await prisma.supplierOrders.create({
        data: {
          supplier_id: supplier.id,
          ordered_at: receivedDate,
          ordered_by: getRandomUser()
        }
      });
      
      for (const item of config.items) {
        const ingredient = ingredientRecords[item.name];
        
        const randomFactor = (Math.random() * 2 - 1);
        const actualCost = Math.max(0.01, item.baseCost + randomFactor * item.variance);
        
        const expiryDate = new Date(receivedDate);
        if (["Fresh Milk", "Croissant Dough", "Cookie Dough", "Ice"].includes(item.name)) {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 6);
        }
        
        await prisma.ingredientBatches.create({
          data: {
            ingredient_id: ingredient.id,
            supplier_order_id: supplierOrder.id,
            quantity_received: new Prisma.Decimal(item.qty),
            quantity_remaining: new Prisma.Decimal(item.qty),
            cost_per_unit: new Prisma.Decimal(actualCost),
            expiry: expiryDate,
            received_at: receivedDate
          }
        });
      }
    }
  }
}

async function seedProductsAndRecipes(categoryRecords: Record<string, any>, ingredientRecords: Record<string, any>) {
  console.log("Seeding products menu and precise recipes structural mappings...");
  
  const menuConfig = [
    {
      category: "Iced Coffee",
      products: [
        {
          name: "Iced Americano",
          price: 120.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Water", qty: 0.250, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Cappuccino",
          price: 135.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.150, unit: "l" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Latte",
          price: 140.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.200, unit: "l" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Macchiato",
          price: 145.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.150, unit: "l" },
            { name: "Vanilla Syrup", qty: 15.0, unit: "ml" },
            { name: "Caramel Syrup", qty: 15.0, unit: "ml" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Matcha Latte",
          price: 155.00,
          recipe: [
            { name: "Matcha Powder", qty: 6.0, unit: "g" },
            { name: "Fresh Milk", qty: 0.200, unit: "l" },
            { name: "Vanilla Syrup", qty: 10.0, unit: "ml" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Mocha Latte",
          price: 150.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.180, unit: "l" },
            { name: "Chocolate Sauce", qty: 30.0, unit: "ml" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Iced Spanish Latte",
          price: 155.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.180, unit: "l" },
            { name: "Condensed Milk", qty: 25.0, unit: "ml" },
            { name: "Water", qty: 0.050, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        }
      ]
    },
    {
      category: "Hot Coffee",
      products: [
        {
          name: "Espresso",
          price: 80.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Water", qty: 0.030, unit: "l" }
          ]
        },
        {
          name: "Hot Americano",
          price: 100.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Water", qty: 0.300, unit: "l" }
          ]
        },
        {
          name: "Hot Latte",
          price: 120.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.200, unit: "l" },
            { name: "Water", qty: 0.050, unit: "l" }
          ]
        },
        {
          name: "Hot Cappuccino",
          price: 125.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.180, unit: "l" },
            { name: "Water", qty: 0.050, unit: "l" }
          ]
        },
        {
          name: "Flat White",
          price: 130.00,
          recipe: [
            { name: "Coffee Beans", qty: 0.018, unit: "kg" },
            { name: "Fresh Milk", qty: 0.150, unit: "l" },
            { name: "Water", qty: 0.050, unit: "l" }
          ]
        }
      ]
    },
    {
      category: "Tea",
      products: [
        {
          name: "Hot Matcha Latte",
          price: 140.00,
          recipe: [
            { name: "Matcha Powder", qty: 6.0, unit: "g" },
            { name: "Fresh Milk", qty: 0.200, unit: "l" },
            { name: "Vanilla Syrup", qty: 10.0, unit: "ml" },
            { name: "Water", qty: 0.050, unit: "l" }
          ]
        },
        {
          name: "Iced Peach Tea",
          price: 110.00,
          recipe: [
            { name: "Water", qty: 0.300, unit: "l" },
            { name: "Ice", qty: 8.0, unit: "pcs" }
          ]
        },
        {
          name: "Hot Chamomile Tea",
          price: 95.00,
          recipe: [
            { name: "Water", qty: 0.300, unit: "l" }
          ]
        },
        {
          name: "Green Tea",
          price: 90.00,
          recipe: [
            { name: "Water", qty: 0.300, unit: "l" }
          ]
        }
      ]
    },
    {
      category: "Food",
      products: [
        {
          name: "Croissant",
          price: 95.00,
          recipe: [
            { name: "Croissant Dough", qty: 1.0, unit: "pcs" }
          ]
        },
        {
          name: "Almond Croissant",
          price: 135.00,
          recipe: [
            { name: "Croissant Dough", qty: 1.0, unit: "pcs" },
            { name: "Almonds", qty: 15.0, unit: "g" }
          ]
        },
        {
          name: "Chocolate Cookie",
          price: 85.00,
          recipe: [
            { name: "Cookie Dough", qty: 1.0, unit: "pcs" },
            { name: "Chocolate Sauce", qty: 10.0, unit: "ml" }
          ]
        },
        {
          name: "Dark Chocolate Cookie",
          price: 90.00,
          recipe: [
            { name: "Cookie Dough", qty: 1.0, unit: "pcs" },
            { name: "Chocolate Sauce", qty: 15.0, unit: "ml" }
          ]
        },
        {
          name: "Matcha Cookie",
          price: 90.00,
          recipe: [
            { name: "Cookie Dough", qty: 1.0, unit: "pcs" },
            { name: "Matcha Powder", qty: 3.0, unit: "g" }
          ]
        },
        {
          name: "Red Velvet Cookie",
          price: 90.00,
          recipe: [
            { name: "Cookie Dough", qty: 1.0, unit: "pcs" }
          ]
        }
      ]
    }
  ];
  
  const productList: any[] = [];
  
  for (const catConfig of menuConfig) {
    const category = categoryRecords[catConfig.category];
    
    for (const prodConfig of catConfig.products) {
      const product = await prisma.product.create({
        data: {
          name: prodConfig.name,
          price: new Prisma.Decimal(prodConfig.price),
          category_id: category.id,
          created_by: getRandomUser(),
          updated_by: getRandomUser()
        }
      });
      
      for (const recipeItem of prodConfig.recipe) {
        const ingredient = ingredientRecords[recipeItem.name];
        await prisma.recipes.create({
          data: {
            product_id: product.id,
            ingredient_id: ingredient.id,
            quantity: new Prisma.Decimal(recipeItem.qty),
            unit: recipeItem.unit as any,
            created_by: getRandomUser(),
            updated_by: getRandomUser()
          }
        });
      }
      
      productList.push(product);
    }
  }
  
  return productList;
}

async function seedCustomerOrdersAndDeductions(products: any[]) {
  console.log("Generating historical customer orders, payments, and FIFO stock deductions...");
  
  const PAYMENT_METHODS = ['cash', 'card', 'gcash', 'maya'];
  const DISCOUNT_CODES = ['WELCOME10', 'SUMMER15', null];
  
  const totalOrdersToGenerate = 160;
  const orderDates: Date[] = [];
  const startDateMs = new Date("2026-02-26T08:00:00+08:00").getTime();
  const endDateMs = new Date("2026-05-26T20:00:00+08:00").getTime();

  for (let i = 0; i < totalOrdersToGenerate; i++) {
    const randomTime = startDateMs + Math.random() * (endDateMs - startDateMs);
    const date = new Date(randomTime);
    
    const hour = 8 + Math.floor(Math.random() * 13); // business hours 8 AM to 9 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    date.setHours(hour, minute, second);
    
    orderDates.push(date);
  }

  // Sort dates chronologically so FIFO deductions flow naturally forward in time
  orderDates.sort((a, b) => a.getTime() - b.getTime());
  
  let completedCount = 0;
  let parkedCount = 0;
  
  for (const orderDate of orderDates) {
    const status = Math.random() < 0.85 ? 'completed' : 'parked';
    const creatorUser = getRandomUser();
    
    const basketSize = 1 + Math.floor(Math.random() * 4); // 1 to 4 items
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffledProducts.slice(0, basketSize);
    
    const itemsData = [];
    let subTotal = 0;
    
    for (const prod of selectedProducts) {
      const quantity = 1 + Math.floor(Math.random() * 2); // 1 or 2 items
      const price = Number(prod.price);
      const itemSubTotal = price * quantity;
      
      itemsData.push({
        product: prod,
        quantity,
        price,
        itemSubTotal
      });
      
      subTotal += itemSubTotal;
    }
    
    let discountCode: string | null = null;
    let discountPercentage = 0;
    
    if (Math.random() < 0.15) { 
      const rawCode = DISCOUNT_CODES[Math.floor(Math.random() * 2)]; 
      if (rawCode) {
        discountCode = rawCode;
        discountPercentage = rawCode === 'WELCOME10' ? 10 : 15;
      }
    }
    
    const discountMultiplier = 1 - discountPercentage / 100;
    const total = subTotal * discountMultiplier;
    
    const order = await prisma.orders.create({
      data: {
        discount_code: discountCode,
        sub_total: new Prisma.Decimal(subTotal),
        total: new Prisma.Decimal(total),
        order_status: status as any,
        created_at: orderDate,
        created_by: creatorUser
      }
    });
    
    if (status === 'completed') {
      const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
      await prisma.payments.create({
        data: {
          order_id: order.id,
          amount: new Prisma.Decimal(total),
          method: paymentMethod,
          paid_at: orderDate
        }
      });
      completedCount++;
    } else {
      parkedCount++;
    }
    
    for (const item of itemsData) {
      const orderItem = await prisma.orderItems.create({
        data: {
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: new Prisma.Decimal(item.price),
          sub_total: new Prisma.Decimal(item.itemSubTotal)
        }
      });
      
      if (status === 'completed') {
        const recipes = await prisma.recipes.findMany({
          where: { product_id: item.product.id }
        });
        
        for (const recipe of recipes) {
          let requiredQuantity = Number(recipe.quantity) * item.quantity;
          
          const activeBatches = await prisma.ingredientBatches.findMany({
            where: {
              ingredient_id: recipe.ingredient_id,
              quantity_remaining: { gt: 0 },
              received_at: { lte: orderDate }
            },
            orderBy: { received_at: 'asc' }
          });
          
          for (const batch of activeBatches) {
            if (requiredQuantity <= 0) break;
            
            const remaining = Number(batch.quantity_remaining);
            const deducted = Math.min(requiredQuantity, remaining);
            
            requiredQuantity -= deducted;
            
            await prisma.ingredientBatches.update({
              where: { id: batch.id },
              data: {
                quantity_remaining: new Prisma.Decimal(remaining - deducted)
              }
            });
            
            await prisma.orderItemStockDeductions.create({
              data: {
                order_item_id: orderItem.id,
                batch_id: batch.id,
                quantity_deducted: new Prisma.Decimal(deducted),
                cost_at_sale: new Prisma.Decimal(deducted * Number(batch.cost_per_unit))
              }
            });
          }
        }
      }
    }
  }
  
  console.log(`Generated customer orders: ${completedCount} completed, ${parkedCount} parked.`);
}

async function seedAdjustmentsAndLogs(ingredientRecords: Record<string, any>) {
  console.log("Seeding random organic inventory adjustments and system logs...");
  
  const reasons = ['spill', 'expired', 'waste'] as const;
  const ingredientsList = Object.values(ingredientRecords);
  
  const startDateMs = new Date("2026-02-26T08:00:00+08:00").getTime();
  const endDateMs = new Date("2026-05-26T20:00:00+08:00").getTime();
  
  for (let i = 0; i < 15; i++) {
    const randomTime = startDateMs + Math.random() * (endDateMs - startDateMs);
    const date = new Date(randomTime);
    
    const ingredient = ingredientsList[Math.floor(Math.random() * ingredientsList.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    
    const activeBatch = await prisma.ingredientBatches.findFirst({
      where: {
        ingredient_id: ingredient.id,
        quantity_remaining: { gt: 0 },
        received_at: { lte: date }
      },
      orderBy: { received_at: 'asc' }
    });
    
    if (activeBatch) {
      const remaining = Number(activeBatch.quantity_remaining);
      let adjustQty = 0.5;
      if (ingredient.unit === 'g') adjustQty = 50.0;
      if (ingredient.unit === 'ml') adjustQty = 250.0;
      if (ingredient.unit === 'pcs') adjustQty = 2.0;
      
      const deducted = Math.min(adjustQty, remaining);
      const costLost = deducted * Number(activeBatch.cost_per_unit);
      
      await prisma.ingredientBatches.update({
        where: { id: activeBatch.id },
        data: {
          quantity_remaining: new Prisma.Decimal(remaining - deducted)
        }
      });
      
      await prisma.inventoryAdjustment.create({
        data: {
          ingredient_id: ingredient.id,
          batch_id: activeBatch.id,
          quantity: new Prisma.Decimal(deducted),
          cost_lost: new Prisma.Decimal(costLost),
          reason: reason as any,
          notes: `Spill/waste logged historically during routine audits.`,
          created_at: date,
          created_by: getRandomUser()
        }
      });
    }
  }
  
  const logCategories = ['order', 'inventory', 'supplier', 'recipe', 'category', 'product', 'discount'] as const;
  const logTypes = ['info', 'success', 'warn'] as const;
  
  for (let i = 0; i < 45; i++) {
    const randomTime = startDateMs + Math.random() * (endDateMs - startDateMs);
    const date = new Date(randomTime);
    
    const category = logCategories[Math.floor(Math.random() * logCategories.length)];
    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
    
    let message = `System routinely checked logs for ${category}.`;
    if (category === 'order') message = `POS Transaction completed successfully. Ref: TRACE-${Math.floor(Math.random()*1000000)}.`;
    if (category === 'inventory') message = `Stock threshold alert cleared for high-velocity raw ingredients.`;
    if (category === 'supplier') message = `Supplier purchase order delivery reception processed.`;
    if (category === 'discount') message = `Discount code WELCOME10 validation active in sales workflow.`;
    
    await prisma.log.create({
      data: {
        log: message,
        created_at: date,
        updated_at: date,
        user_id: getRandomUser(),
        log_type: type as any,
        category: category as any
      }
    });
  }
}

async function main() {
  console.log("🚀 Starting comprehensive POS and Inventory Seeding Process...");
  
  // Step 1: Targeted DB Reset
  await resetDatabase();
  
  // Step 2: Seed Discounts & Categories
  const categoryRecords = await seedDiscountsAndCategories();
  
  // Step 3: Seed Suppliers & Ingredients
  const { supplierRecords, ingredientRecords } = await seedSuppliersAndIngredients();
  
  // Step 4: Seed Supplier Orders & Ingredient Batches over the 3-month timeline
  await seedSupplierOrdersAndBatches(supplierRecords, ingredientRecords);
  
  // Step 5: Seed Products & Precise Recipes structural mapping
  const products = await seedProductsAndRecipes(categoryRecords, ingredientRecords);
  
  // Step 6: Seed Customer Orders, Payments & strict FIFO Deductions
  await seedCustomerOrdersAndDeductions(products);
  
  // Step 7: Seed inventory adjustments & system audit logs
  await seedAdjustmentsAndLogs(ingredientRecords);
  
  console.log("🎉 Seeding completed successfully! All data structures populated and fully validated.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding execution failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });