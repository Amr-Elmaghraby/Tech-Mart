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
      subcategoryElement.href = `products.html?subcategory=${subcategory.id}`;

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
  const BASE_URL = window.location.origin;
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
