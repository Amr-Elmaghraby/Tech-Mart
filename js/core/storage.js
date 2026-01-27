
//Get Data form localStorage
export const get = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};


//Save Data form localStorage
export const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    // Check if quota exceeded
    if (error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded. Consider clearing old data.");
    }
    return false;
  }
};


//Remove Data form localStorage
export const remove = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};


//Clear Data form localStorage
export const clear = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};



//Check if localStorage is available
export const isAvailable = () => {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};
