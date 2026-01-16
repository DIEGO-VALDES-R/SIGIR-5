import { notifyOwner } from "./_core/notification";
import {
  getActiveAlerts,
  createNotificationLog,
  updateNotificationLog,
  getProductById,
  getPendingNotifications,
} from "./db";
import { nanoid } from "nanoid";

interface NotificationPayload {
  type: "low_stock" | "out_of_stock" | "expiring_soon" | "purchase_order";
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  expirationDate?: string;
  message: string;
}

/**
 * Envía notificación al propietario sobre alertas de inventario
 */
export async function sendAlertNotification(payload: NotificationPayload) {
  try {
    const title = `Alerta de Inventario: ${payload.productName}`;
    const content = `
${payload.message}

Detalles:
- Producto: ${payload.productName}
- Stock Actual: ${payload.currentStock} unidades
- Stock Mínimo: ${payload.minStock} unidades
${payload.expirationDate ? `- Fecha de Vencimiento: ${payload.expirationDate}` : ""}

Por favor, revisa el dashboard para más información.
    `.trim();

    // Registrar intento de notificación
    const logId = nanoid();
    await createNotificationLog({
      id: logId,
      type: payload.type,
      productId: payload.productId,
      title,
      content,
      status: "pending",
    });

    // Enviar notificación al propietario
    const success = await notifyOwner({ title, content });

    // Actualizar estado
    await updateNotificationLog(logId, {
      status: success ? "sent" : "failed",
      sentAt: success ? new Date() : undefined,
      errorMessage: success ? undefined : "Failed to send notification",
    });

    return { success, logId };
  } catch (error) {
    console.error("Error sending alert notification:", error);
    throw error;
  }
}

/**
 * Verifica alertas activas y envía notificaciones si es necesario
 */
export async function processActiveAlerts() {
  try {
    const alerts = await getActiveAlerts();

    for (const alert of alerts) {
      const product = await getProductById(alert.productId);
      if (!product) continue;

      const payload: NotificationPayload = {
        type: alert.type as any,
        productId: alert.productId,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        expirationDate: product.expirationDate
          ? new Date(product.expirationDate).toLocaleDateString()
          : undefined,
        message: alert.message,
      };

      await sendAlertNotification(payload);
    }

    return { processed: alerts.length };
  } catch (error) {
    console.error("Error processing active alerts:", error);
    throw error;
  }
}

/**
 * Reintenta enviar notificaciones pendientes
 */
export async function retryPendingNotifications() {
  try {
    const pending = await getPendingNotifications();

    for (const notification of pending) {
      try {
        const success = await notifyOwner({
          title: notification.title,
          content: notification.content,
        });

        await updateNotificationLog(notification.id, {
          status: success ? "sent" : "failed",
          sentAt: success ? new Date() : undefined,
          errorMessage: success ? undefined : "Retry failed",
        });
      } catch (error) {
        console.error(
          `Error retrying notification ${notification.id}:`,
          error
        );
      }
    }

    return { retried: pending.length };
  } catch (error) {
    console.error("Error retrying pending notifications:", error);
    throw error;
  }
}

/**
 * Envía notificación de orden de compra sugerida
 */
export async function sendPurchaseOrderSuggestion(
  productId: string,
  productName: string,
  suggestedQuantity: number,
  confidence: number,
  analysis: string
) {
  try {
    const title = `Sugerencia de Compra: ${productName}`;
    const content = `
Se recomienda realizar una orden de compra para ${productName}.

Detalles de la Recomendación:
- Cantidad Sugerida: ${suggestedQuantity} unidades
- Nivel de Confianza: ${confidence}%
- Análisis: ${analysis}

Esta recomendación se basa en el análisis predictivo del historial de consumo.
    `.trim();

    const logId = nanoid();
    await createNotificationLog({
      id: logId,
      type: "purchase_order",
      productId,
      title,
      content,
      status: "pending",
    });

    const success = await notifyOwner({ title, content });

    await updateNotificationLog(logId, {
      status: success ? "sent" : "failed",
      sentAt: success ? new Date() : undefined,
    });

    return { success, logId };
  } catch (error) {
    console.error("Error sending purchase order suggestion:", error);
    throw error;
  }
}
