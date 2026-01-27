import APP_CONFIG from "./config.js";

// Format price with currency symbol
export const formatPrice = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${APP_CONFIG.currencySymbol}0.00`;
  }
  return `${APP_CONFIG.currencySymbol}${parseFloat(amount).toFixed(2)}`;
};


 // Calculate discount percentage
export const calculateDiscount = (original, discounted) => {
  if (!original || !discounted || original <= discounted) return 0;
  return Math.round(((original - discounted) / original) * 100);
};


 // Format date to readable string
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


//Generate unique ID for entities
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};


//  Reander Header and Footer Partials
export async function loadPartial(id, file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const target = document.getElementById(id);
    if (target) target.innerHTML = html;
  } catch (e) {
    console.error(`Failed to load ${file}:`, e);
  }
}
