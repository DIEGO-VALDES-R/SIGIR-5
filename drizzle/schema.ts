import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categorías de productos
 */
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Bodegas/almacenes
 */
export const warehouses = mysqlTable("warehouses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  capacity: int("capacity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = typeof warehouses.$inferInsert;

/**
 * Ubicaciones dentro de bodegas (estantes, pasillos, etc.)
 */
export const locations = mysqlTable("locations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  warehouseId: varchar("warehouseId", { length: 36 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  aisle: varchar("aisle", { length: 50 }),
  shelf: varchar("shelf", { length: 50 }),
  bin: varchar("bin", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

/**
 * Proveedores
 */
export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  paymentTerms: varchar("paymentTerms", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Productos
 */
export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    barcode: varchar("barcode", { length: 100 }),
    qrCode: varchar("qrCode", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: varchar("categoryId", { length: 36 }).notNull(),
    supplierId: varchar("supplierId", { length: 36 }),
    unit: varchar("unit", { length: 50 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    cost: decimal("cost", { precision: 12, scale: 2 }),
    stock: int("stock").notNull().default(0),
    minStock: int("minStock").notNull().default(10),
    maxStock: int("maxStock").notNull().default(100),
    reorderQuantity: int("reorderQuantity").notNull().default(50),
    expirationDate: datetime("expirationDate"),
    status: mysqlEnum("status", ["active", "discontinued", "inactive"])
      .default("active")
      .notNull(),
    locationId: varchar("locationId", { length: 36 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: unique("code_idx").on(table.code),
    barcodeIdx: unique("barcode_idx").on(table.barcode),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Tipos de transacciones
 */
export enum TransactionTypeEnum {
  ENTRY = "entry",
  EXIT = "exit",
  ADJUSTMENT = "adjustment",
  RETURN = "return",
  WRITE_OFF = "write_off",
}

/**
 * Transacciones/Movimientos de inventario (Kardex)
 */
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("productId", { length: 36 }).notNull(),
  type: mysqlEnum("type", [
    "entry",
    "exit",
    "adjustment",
    "return",
    "write_off",
  ]).notNull(),
  quantity: int("quantity").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  reason: text("reason"),
  notes: text("notes"),
  userId: int("userId").notNull(),
  purchaseOrderId: varchar("purchaseOrderId", { length: 36 }),
  previousStock: int("previousStock").notNull(),
  resultingStock: int("resultingStock").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Estados de órdenes de compra
 */
export enum PurchaseOrderStatusEnum {
  DRAFT = "draft",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

/**
 * Órdenes de compra
 */
export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull().unique(),
  supplierId: varchar("supplierId", { length: 36 }).notNull(),
  status: mysqlEnum("status", [
    "draft",
    "pending",
    "confirmed",
    "received",
    "cancelled",
  ])
    .default("draft")
    .notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  expectedDeliveryDate: datetime("expectedDeliveryDate"),
  receivedDate: datetime("receivedDate"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Detalles de órdenes de compra (líneas de la orden)
 */
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: varchar("id", { length: 36 }).primaryKey(),
  purchaseOrderId: varchar("purchaseOrderId", { length: 36 }).notNull(),
  productId: varchar("productId", { length: 36 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  receivedQuantity: int("receivedQuantity").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem =
  typeof purchaseOrderItems.$inferInsert;

/**
 * Alertas del sistema
 */
export enum AlertTypeEnum {
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  EXPIRING_SOON = "expiring_soon",
  EXPIRED = "expired",
  PURCHASE_ORDER_PENDING = "purchase_order_pending",
}

export const alerts = mysqlTable("alerts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("productId", { length: 36 }).notNull(),
  type: mysqlEnum("type", [
    "low_stock",
    "out_of_stock",
    "expiring_soon",
    "expired",
    "purchase_order_pending",
  ]).notNull(),
  message: text("message").notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Historial de notificaciones enviadas
 */
export const notificationLogs = mysqlTable("notificationLogs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  alertId: varchar("alertId", { length: 36 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"])
    .default("pending")
    .notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Análisis de demanda (predicciones)
 */
export const demandForecasts = mysqlTable("demandForecasts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("productId", { length: 36 }).notNull(),
  forecastedDemand: int("forecastedDemand").notNull(),
  suggestedOrderQuantity: int("suggestedOrderQuantity").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  analysisData: text("analysisData"), // JSON con detalles del análisis
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  validUntil: datetime("validUntil"),
});

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = typeof demandForecasts.$inferInsert;
