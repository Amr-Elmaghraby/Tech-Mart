export const APP_CONFIG = {
  name: "Tech Mart",
  version: "1.0.0",
  currency: "USD",
  currencySymbol: "$",

  // Local storage keys to avoid conflicts
  storageKeys: {
    // cart: "techmart_cart",
    cart: "cart",
    buyNow: "buyNow",
    user: "techmart_user",
    session: "current_user",
    orders: "orders",
    wishlist: "techmart_wishlist",
  },

  // JSON data file paths
  dataPaths: {
    categories: "/data/categories.json",
    offers: "/data/offers.json",
    orders: "/data/orders.json",
    products: "/data/products.json",
    reviews: "/data/reviews.json",
    subcategories: "/data/subcategories.json",
    users: "/data/users.json",
  },

  // UI Configuration
  ui: {
    itemsPerPage: 12,
    notificationDuration: 3000, // milliseconds
    debounceDelay: 300,
  },

  // Tax and shipping
  pricing: {
    taxRate: 0.08, // 8%
    freeShippingThreshold: 100,
    shippingCost: 10,
  },
};

export default APP_CONFIG;
