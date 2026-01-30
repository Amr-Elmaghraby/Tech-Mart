import * as productService from "../services/productService.js";

let subcategoriesSelector;
let searchInput;
let searchBtn;
let dropdown;
let suggestionsEl;
let searchHeader;
let searchbtn;
var query;
var categoryId;

export const initHeader = async () => {
  subcategoriesSelector = document.querySelector(".category-select");
  searchInput = document.querySelector(".search-input");
  dropdown = document.querySelector(".dropdown");
  suggestionsEl = document.querySelector(".suggestions");
  searchbtn = document.querySelector(".search-btn");
  searchHeader = document.querySelector(".keep-shopping h4");

  if (
    !subcategoriesSelector ||
    !searchInput ||
    !dropdown ||
    !suggestionsEl ||
    !searchHeader ||
    !searchbtn
  )
    return;

  // Load subcategories
  await renderSubcategories(subcategoriesSelector);

  // Initial placeholder
  updatePlaceholder();

  // Update on category change
  subcategoriesSelector.addEventListener("change", updatePlaceholder);

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
