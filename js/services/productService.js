import APP_CONFIG from "../core/config.js";

// Cache to avoid repeated JSON fetches
let productsCache = null;
let categoriesCache = null;
let subcategoriesCache = null;

//Fetch products from JSON file
const fetchProducts = async () => {
  if (productsCache) {
    return productsCache;
  }

  try {
    const response = await fetch(APP_CONFIG.dataPaths.products);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    productsCache = await response.json();
    return productsCache;
  } catch (error) {
    console.error("Error fetching products:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

//  Fetch categories from JSON file
const fetchCategories = async () => {
  if (categoriesCache) {
    return categoriesCache;
  }

  try {
    const response = await fetch(APP_CONFIG.dataPaths.categories);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    categoriesCache = await response.json();
    return categoriesCache;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Fetch Subcategories from Json file
const fetchSubcategories = async () => {
  if (subcategoriesCache) {
    return subcategoriesCache;
  }

  try {
    const response = await fetch(APP_CONFIG.dataPaths.subcategories);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    subcategoriesCache = await response.json();
    return subcategoriesCache;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

//Get all products
export const getAllProducts = async () => {
  return await fetchProducts();
};

// Get single product by ID
export const getProductById = async (id) => {
  try {
    const products = await fetchProducts();
    // Convert both to string for comparison to handle type mismatch
    const product = products.find((p) => String(p.id) === String(id));
    return product || null;
  } catch (error) {
    console.error(`Error getting product ${id}:`, error);
    return null;
  }
};

//Get products by category
export const getProductsByCategory = async (categoryId) => {
  try {
    const products = await fetchProducts();
    if (!categoryId || categoryId === "all") {
      return products;
    }
    return products.filter((p) => String(p.categoryId) === String(categoryId));
  } catch (error) {
    console.error(`Error getting products for category ${categoryId}:`, error);
    return [];
  }
};

/**
 * Search products by query string
 * Searches in name, description, and category
 **/
export const searchProducts = async (loadedProducts = [], query) => {
  try {
    if (!query || query.trim() === "") {
      // return await getAllProducts();
      return [];
    }

    const products = loadedProducts || (await fetchProducts());
    const searchTerm = query.toLowerCase().trim();

    return products.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      //   const category = (product.category || "").toLowerCase();
      const tags = (product.tags || []).map((tag) => tag.toLowerCase());

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        //  || category.includes(searchTerm)
        tags.some((tag) => tag.includes(searchTerm))
      );
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

// Get products on sale
export const getProductsOnSale = async () => {
  try {
    const products = await fetchProducts();
    return products.filter((p) => p.discount && p.discount > 0);
  } catch (error) {
    console.error("Error getting sale products:", error);
    return [];
  }
};

// Sort products by criteria
export const sortProducts = (products, sortBy) => {
  if (!products || products.length === 0) return [];

  const sorted = [...products]; // Create copy to avoid mutation

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price-desc":
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "discount":
      return sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    case "name":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "rating":
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    default:
      return sorted;
  }
};

// Get all categories
export const getAllCategories = async () => {
  return await fetchCategories();
};

// Get all Subcategories
export const getAllSubcategories = async () => {
  return await fetchSubcategories();
};

//Get products by Subcategory
export const getProductsBySubcategory = async (subCategoryId) => {
  try {
    const products = await fetchProducts();
    if (!subCategoryId || subCategoryId === "all") {
      return products;
    }
    return products.filter(
      (p) => String(p.subCategoryId) === String(subCategoryId),
    );
  } catch (error) {
    console.error(
      `Error getting products for category ${subCategoryId}:`,
      error,
    );
    return [];
  }
};
