import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding database TOKOin...");

  // 1. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: "default_store" },
    update: {},
    create: {
      id: "default_store",
      storeName: "TOKOin Warung Pintar",
      logo: "/logo.png",
      address: "Jl. Niaga Raya No. 88, UMKM Central",
      phone: "0812-3456-7890",
      receiptFooter: "Terima kasih telah berbelanja di TOKOin! Semoga berkah.",
    },
  });

  // 2. Users (Admin & Kasir)
  const adminPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("kasir123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Owner / Admin Toko",
      username: "admin",
      email: "admin@tokoin.local",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      name: "Budi Kasir",
      username: "kasir",
      email: "budi@tokoin.local",
      password: cashierPassword,
      role: "CASHIER",
      status: "ACTIVE",
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: "Sembako" },
    { name: "Minuman" },
    { name: "Snack & Camilan" },
    { name: "Makanan Cepat Saji" },
    { name: "Perawatan & Kebersihan" },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        status: "ACTIVE",
      },
    });
    categories[cat.name] = createdCat;
  }

  // 4. Products Sample
  const productsData = [
    {
      name: "Indomie Goreng Original 85g",
      sku: "8998866200111",
      category: "Makanan Cepat Saji",
      costPrice: 2800,
      sellingPrice: 3500,
      stock: 48,
      minimumStock: 10,
    },
    {
      name: "Indomie Ayam Bawang 75g",
      sku: "8998866200112",
      category: "Makanan Cepat Saji",
      costPrice: 2700,
      sellingPrice: 3500,
      stock: 24,
      minimumStock: 10,
    },
    {
      name: "Air Mineral Aqua 600ml",
      sku: "8992753000018",
      category: "Minuman",
      costPrice: 2500,
      sellingPrice: 3500,
      stock: 60,
      minimumStock: 12,
    },
    {
      name: "Teh Pucuk Harum 350ml",
      sku: "8991002101114",
      category: "Minuman",
      costPrice: 3000,
      sellingPrice: 4000,
      stock: 36,
      minimumStock: 10,
    },
    {
      name: "Kopi Kapal Api Spesial Mix 24g",
      sku: "8992696404124",
      category: "Minuman",
      costPrice: 1500,
      sellingPrice: 2000,
      stock: 80,
      minimumStock: 15,
    },
    {
      name: "Minyak Goreng Bimoli 1 Liter",
      sku: "8998888123456",
      category: "Sembako",
      costPrice: 17000,
      sellingPrice: 19500,
      stock: 15,
      minimumStock: 5,
    },
    {
      name: "Gula Pasir Gulaku 1kg",
      sku: "8997028123001",
      category: "Sembako",
      costPrice: 14500,
      sellingPrice: 17000,
      stock: 8,
      minimumStock: 10,
    },
    {
      name: "Beras Rojolele Super 5kg",
      sku: "8997000111222",
      category: "Sembako",
      costPrice: 65000,
      sellingPrice: 72000,
      stock: 12,
      minimumStock: 5,
    },
    {
      name: "Chitato Sapi Panggang 68g",
      sku: "89686010014",
      category: "Snack & Camilan",
      costPrice: 9000,
      sellingPrice: 11500,
      stock: 20,
      minimumStock: 5,
    },
    {
      name: "Sabun Mandi Lifebuoy Total 10 85g",
      sku: "8999999001122",
      category: "Perawatan & Kebersihan",
      costPrice: 3500,
      sellingPrice: 4500,
      stock: 4,
      minimumStock: 10,
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });

    if (!existing) {
      const createdProd = await prisma.product.create({
        data: {
          name: prod.name,
          sku: prod.sku,
          categoryId: categories[prod.category].id,
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          stock: prod.stock,
          minimumStock: prod.minimumStock,
          status: "ACTIVE",
        },
      });

      // Catat saldo awal di StockMovement
      await prisma.stockMovement.create({
        data: {
          productId: createdProd.id,
          userId: admin.id,
          type: "RESTOCK",
          quantity: prod.stock,
          stockBefore: 0,
          stockAfter: prod.stock,
          referenceType: "MANUAL_ADJUSTMENT",
          reason: "Stok awal inisialisasi sistem",
        },
      });
    }
  }

  console.log("✅ Seeding selesai! Data admin, kasir, kategori, dan produk siap digunakan.");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
