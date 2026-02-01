import * as productService from "../services/productService.js";
import { formatPrice } from "../core/utils.js";
import { getCartItemCount, getCartSubtotal } from "../services/cartService.js";
import { isAuthenticated, getCurrentUser, logout } from "../services/userService.js";

let subcategoriesSelector;
let searchInput;
let dropdown;
let suggestionsEl;
let searchHeader;
let searchbtn;
let cartbadge;
let carttotalAmount;
let cartwrapper;
let welcomeLabel;
let userName;
let userImage;
let usericonwrapper;
let userWrapper;
let profileMenu;
var query;
var categoryId;

export const initHeader = async () => {
  subcategoriesSelector = document.querySelector(".category-select");
  searchInput = document.querySelector(".search-input");
  dropdown = document.querySelector(".dropdown");
  suggestionsEl = document.querySelector(".suggestions");
  searchbtn = document.querySelector(".search-btn");
  searchHeader = document.querySelector(".keep-shopping h4");
  cartbadge = document.querySelector(".cart-badge");
  carttotalAmount = document.querySelector(".cart-amount");
  cartwrapper = document.querySelector(".cart-icon-wrapper");
  welcomeLabel = document.querySelector(".welcome-label");
  userName = document.querySelector(".user-name");
  userImage = document.querySelector(".user-image");
  usericonwrapper = document.querySelector(".user-icon-wrapper");
  userWrapper = document.querySelector(".user-wrapper");
  profileMenu = document.querySelector(".profile-menu");

  if (
    !subcategoriesSelector ||
    !searchInput ||
    !dropdown ||
    !suggestionsEl ||
    !searchHeader ||
    !searchbtn ||
    !cartbadge ||
    !carttotalAmount ||
    !cartwrapper ||
    !welcomeLabel ||
    !userName ||
    !userImage ||
    !usericonwrapper ||
    !userWrapper ||
    !profileMenu
  )
    return;

  // Load subcategories
  await renderSubcategories(subcategoriesSelector);

  //Load cart badge
  await updateCartBadge();

  //Load user
  await updateUser();

  // Initial placeholder
  updatePlaceholder();

  // Update on category change
  subcategoriesSelector.addEventListener("change", async () => {
    searchHeader.textContent = `Keep shopping for ${subcategoriesSelector.options[subcategoriesSelector.selectedIndex]?.text}`;
    updatePlaceholder();
    query = searchInput.value.trim().toLowerCase();
    categoryId = subcategoriesSelector.value;
    search(query, categoryId);
  });

  searchbtn.addEventListener("click", async () => {
    query = searchInput.value.trim().toLowerCase();
    categoryId = subcategoriesSelector.value;
    search(query, categoryId);
  });

  await initSearch();
};

// Update placeholder
const updatePlaceholder = () => {
  const selectedText =
    subcategoriesSelector.options[subcategoriesSelector.selectedIndex]?.text ||
    "all categories";

  searchInput.placeholder = `Search in ${selectedText}...`;
};

export async function updateCartBadge() {
  var itemCount = await getCartItemCount();
  if (itemCount > 0) {
    cartbadge.classList.remove("hidden");
    cartwrapper.classList.remove("disabled");
    cartbadge.classList.add("bump");
    setTimeout(() => cartbadge.classList.remove("bump"), 300);

    //Load cart badge
    cartbadge.textContent = itemCount;
  } else {
    cartbadge.classList.add("hidden");
    cartwrapper.classList.add("disabled");
  }

  //Load cart total amount
  carttotalAmount.textContent = formatPrice(await getCartSubtotal());
}

export async function updateUser() {
  const authStatus = await isAuthenticated(); // rename variable
  if (authStatus) {
    const user = await getCurrentUser();
    welcomeLabel.classList.remove("hidden");
    userName.textContent = user.name;
    // Show user image
    userImage.src = user.avatar || ""; // set image URL
    userImage.classList.remove("hidden");

    // Hide default icon
    usericonwrapper.classList.add("hidden");

    userWrapper.addEventListener("click", (e) => {
      if (!user) return;
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      profileMenu.classList.add("hidden");
    });

    userImage.addEventListener("click", (e) => {
            if (!user) return;
            e.stopPropagation();
            profileMenu.classList.toggle("hidden");
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to logout?");
      if (!confirmed) return;

      try {
        await logout();
        location.href = "/index.html";
      } catch (err) {
        console.error("Logout failed:", err);
        alert("Something went wrong while logging out. Try again.");
      }
    });

  } else {
    welcomeLabel.classList.add("hidden");
    // Hide user image
    userImage.classList.add("hidden");
    // Show default icon
    usericonwrapper.classList.remove("hidden");
  }
}

/* Click outside of dropdown */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-category-wrapper")) {
    dropdown.classList.add("hidden");
  }
});

//Search function
export const initSearch = async () => {
  searchInput.addEventListener("input", async () => {
    query = searchInput.value.trim().toLowerCase();
    categoryId = subcategoriesSelector.value;

    await search(query, categoryId);
  });
};

async function search(query, categoryId) {
  // Get all products
  let products = await productService.getProductsBySubcategory(categoryId);
  let searchedproducts = await productService.searchProducts(products, query);

  if (
    searchInput.value.trim() == "" ||
    searchInput.value == null ||
    searchInput.value == undefined
  ) {
    dropdown.classList.add("hidden");
    return;
  }
  dropdown.classList.remove("hidden");

  renderResults(searchedproducts, suggestionsEl);
}

// Render search results
const renderResults = (searchedproducts, resultsContainer) => {
  resultsContainer.innerHTML = "";

  if (searchedproducts.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No products found.";
    resultsContainer.appendChild(li);
    return;
  }

  searchedproducts.forEach((product) => {
    const BASE_URL = window.location.origin;
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${BASE_URL}/pages/single-product.html?productId=${product.id}" class="search-result-item">
        <img src="${product.thumbnail || "default-product.png"}" alt="${product.name}" class="result-image" />
        <div class="result-info">
          <h4 class="result-name">${product.name}</h4>
          <p class="result-brand">${product.brand || "Unknown Brand"}</p>
          <p class="result-price">$${product.price.toFixed(2)}</p>
        </div>
      </a>
    `;
    resultsContainer.appendChild(li);
  });
};

// Render subcategories
async function renderSubcategories(selector) {
  try {
    const defaultOption = document.createElement("option");
    defaultOption.value = "all";
    defaultOption.textContent = "All Categories";
    selector.appendChild(defaultOption);

    const subcategories = await productService.getAllSubcategories();

    subcategories.forEach((subcategory) => {
      const subcategoryElement = document.createElement("option");
      subcategoryElement.value = subcategory.id;
      subcategoryElement.textContent = subcategory.name;
      selector.appendChild(subcategoryElement);
    });
  } catch (error) {
    console.error("Error loading subcategories:", error);
  }
}
