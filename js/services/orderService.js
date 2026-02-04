import APP_CONFIG from "../core/config.js";
import * as userService from "../services/userService.js";
import * as storage from "../core/storage.js";

export async function getOrdersForCurrentUser() {
  const currentUser =await userService.getCurrentUser();
  if (!currentUser) return [];

  const orders = await storage.get(APP_CONFIG.storageKeys.orders);
  if (!orders) return [];

  try {
    return orders.filter(
      (order) => order.billingDetails.email === currentUser.email,
    );
  } catch (err) {
    console.error("Error parsing orders from storage", err);
    return [];
  }
}
