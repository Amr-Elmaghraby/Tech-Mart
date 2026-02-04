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
        const indexPage = await import("./pages/index.js");
        if (indexPage.init) await indexPage.init();
        break;

      case "login":
        const loginPage = await import("./pages/login.js");
        if (loginPage.init) await loginPage.init();
        break;

      case "register":
        const registerPage = await import("./pages/register.js");
        if (registerPage.init) await registerPage.init();
        break;

      case "forget-password":
        const forgetPasswordPage = await import("./pages/forget-password.js");
        if (forgetPasswordPage.init) await forgetPasswordPage.init();
        break;

      case "profile":
        const profilePage = await import("./pages/profile.js");
        if (profilePage.init) await profilePage.init();
        break;

      case "product":
        const productPage = await import("./pages/product.js");
        if (productPage.init) await productPage.init();
        break;

      // case "product-detail":
      //   const { initProductDetailPage } =
      //     await import("./pages/productDetail.js");
      //   await initProductDetailPage();
      //   break;

      // case "cart":
      //   const { initCartPage } = await import("./pages/cart.js");
      //   await initCartPage();
      //   break;

      // case "checkout":
      //   const { initCheckoutPage } = await import("./pages/checkout.js");
      //   await initCheckoutPage();
      //   break;

      default:
        console.log(`No specific initialization for page: ${pageName}`);
    }
  } catch (error) {
    console.error(`Error loading page module for ${pageName}:`, error);
  }
};
