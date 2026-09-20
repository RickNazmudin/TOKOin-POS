"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. Get all categories
export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

// 2. Create Category
export async function createCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Hanya Pemilik/Admin yang berhak menambah kategori." };
  }

  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name } },
  });

  if (existing) {
    return { success: false, message: "Kategori dengan nama tersebut sudah ada." };
  }

  try {
    await prisma.category.create({
      data: {
        name,
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true, message: "Kategori berhasil ditambahkan." };
  } catch {
    return { success: false, message: "Gagal menyimpan kategori ke database." };
  }
}

// 3. Update Category
export async function updateCategory(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const name = (formData.get("name") as string)?.trim();
  const status = formData.get("status") as string;

  if (!name) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name,
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true, message: "Kategori berhasil diperbarui." };
  } catch {
    return { success: false, message: "Gagal memperbarui kategori." };
  }
}

// 4. Delete / Deactivate Category
export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });

  if (productCount > 0) {
    return {
      success: false,
      message: `Tidak dapat menghapus kategori karena masih memiliki ${productCount} produk. Silakan nonaktifkan kategori saja.`,
    };
  }

  try {
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Kategori berhasil dihapus." };
  } catch {
    return { success: false, message: "Gagal menghapus kategori." };
  }
}
