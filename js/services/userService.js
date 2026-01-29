import APP_CONFIG from "../core/config.js";
import * as storage from "../core/storage.js";

const USER_KEY = APP_CONFIG.storageKeys.user;

let usersCache = null;

// Fetch users from JSON file
const fetchUsers = async () => {
  if (usersCache) {
    return usersCache;
  }

  try {
    const response = await fetch(APP_CONFIG.dataPaths.users);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    usersCache = await response.json();
    return usersCache;
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};


 //  user login
export const login = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      };
    }

    // Load users from JSON file
    const users = await fetchUsers();

    // Find matching user
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Remove password before storing session (security best practice)
    const { password: _, ...userWithoutPassword } = user;

    // Store only user session in localStorage
    const session = {
      ...userWithoutPassword,
      loginTime: new Date().toISOString(),
    };

    storage.set(USER_KEY, session);

    return {
      success: true,
      message: "Login successful",
      user: session,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "An error occurred during login",
    };
  }
};


 // Logout current user
export const logout = () => {
  try {
    storage.remove(USER_KEY);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};


// Get currently logged in user from session
export const getCurrentUser = () => {
  return storage.get(USER_KEY);
};



// Check if user is authenticated
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};


// Update user profile in session
export const updateProfile = (updates) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "No user logged in",
      };
    }

    // Merge updates with existing data
    const updatedUser = {
      ...currentUser,
      ...updates,
      // Prevent overwriting critical fields
      id: currentUser.id,
      email: currentUser.email,
      loginTime: currentUser.loginTime,
    };

    // Update session in localStorage
    storage.set(USER_KEY, updatedUser);

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "An error occurred while updating profile",
    };
  }
};


 // Register new user (simulation)
export const register = async (userData) => {
  try {
    const { email, password, name, phone } = userData;

    // Validate inputs
    if (!email || !password || !name) {
      return {
        success: false,
        message: "Email, password, and name are required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    // Validate password length
    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
      };
    }

    // Check if user already exists in JSON
    const users = await fetchUsers();
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return {
        success: false,
        message: "Email already registered",
      };
    }

    // Create new user session (not saved to JSON in this mock setup)
    const newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      name: name,
      phone: phone || "",
      role: "user",
      avatar: "../assets/images/users/default-avatar.png",
      wishlist: [],
      address: [],
      createdAt: new Date().toISOString(),
    };

    // Create session in localStorage
    const session = {
      ...newUser,
      loginTime: new Date().toISOString(),
    };

    storage.set(USER_KEY, session);

    return {
      success: true,
      message: "Registration successful",
      user: session,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "An error occurred during registration",
    };
  }
};


// Add item to user wishlist
export const addToWishlist = (productId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login to add to wishlist",
      };
    }

    const wishlist = currentUser.wishlist || [];

    // Check if already in wishlist
    if (wishlist.includes(productId)) {
      return {
        success: false,
        message: "Item already in wishlist",
      };
    }

    // Add to wishlist
    const updatedWishlist = [...wishlist, productId];

    return updateProfile({ wishlist: updatedWishlist });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};


 // Remove item from user wishlist
export const removeFromWishlist = (productId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login first",
      };
    }

    const wishlist = currentUser.wishlist || [];
    const updatedWishlist = wishlist.filter((id) => id !== productId);

    return updateProfile({ wishlist: updatedWishlist });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};


 // Get user wishlist
export const getWishlist = () => {
  const currentUser = getCurrentUser();
  return currentUser?.wishlist || [];
};


 // Add address to user profile
export const addAddress = (address) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login first",
      };
    }

    // Generate address ID
    const newAddress = {
      id: `addr-${Date.now()}`,
      ...address,
      isDefault: (currentUser.address || []).length === 0, // First address is default
    };

    const addresses = [...(currentUser.address || []), newAddress];

    return updateProfile({ address: addresses });
  } catch (error) {
    console.error("Error adding address:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};


 // Update address in user profile
 // Updates session only

export const updateAddress = (addressId, updates) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login first",
      };
    }

    const addresses = currentUser.address || [];
    const addressIndex = addresses.findIndex((addr) => addr.id === addressId);

    if (addressIndex === -1) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...updates,
    };

    return updateProfile({ address: addresses });
  } catch (error) {
    console.error("Error updating address:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};


 // Remove address from user profile
 // Updates session only
export const removeAddress = (addressId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login first",
      };
    }

    const addresses = (currentUser.address || []).filter(
      (addr) => addr.id !== addressId,
    );

    return updateProfile({ address: addresses });
  } catch (error) {
    console.error("Error removing address:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};

 // Set default address
export const setDefaultAddress = (addressId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Please login first",
      };
    }

    const addresses = (currentUser.address || []).map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    return updateProfile({ address: addresses });
  } catch (error) {
    console.error("Error setting default address:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
};


 // Get user addresses
export const getAddresses = () => {
  const currentUser = getCurrentUser();
  return currentUser?.address || [];
};


 // Get default address
export const getDefaultAddress = () => {
  const addresses = getAddresses();
  return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
};


 // Check if email exists in JSON file
export const emailExists = async (email) => {
  try {
    const users = await fetchUsers();
    return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};


 // Reset password (simulation)
export const resetPassword = async (email) => {
  try {
    if (!email) {
      return {
        success: false,
        message: "Email is required",
      };
    }

    const users = await fetchUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message:
          "If this email is registered, you will receive password reset instructions",
      };
    }

    // In real app, would generate token and send email
    return {
      success: true,
      message: "Password reset instructions sent to your email",
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      message: "An error occurred while resetting password",
    };
  }
};


 // Get user by ID from JSON file
export const getUserById = async (userId) => {
  try {
    const users = await fetchUsers();
    const user = users.find((u) => u.id === userId);

    if (user) {
      // Return without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    return null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
};
