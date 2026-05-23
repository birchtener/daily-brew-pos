import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PAYMENT_METHODS = ['Cash', 'GCash', 'PayMaya', 'Card'];
const SAMPLE_PRODUCTS = [
  { name: "Espresso Shot", price: 70.00, categoryName: "Beverages" },
  { name: "Spanish Latte", price: 130.00, categoryName: "Beverages" },
  { name: "Caramel Macchiato", price: 145.00, categoryName: "Beverages" },
  { name: "Signature Cold Brew", price: 150.00, categoryName: "Cold Brews" },
  { name: "Chocolate Croissant", price: 95.00, categoryName: "Pastries" },
  { name: "Blueberry Cheesecake", price: 160.00, categoryName: "Pastries" },
];

async function main() {
  console.log("Initializing completed orders seeding (150 logs)...");

  // 1. Get creator user
  let user = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (!user) {
    console.log("No admin user found. Please run the initial seed first.");
    return;
  }

  const userId = user.id;

  // 2. Fetch or seed categories
  let categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log("No categories found. Seeding standard categories...");
    const categoryNames = ["Beverages", "Cold Brews", "Pastries"];
    for (const name of categoryNames) {
      await prisma.category.create({
        data: {
          name,
          created_by: userId,
          updated_by: userId,
        }
      });
    }
    categories = await prisma.category.findMany();
  }

  // 3. Fetch or seed products
  let products = await prisma.product.findMany();
  if (products.length === 0) {
    console.log("No products found. Seeding base menu items...");
    for (const item of SAMPLE_PRODUCTS) {
      const category = categories.find(c => c.name === item.categoryName) || categories[0];
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          category_id: category.id,
          created_by: userId,
          updated_by: userId,
        }
      });
    }
    products = await prisma.product.findMany();
  }

  console.log(`Database ready. Seeding orders using ${products.length} products...`);

  // 4. Generate 150 orders across the last 30 days
  const TOTAL_ORDERS = 150;
  let createdCount = 0;

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    // Distribute date randomly in the last 30 days
    const orderDate = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const hours = Math.floor(Math.random() * 12) + 8; // Business hours: 8 AM to 8 PM
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);

    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(hours, minutes, seconds, 0);

    // Pick 1 to 3 random products
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    const lineItems = [];
    let subTotal = 0;

    for (const prod of selectedProducts) {
      const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
      const price = Number(prod.price);
      const itemSubtotal = price * quantity;

      lineItems.push({
        product_id: prod.id,
        quantity,
        price,
        sub_total: itemSubtotal,
      });

      subTotal += itemSubtotal;
    }

    const total = subTotal; // No coupons for simplicity
    const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];

    await prisma.orders.create({
      data: {
        discount_code: null,
        sub_total: subTotal,
        total: total,
        order_status: 'completed',
        created_at: orderDate,
        created_by: userId,
        items: {
          create: lineItems
        },
        payment: {
          create: {
            amount: total,
            method: paymentMethod,
            paid_at: orderDate
          }
        }
      }
    });

    createdCount++;
  }

  console.log(`Success: ${createdCount} completed orders with payments generated successfully.`);
}

main()
  .catch((e) => {
    console.error("Seeding orders failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
