import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getProducts,
  getProductById,
  getProductByCode,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  createTransaction,
  getTransactions,
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  createPurchaseOrderItem,
  getPurchaseOrderItems,
  createAlert,
  getActiveAlerts,
  getAlertsByProduct,
  resolveAlert,
  createNotificationLog,
  getPendingNotifications,
  updateNotificationLog,
  getWarehouses,
  getLocationsByWarehouse,
  createWarehouse,
  createLocation,
  createDemandForecast,
  getDemandForecast,
  getDashboardStats,
  getStockByCategory,
} from "./db";

// Procedimiento protegido solo para admins
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Solo administradores pueden acceder a esta función");
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== DASHBOARD =====
  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      return await getDashboardStats();
    }),
    getStockByCategory: protectedProcedure.query(async () => {
      return await getStockByCategory();
    }),
    getActiveAlerts: protectedProcedure.query(async () => {
      return await getActiveAlerts();
    }),
  }),

  // ===== PRODUCTOS =====
  products: router({
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          categoryId: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getProducts(input.search, input.categoryId, input.status);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getProductById(input.id);
      }),

    getByCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return await getProductByCode(input.code);
      }),

    getByBarcode: protectedProcedure
      .input(z.object({ barcode: z.string() }))
      .query(async ({ input }) => {
        return await getProductByBarcode(input.barcode);
      }),

    create: adminProcedure
      .input(
        z.object({
          code: z.string(),
          barcode: z.string().optional(),
          qrCode: z.string().optional(),
          name: z.string(),
          description: z.string().optional(),
          categoryId: z.string(),
          supplierId: z.string().optional(),
          unit: z.string(),
          price: z.number(),
          cost: z.number().optional(),
          minStock: z.number().default(10),
          maxStock: z.number().default(100),
          reorderQuantity: z.number().default(50),
          expirationDate: z.string().optional(),
          locationId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProduct({
          id: nanoid(),
          ...input,
          status: "active",
          stock: 0,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          updates: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ input }) => {
        return await updateProduct(input.id, input.updates);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await deleteProduct(input.id);
      }),
  }),

  // ===== CATEGORÍAS =====
  categories: router({
    list: protectedProcedure.query(async () => {
      return await getCategories();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCategory({
          id: nanoid(),
          ...input,
        });
      }),
  }),

  // ===== PROVEEDORES =====
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await getSuppliers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getSupplierById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          contactPerson: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          country: z.string().optional(),
          paymentTerms: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createSupplier({
          id: nanoid(),
          ...input,
          isActive: true,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          updates: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ input }) => {
        return await updateSupplier(input.id, input.updates);
      }),
  }),

  // ===== TRANSACCIONES (KARDEX) =====
  transactions: router({
    list: protectedProcedure
      .input(
        z.object({
          productId: z.string().optional(),
          type: z.string().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getTransactions(input.productId, input.type, input.limit);
      }),

    create: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          type: z.enum(["entry", "exit", "adjustment", "return", "write_off"]),
          quantity: z.number(),
          referenceNumber: z.string().optional(),
          reason: z.string().optional(),
          notes: z.string().optional(),
          previousStock: z.number(),
          resultingStock: z.number(),
          purchaseOrderId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createTransaction({
          id: nanoid(),
          ...input,
          userId: ctx.user.id,
          createdAt: new Date(),
        });
      }),
  }),

  // ===== ÓRDENES DE COMPRA =====
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return await getPurchaseOrders(input.status);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getPurchaseOrderById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          supplierId: z.string(),
          totalAmount: z.number(),
          expectedDeliveryDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const orderNumber = `PO-${Date.now()}`;
        return await createPurchaseOrder({
          id: nanoid(),
          orderNumber,
          ...input,
          status: "draft",
          createdBy: ctx.user.id,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          updates: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ input }) => {
        return await updatePurchaseOrder(input.id, input.updates);
      }),

    addItem: adminProcedure
      .input(
        z.object({
          purchaseOrderId: z.string(),
          productId: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const totalPrice = input.quantity * input.unitPrice;
        return await createPurchaseOrderItem({
          id: nanoid(),
          ...input,
          totalPrice,
        });
      }),

    getItems: protectedProcedure
      .input(z.object({ purchaseOrderId: z.string() }))
      .query(async ({ input }) => {
        return await getPurchaseOrderItems(input.purchaseOrderId);
      }),
  }),

  // ===== ALERTAS =====
  alerts: router({
    getActive: protectedProcedure.query(async () => {
      return await getActiveAlerts();
    }),

    getByProduct: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getAlertsByProduct(input.productId);
      }),

    create: adminProcedure
      .input(
        z.object({
          productId: z.string(),
          type: z.enum([
            "low_stock",
            "out_of_stock",
            "expiring_soon",
            "expired",
            "purchase_order_pending",
          ]),
          message: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await createAlert({
          id: nanoid(),
          ...input,
          isResolved: false,
        });
      }),

    resolve: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return await resolveAlert(input.id, ctx.user.id);
      }),
  }),

  // ===== NOTIFICACIONES =====
  notifications: router({
    getPending: adminProcedure.query(async () => {
      return await getPendingNotifications();
    }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["sent", "failed", "pending"]),
          errorMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateNotificationLog(input.id, {
          status: input.status,
          errorMessage: input.errorMessage,
          sentAt: input.status === "sent" ? new Date() : undefined,
        });
      }),
  }),

  // ===== BODEGAS Y UBICACIONES =====
  warehouses: router({
    list: protectedProcedure.query(async () => {
      return await getWarehouses();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          location: z.string().optional(),
          capacity: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createWarehouse({
          id: nanoid(),
          ...input,
        });
      }),
  }),

  locations: router({
    getByWarehouse: protectedProcedure
      .input(z.object({ warehouseId: z.string() }))
      .query(async ({ input }) => {
        return await getLocationsByWarehouse(input.warehouseId);
      }),

    create: adminProcedure
      .input(
        z.object({
          warehouseId: z.string(),
          code: z.string(),
          aisle: z.string().optional(),
          shelf: z.string().optional(),
          bin: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createLocation({
          id: nanoid(),
          ...input,
        });
      }),
  }),

  // ===== ANÁLISIS DE DEMANDA =====
  forecasts: router({
    getByProduct: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getDemandForecast(input.productId);
      }),

    create: adminProcedure
      .input(
        z.object({
          productId: z.string(),
          forecastedDemand: z.number(),
          suggestedOrderQuantity: z.number(),
          confidence: z.number().optional(),
          analysisData: z.string().optional(),
          validUntil: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createDemandForecast({
          id: nanoid(),
          ...input,
          generatedAt: new Date(),
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
