// load header and footer partials
import { loadPartial } from "./core/utils.js";
import { initHeader } from "./components/header.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    //  Wait for partials to load BEFORE initializing
    await Promise.all([
      loadPartial("header", "../pages/partials/header.html"),
      loadPartial("footer", "../pages/partials/footer.html"),
    ]);

    console.log("✓ Partials loaded");

    // Now initialize header (DOM elements now exist)
    await initHeader();
    console.log("✓ Header initialized");

    // Then load page-specific code
    await loadPageModule(document.body.dataset.page);
    console.log("✓ Page module loaded:", document.body.dataset.page);
  } catch (error) {
    console.error("❌ Initialization failed:", error);
  }
});

// Dynamically load page-specific module
const loadPageModule = async (pageName) => {
  try {
    switch (pageName) {
      case "index":
        const page = await import("./pages/index.js");
        if (page.init) await page.init();
        break;

      case "products":
        const { initProductsPage } = await import("./pages/products.js");
        await initProductsPage();
        break;

      case "product-detail":
        const { initProductDetailPage } =
          await import("./pages/productDetail.js");
        await initProductDetailPage();
        break;

      case "cart":
        const { initCartPage } = await import("./pages/cart.js");
        await initCartPage();
        break;

      case "checkout":
        const { initCheckoutPage } = await import("./pages/checkout.js");
        await initCheckoutPage();
        break;

      default:
        console.log(`No specific initialization for page: ${pageName}`);
    }
  } catch (error) {
    console.error(`Error loading page module for ${pageName}:`, error);
  }
};
