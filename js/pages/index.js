import * as productService from "../services/productService.js";
const subcategoriesContainer = document.querySelector(".categories-links");
const categoriesContainer = document.querySelector(".product-page");

const productsContainer = document.getElementById("productsContainer");
const phoneproductsContainer = document.getElementById(
  "phoneproductsContainer",
);
const laptopbsproductsContainer = document.getElementById(
  "laptopbsproductsContainer",
);

const bestseller = document.getElementById("bestseller");
const popular = document.getElementById("popular");
const BASE_URL = window.location.origin;

export async function init() {
  console.log("Home page initialized");

  renderSlider();
  await renderSubcategories();
  await renderTopCategories();
  // await renderTopdiscounts();
  await renderTopProducts("discount", productsContainer);
  await renderTopRatedProductsByCategory("cat-002", phoneproductsContainer);
  await renderTopRatedProductsByCategory("cat-001", laptopbsproductsContainer);

  if (!bestseller || !popular) return;
  const setActiveTab = (active, inactive) => {
    active.classList.add("navigation__tab--active");
    inactive.classList.remove("navigation__tab--active");
  };

  bestseller.addEventListener("click", async () => {
    await renderTopProducts("discount", productsContainer);

    console.log("bestseller clicked");
    setActiveTab(bestseller, popular);
  });

  popular.addEventListener("click", async () => {
    await renderTopProducts("reviewCount", productsContainer);

    console.log("popular clicked");
    popular.classList.add("navigation__tab--active");
    setActiveTab(popular, bestseller);
  });
}

//get all subcategories
async function renderSubcategories() {
  if (!subcategoriesContainer) return;

  try {
    const subcategories = await productService.getAllSubcategories();

    subcategoriesContainer.innerHTML = "";

    subcategories.forEach((subcategory) => {
      const subcategoryElement = document.createElement("a");
      subcategoryElement.classList.add("subcategory");
      subcategoryElement.textContent = subcategory.name;
      subcategoryElement.href = `${BASE_URL}/pages/product.html?categoryId=${subcategory.categoryId}`;

      subcategoriesContainer.appendChild(subcategoryElement);
    });
  } catch (error) {
    console.error("Error loading subcategories:", error);
  }
}

//get all Top categories
async function renderTopCategories() {
  if (!categoriesContainer) return;

  try {
    const categories = await productService.getAllCategories();

    categories.slice(0, 5).forEach((category) => {
      console.log(category.name);
      const categoryElement = document.createElement("a");
      const categoryImage = document.createElement("img");
      const categoryTitle = document.createElement("p");
      categoryElement.classList.add("categories-card");
      categoryTitle.classList.add("categories-card__name");
      categoryTitle.textContent = category.name;
      categoryImage.src = category.image;
      categoryElement.appendChild(categoryImage);
      categoryElement.appendChild(categoryTitle);

      categoryElement.href = `products.html?category=${category.id}`;
      categoriesContainer.appendChild(categoryElement);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function renderTopdiscounts() {
  if (!subcategoriesContainer) return;
  try {
    //Get products with discounts
    const products =
      await productService.getProductsBySubcategory("subcat-006"); //phones
    //sort products by discount amount
    const topDiscounts = await productService.sortProducts(
      products,
      "discount",
    );
    const product = topDiscounts[0];

    if (!product) return;

    // Create link
    const productElement = document.createElement("a");
    productElement.classList.add("top-discount-product");
    productElement.href = `product.html?id=${product.id}`;
    productElement.textContent = `${product.name} - ${product.discount}% OFF`;

    // 5Add image (first image only)
    product.images.forEach((imgUrl) => {
      // const imgElement = document.createElement("img");
      // imgElement.src = imgUrl;
      // imgElement.alt = product.name;
      // productElement.appendChild(imgElement);
    });

    subcategoriesContainer.appendChild(productElement);
  } catch (error) {
    console.error("Error loading top discounts:", error);
  }
}

//render top rated products
async function renderTopProducts(query, container) {
  if (!container) return;
  container.innerHTML = "";
  try {
    //Get all products
    const products = await productService.getAllProducts();
    //sort products by rating
    const topRatedProducts = await productService.sortProducts(products, query);
    topRatedProducts.slice(0, 10).forEach((product) => {
      displayProducts(product, container);
    });
    setupCarouselButtons();
  } catch (error) {
    console.error("Error loading top rated products:", error);
  }
}

async function renderTopRatedProductsByCategory(categoryId, container) {
  if (!container) return;
  try {
    //Get all products
    const products = await productService.getProductsByCategory(categoryId);

    //sort products by rating
    const topRatedProducts = await productService.sortProducts(
      products,
      "reviewCount",
    );
    topRatedProducts.slice(0, 15).forEach((product) => {
      displayProducts(product, container);
    });
    setupCarouselButtons();
  } catch (error) {
    console.error("Error loading top rated products:", error);
  }
}

function setupCarouselButtons() {
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel__track");
    const next = carousel.querySelector(".carousel__button--next");
    const prev = carousel.querySelector(".carousel__button--prev");

    if (!track || !next || !prev) return;

    const getScrollAmount = () => {
      const card = track.querySelector(".product-card");
      if (!card) return 0;

      const gap = parseInt(getComputedStyle(track).gap) || 0;
      return card.offsetWidth + gap;
    };

    const updateButtons = () => {
      const max = track.scrollWidth - track.clientWidth;

      next.disabled = track.scrollLeft <= 1;
      prev.disabled = track.scrollLeft >= max - 1;
    };

    prev.addEventListener("click", () => {
      track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
    });

    track.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    requestAnimationFrame(updateButtons);
  });
}

setupCarouselButtons();

function displayProducts(product, container) {
  const productCard = createProductCard(product);
  container.appendChild(productCard);
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  const hasDiscount = product.discount > 0 && product.originalPrice;
  let imagePath = product.thumbnail;
  if (typeof imagePath === "string") {
    imagePath = imagePath;
  } else if (Array.isArray(imagePath)) {
    imagePath = imagePath[0];
  }
  card.innerHTML = `
  ${
    hasDiscount
      ? `
    <div class="badge">
    <span class="badge__label">SAVE</span>
    <span class="badge__price">$${(product.originalPrice - product.price).toFixed(2)}</span>
    </div>
    `
      : ""
  }
  <div class="product-card__image-container">
  <img class="product-card__image"
  src="${imagePath}"
  alt="${product.name}"
  onerror="this.src='placeholder.png'">
  </div>
  <div class="product-card__reviews">(${product.reviewCount})</div>
  <h3 class="product-card__title">${product.name}</h3>
  <div class="product-card__price">
  ${
    hasDiscount
      ? `
    <span class="product-card__price-new">$${product.price.toFixed(2)}</span>
    <span class="product-card__price-original">$${product.originalPrice.toFixed(2)}</span>
    `
      : `
    <span class="product-card__price-current">$${product.price.toFixed(2)}</span>
    `
  }
  </div>
  <div class="product-card__shipping">
  <span class="product-card__shipping--free">FREE SHIPPING</span>
  ${Math.random() > 0.5 ? '<span class="gift-tag">FREE GIFT</span>' : ""}
  </div>
  <div class="status ${product.stock > 0 ? "status--in-stock" : "status--out-of-stock"}">
  <span class="status__indicator"></span>
  ${product.stock > 0 ? "In stock" : "Out of stock"}
  </div>
  `;

  card.addEventListener("click", () => {
    window.location.href = `${BASE_URL}/pages/single-product.html?productId=${product.id}`;
  });
  return card;
}

function renderSlider() {
  const HeroSlider = {
    currentSlide: 0,
    totalSlides: 3,
    direction: 1, // for autoplay only

    init() {
      this.track = document.querySelector(".slider__track");
      this.dots = document.querySelectorAll(".slider__dot");
      this.prevBtn = document.querySelector(".slider__arrow--prev");
      this.nextBtn = document.querySelector(".slider__arrow--next");

      if (!this.track) return;

      this.attachEvents();
      this.updateDots();
      this.startAutoPlay();
    },

    attachEvents() {
      // ⬅ LEFT arrow (circular)
      this.prevBtn?.addEventListener("click", () => {
        this.goToSlide(
          (this.currentSlide - 1 + this.totalSlides) % this.totalSlides,
        );
      });

      // ➡ RIGHT arrow (circular)
      this.nextBtn?.addEventListener("click", () => {
        this.goToSlide((this.currentSlide + 1) % this.totalSlides);
      });

      // Dots
      this.dots.forEach((dot, index) => {
        dot.addEventListener("click", () => this.goToSlide(index));
      });

      // Keyboard (same as arrows)
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") this.prevBtn.click();
        if (e.key === "ArrowRight") this.nextBtn.click();
      });
    },

    // 🔁 AUTOPLAY ONLY (ping-pong)
    autoMove() {
      if (this.currentSlide === this.totalSlides - 1) {
        this.direction = -1;
      } else if (this.currentSlide === 0) {
        this.direction = 1;
      }

      this.currentSlide += this.direction;
      this.applyTransform();
    },

    goToSlide(index) {
      this.currentSlide = index;
      this.applyTransform();
      this.resetAutoPlay();
    },

    applyTransform() {
      const offset = -(this.currentSlide * (100 / this.totalSlides));
      this.track.style.transform = `translateX(${offset}%)`;
      this.updateDots();
    },

    updateDots() {
      this.dots.forEach((dot, index) =>
        dot.classList.toggle(
          "slider__dot--active",
          index === this.currentSlide,
        ),
      );
    },

    startAutoPlay() {
      this.autoPlayInterval = setInterval(() => {
        this.autoMove();
      }, 4000);
    },

    resetAutoPlay() {
      clearInterval(this.autoPlayInterval);
      this.startAutoPlay();
    },
  };

  // Safe init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => HeroSlider.init());
  } else {
    HeroSlider.init();
  }

  window.HeroSlider = HeroSlider;
}

// ===================================
// DEALS OF THE DAY
// ===================================

console.log("Deals JS loaded");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDeals);
} else {
  initDeals();
}

function initDeals() {
  console.log("Initializing deals...");

  const countdownElements = document.querySelectorAll(".countdown-unit");
  const timerBlocks = document.querySelectorAll(".timer-block");
  const thumbnails = document.querySelectorAll(".thumbnail-item");
  const mainImage = document.querySelector(".deals-main__image img");

  console.log("Countdown elements:", countdownElements.length);
  console.log("Timer blocks:", timerBlocks.length);
  console.log("Thumbnails:", thumbnails.length);
  console.log("Main image found:", mainImage ? "Yes" : "No");

  // Always call these functions
  startCountdown();
  setupThumbnails();
  setupProgressBar();

  console.log("✓ Deals section initialized");
}

function startCountdown() {
  console.log("Starting countdown timer...");

  const now = new Date();
  const endDate = new Date(
    now.getTime() +
      162 * 24 * 60 * 60 * 1000 + // 162 days
      9 * 60 * 60 * 1000 + // 9 hours
      32 * 60 * 1000 + // 32 minutes
      4 * 1000, // 4 seconds
  );

  console.log("Countdown will end at:", endDate);

  updateTimers(endDate);
  setInterval(() => updateTimers(endDate), 1000);
}

function updateTimers(endDate) {
  const now = new Date().getTime();
  const distance = endDate.getTime() - now;

  if (distance < 0) {
    console.log("Countdown expired");
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Update product countdown (d, h, m, s)
  const countdownUnits = document.querySelectorAll(".countdown-unit");
  if (countdownUnits.length >= 4) {
    const numbers = countdownUnits[0].querySelectorAll(".countdown-number");
    if (numbers.length > 0) {
      countdownUnits[0].querySelector(".countdown-number").textContent = days;
      countdownUnits[1].querySelector(".countdown-number").textContent = hours;
      countdownUnits[2].querySelector(".countdown-number").textContent =
        minutes;
      countdownUnits[3].querySelector(".countdown-number").textContent =
        seconds;
    }
  }

  // Update header timer (DAYS, HOURS, MINS, SECS)
  const timerBlocks = document.querySelectorAll(".timer-block");
  if (timerBlocks.length >= 4) {
    const values = timerBlocks[0].querySelectorAll(".timer-value");
    if (values.length > 0) {
      timerBlocks[0].querySelector(".timer-value").textContent = days;
      timerBlocks[1].querySelector(".timer-value").textContent = hours;
      timerBlocks[2].querySelector(".timer-value").textContent = minutes;
      timerBlocks[3].querySelector(".timer-value").textContent = seconds;
    }
  }
}

function setupThumbnails() {
  console.log("Setting up thumbnail switcher...");

  const thumbnails = document.querySelectorAll(".thumbnail-item");
  const mainImage = document.querySelector(".deals-main__image img");

  if (!mainImage) {
    console.log("Main image not found");
    return;
  }

  if (thumbnails.length === 0) {
    console.log("No thumbnails found");
    return;
  }

  // Store the currently locked image
  let lockedImageSrc = mainImage.src;
  let isHovering = false;

  // Add transition to main image
  mainImage.style.transition = "opacity 0.2s ease";

  thumbnails.forEach((thumbnail, index) => {
    const thumbImg = thumbnail.querySelector("img");
    if (!thumbImg) return;

    // HOVER - Preview image immediately
    thumbnail.addEventListener("mouseenter", function () {
      isHovering = true;
      console.log("Hovering thumbnail:", index);

      // Change image instantly (no fade on hover)
      mainImage.src = thumbImg.src;
    });

    // MOUSE LEAVE - Return to locked image
    thumbnail.addEventListener("mouseleave", function () {
      isHovering = false;
      console.log("Left thumbnail:", index);

      // Return to locked image if not active
      if (!this.classList.contains("thumbnail-item--active")) {
        mainImage.src = lockedImageSrc;
      }
    });

    // CLICK - Lock this image as selected
    thumbnail.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Thumbnail clicked and locked:", index);

      // Remove active from all
      thumbnails.forEach((t) => t.classList.remove("thumbnail-item--active"));

      // Add active to this one
      this.classList.add("thumbnail-item--active");

      // Lock this image as the selected one
      lockedImageSrc = thumbImg.src;
      mainImage.src = lockedImageSrc;
    });
  });

  console.log("✓ Thumbnails ready (hover enabled)");
}

function setupProgressBar() {
  console.log("Setting up progress bar...");

  const progressBar = document.querySelector(".progress-bar__fill");

  if (!progressBar) {
    console.log("Progress bar not found");
    return;
  }

  const targetWidth = progressBar.style.width || "38%";
  progressBar.style.width = "0%";
  progressBar.style.transition = "width 1s ease";

  setTimeout(() => {
    progressBar.style.width = targetWidth;
    console.log("✓ Progress bar animated to:", targetWidth);
  }, 500);
}
