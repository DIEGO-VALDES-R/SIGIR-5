import { eq, and, lt, lte, gte, like, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  categories,
  products,
  suppliers,
  warehouses,
  locations,
  transactions,
  purchaseOrders,
  purchaseOrderItems,
  alerts,
  notificationLogs,
  demandForecasts,
  TransactionTypeEnum,
  AlertTypeEnum,
  PurchaseOrderStatusEnum,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== PRODUCTOS =====

export async function getProducts(
  search?: string,
  categoryId?: string,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${products.name} LIKE ${`%${search}%`} OR ${products.code} LIKE ${`%${search}%`} OR ${products.description} LIKE ${`%${search}%`})`
    );
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  if (status) {
    conditions.push(eq(products.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return await (whereClause
    ? db.select().from(products).where(whereClause)
    : db.select().from(products));
}

export async function getProductById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProductByCode(code: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.code, code))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createProduct(product: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(product);
  return result;
}

export async function updateProduct(id: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(products).set(updates).where(eq(products.id, id));
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(products).where(eq(products.id, id));
}

// ===== CATEGORÍAS =====

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories);
}

export async function createCategory(category: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(categories).values(category);
}

// ===== PROVEEDORES =====

export async function getSuppliers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
}

export async function getSupplierById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createSupplier(supplier: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(suppliers).values(supplier);
}

export async function updateSupplier(id: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(suppliers).set(updates).where(eq(suppliers.id, id));
}

// ===== TRANSACCIONES (KARDEX) =====

export async function createTransaction(transaction: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(transactions).values(transaction);
}

export async function getTransactions(
  productId?: string,
  type?: string,
  limit?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (productId) {
    conditions.push(eq(transactions.productId, productId));
  }
  if (type) {
    conditions.push(eq(transactions.type, type as any));
  }

  let baseQuery = db.select().from(transactions);

  if (conditions.length > 0) {
    baseQuery = baseQuery.where(and(...conditions)) as any;
  }

  baseQuery = baseQuery.orderBy(desc(transactions.createdAt)) as any;

  if (limit) {
    baseQuery = baseQuery.limit(limit) as any;
  }

  return await baseQuery;
}

// ===== ÓRDENES DE COMPRA =====

export async function createPurchaseOrder(order: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(purchaseOrders).values(order);
}

export async function getPurchaseOrders(status?: string) {
  const db = await getDb();
  if (!db) return [];

  let baseQuery = db.select().from(purchaseOrders);

  if (status) {
    baseQuery = baseQuery.where(eq(purchaseOrders.status, status as any)) as any;
  }

  return await (baseQuery.orderBy(desc(purchaseOrders.createdAt)) as any);
}

export async function getPurchaseOrderById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updatePurchaseOrder(id: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(purchaseOrders)
    .set(updates)
    .where(eq(purchaseOrders.id, id));
}

export async function createPurchaseOrderItem(item: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(purchaseOrderItems).values(item);
}

export async function getPurchaseOrderItems(purchaseOrderId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

// ===== ALERTAS =====

export async function createAlert(alert: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(alerts).values(alert);
}

export async function getActiveAlerts() {
  const db = await getDb();
  if (!db) return [];

  return await (db
    .select()
    .from(alerts)
    .where(eq(alerts.isResolved, false))
    .orderBy(desc(alerts.createdAt)) as any);
}

export async function getAlertsByProduct(productId: string) {
  const db = await getDb();
  if (!db) return [];

  return await (db
    .select()
    .from(alerts)
    .where(
      and(eq(alerts.productId, productId), eq(alerts.isResolved, false))
    ) as any);
}

export async function resolveAlert(id: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(alerts)
    .set({
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: userId,
    })
    .where(eq(alerts.id, id));
}

// ===== NOTIFICACIONES =====

export async function createNotificationLog(log: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notificationLogs).values(log);
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];

  return await (db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.status, "pending")) as any);
}

export async function updateNotificationLog(id: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notificationLogs)
    .set(updates)
    .where(eq(notificationLogs.id, id));
}

// ===== BODEGAS Y UBICACIONES =====

export async function getWarehouses() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(warehouses);
}

export async function getLocationsByWarehouse(warehouseId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(locations)
    .where(eq(locations.warehouseId, warehouseId));
}

export async function createWarehouse(warehouse: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(warehouses).values(warehouse);
}

export async function createLocation(location: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(locations).values(location);
}

// ===== ANÁLISIS DE DEMANDA =====

export async function createDemandForecast(forecast: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(demandForecasts).values(forecast);
}

export async function getDemandForecast(productId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(demandForecasts)
    .where(eq(demandForecasts.productId, productId))
    .orderBy(desc(demandForecasts.generatedAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ===== ESTADÍSTICAS =====

export async function getDashboardStats() {
  const db = await getDb();
  if (!db)
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiredCount: 0,
      expiringCount: 0,
    };

  const allProducts = await db.select().from(products);

  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiredCount = 0;
  let expiringCount = 0;

  const now = new Date();
  const expirationWarningDays = 30;

  allProducts.forEach((p) => {
    totalValue += parseFloat(p.price.toString()) * p.stock;

    if (p.stock === 0) {
      outOfStockCount++;
    } else if (p.stock <= p.minStock) {
      lowStockCount++;
    }

    if (p.expirationDate) {
      const expDate = new Date(p.expirationDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expiredCount++;
      } else if (diffDays <= expirationWarningDays) {
        expiringCount++;
      }
    }
  });

  return {
    totalProducts: allProducts.length,
    totalValue,
    lowStockCount,
    outOfStockCount,
    expiredCount,
    expiringCount,
  };
}

export async function getStockByCategory() {
  const db = await getDb();
  if (!db) return [];

  const allCategories = await db.select().from(categories);
  const allProducts = await db.select().from(products);

  return allCategories.map((cat) => ({
    name: cat.name,
    stock: allProducts
      .filter((p) => p.categoryId === cat.id)
      .reduce((acc, curr) => acc + curr.stock, 0),
  }));
}
