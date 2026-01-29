import * as productService from "../services/productService.js";
export const initHeader = async () => {
  const subcategoriesSelector = document.querySelector(".category-select");
  if (!subcategoriesSelector) return;

  subcategoriesSelector.addEventListener("change", (event) => {});

  console.log("Header initialized");
  await renderSubcategories(subcategoriesSelector);

  initSearch();
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

//Search function
export const initSearch = () => {
  const categorySelect = document.querySelector(".category-select");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");
  const resultsContainer = document.querySelector(".search-results");

  if (!categorySelect || !searchInput || !searchBtn || !resultsContainer)
    return;

  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim().toLowerCase();
    const categoryId = categorySelect.value;

    // Get all products
    let products = await productService.getProductsBySubcategory(categoryId);
    let searchedproducts = await productService.searchProducts(products, query);

    // // Filter by category if selected
    // if (categoryId && categoryId !== "all") {
    //   products = products.filter(
    //     (p) => String(p.categoryId) === String(categoryId),
    //   );
    // }

    // // Filter by search query (name, description, tags)
    // if (query) {
    //   products = products.filter(
    //     (p) =>
    //       p.name.toLowerCase().includes(query) ||
    //       (p.description && p.description.toLowerCase().includes(query)) ||
    //       (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(query))),
    //   );
    // }

    if (
      searchInput.value.trim() == "" ||
      searchInput.value == null ||
      searchInput.value == undefined
    ) {
      resultsContainer.style.display = "none";
      return;
    }
    resultsContainer.style.display = "block";

    renderResults(searchedproducts, resultsContainer);

    console.log("Search results:", searchedproducts);
  });
};

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
    const li = document.createElement("li");
    li.innerHTML = `
        <a href="product.html?id=${product.id}">
          ${product.name} - $${product.price.toFixed(2)}
        </a>
      `;
    resultsContainer.appendChild(li);
  });
};
