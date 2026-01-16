import { pgTable, varchar, integer, timestamp, text, numeric, boolean, serial } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// ===================================
// USUARIOS
// ===================================
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===================================
// CATEGORÍAS
// ===================================
export const categories = pgTable('categories', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: varchar('parent_id', { length: 128 }), // Para categorías jerárquicas
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===================================
// UBICACIONES/BODEGAS
// ===================================
export const locations = pgTable('locations', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  address: text('address'),
  responsible: varchar('responsible', { length: 255 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===================================
// ITEMS DEL INVENTARIO
// ===================================
export const items = pgTable('items', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: varchar('category_id', { length: 128 }).notNull(),
  
  // Stock
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  maxStock: integer('max_stock'),
  
  // Precios
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }),
  totalValue: numeric('total_value', { precision: 12, scale: 2 }),
  
  // Ubicación
  locationId: varchar('location_id', { length: 128 }),
  shelf: varchar('shelf', { length: 100 }), // Estante/Pasillo
  
  // Imágenes
  imageUrl: text('image_url'),
  
  // Información adicional
  barcode: varchar('barcode', { length: 255 }),
  sku: varchar('sku', { length: 255 }),
  brand: varchar('brand', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  
  // Estado
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, inactive, discontinued
  condition: varchar('condition', { length: 50 }), // new, used, refurbished, damaged
  
  // Metadatos
  tags: text('tags'), // JSON string array
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===================================
// MOVIMIENTOS DE INVENTARIO
// ===================================
export const movements = pgTable('movements', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  itemId: varchar('item_id', { length: 128 }).notNull(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  
  type: varchar('type', { length: 50 }).notNull(), // entrada, salida, ajuste, transferencia
  quantity: integer('quantity').notNull(),
  
  // Stock tracking
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  
  // Origen/Destino (para transferencias)
  fromLocationId: varchar('from_location_id', { length: 128 }),
  toLocationId: varchar('to_location_id', { length: 128 }),
  
  // Información adicional
  reason: text('reason'),
  notes: text('notes'),
  documentNumber: varchar('document_number', { length: 255 }), // Factura, orden, etc.
  
  // Proveedor/Cliente (opcional)
  supplierId: varchar('supplier_id', { length: 128 }),
  customerId: varchar('customer_id', { length: 128 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===================================
// PROVEEDORES
// ===================================
export const suppliers = pgTable('suppliers', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).unique(),
  
  // Contacto
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  mobile: varchar('mobile', { length: 50 }),
  
  // Dirección
  address: text('address'),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  
  // Información fiscal
  taxId: varchar('tax_id', { length: 100 }),
  
  // Estado
  active: boolean('active').notNull().default(true),
  rating: integer('rating'), // 1-5
  
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===================================
// ÓRDENES DE COMPRA (Opcional)
// ===================================
export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  supplierId: varchar('supplier_id', { length: 128 }).notNull(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, received, cancelled
  
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  
  orderDate: timestamp('order_date').notNull().defaultNow(),
  expectedDate: timestamp('expected_date'),
  receivedDate: timestamp('received_date'),
  
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===================================
// AUDITORÍA/LOGS (Opcional pero recomendado)
// ===================================
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete
  entityType: varchar('entity_type', { length: 100 }).notNull(), // item, movement, user, etc.
  entityId: varchar('entity_id', { length: 128 }).notNull(),
  
  oldValue: text('old_value'), // JSON
  newValue: text('new_value'), // JSON
  
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
