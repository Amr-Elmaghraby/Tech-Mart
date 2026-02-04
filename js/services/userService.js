import APP_CONFIG from "../core/config.js";
import * as storage from "../core/storage.js";

const USER_KEY = APP_CONFIG.storageKeys.user; // Array of all registered users
const SESSION_KEY = APP_CONFIG.storageKeys.session; // Logged-in session

// let usersCache = null;

// Fetch users from JSON file
export const fetchUsers = async () => {
  try {
    const users = storage.get(USER_KEY);

    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("Error fetching users:", error);
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

    storage.set(SESSION_KEY, session);

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
    storage.remove(SESSION_KEY);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

// Get currently logged in user from session
export const getCurrentUser = () => {
  return storage.get(SESSION_KEY);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

// Update user profile in session
export const updateProfile = (updates) => {
  try {
    const currentUser = storage.get(SESSION_KEY);
    if (!currentUser) {
      return { success: false, message: "No user logged in" };
    }

    const sessionUser = {
      ...currentUser,
      ...updates,
      id: currentUser.id,
      email: currentUser.email,
      loginTime: currentUser.loginTime,
    };
    delete sessionUser.password;

    storage.set(SESSION_KEY, sessionUser);

    const users = storage.get(USER_KEY) || [];
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        ...updates,
      };
      storage.set(USER_KEY, users);
    }

    return {
      success: true,
      message: "Profile updated successfully",
      user: sessionUser,
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
    const { email, password, name, phone = "" } = userData;

    // 1️⃣ Validate inputs
    if (!email || !password || !name) {
      return {
        success: false,
        message: "Email, password, and name are required",
      };
    }

    // 2️⃣ Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    // 3️⃣ Validate password
    const passwordPattern =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordPattern.test(password)) {
      return {
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      };
    }

    // 4️⃣ Get existing users from localStorage
    let users = JSON.parse(localStorage.getItem(USER_KEY)) || [];

    // 5️⃣ Check if email already exists
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    // 6️⃣ Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      password,
      name,
      phone,
      role: "user",
      avatar: "../assets/images/users/default-avatar.png",
      wishlist: [],
      address: [],
      createdAt: new Date().toISOString(),
    };

    // 7️⃣ Save new user in users list
    users.push(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(users));

    // // 8️⃣ Create session for logged-in user
    // const session = { ...newUser, loginTime: new Date().toISOString() };
    // localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, message: "Registration successful", user: session };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "An error occurred during registration" };
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

export const updateAddress = (updatedAddresses) => {
  try {
    const sessionUser = storage.get(SESSION_KEY);
    if (!sessionUser) {
      return { success: false, message: "Please login first" };
    }

    const users = storage.get(USER_KEY) || [];
    const userIndex = users.findIndex((u) => u.id === sessionUser.id);

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    users[userIndex].address = updatedAddresses;

    const newSessionUser = { ...sessionUser, address: updatedAddresses };
    delete newSessionUser.password;

    storage.set(USER_KEY, users);
    storage.set(SESSION_KEY, newSessionUser);

    return {
      success: true,
      message: "Addresses updated",
      user: newSessionUser,
    };
  } catch (error) {
    console.error("Error updating addresses:", error);
    return { success: false, message: "An error occurred" };
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
export const resetPassword = async (email, newPassword) => {
  try {
    if (!email || !newPassword) {
      return {
        success: false,
        message: "Email and new password are required",
      };
    }

    // Fetch all users
    const users = await fetchUsers();

    // Find user by email
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (userIndex === -1) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: "If this email is registered, the password has been reset",
      };
    }

    // Update the password
    users[userIndex].password = newPassword;

    // Save back to localStorage
    storage.set(USER_KEY, users);
    // localStorage.setItem(USER_KEY, JSON.stringify(users));

    return {
      success: true,
      message: "Password has been reset successfully",
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

export const changePassword = ({ oldPassword, newPassword }) => {
  try {
    const sessionUser = storage.get(SESSION_KEY);
    if (!sessionUser) {
      return { success: false, message: "No user logged in" };
    }

    const users = storage.get(USER_KEY) || [];
    const userIndex = users.findIndex((u) => u.id === sessionUser.id);

    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    const realUser = users[userIndex];

    if (realUser.password !== oldPassword) {
      return { success: false, message: "Old password is incorrect" };
    }

    // if (oldPassword === newPassword) {
    //   return { success: false, message: "New password must be different" };
    // }

    users[userIndex] = {
      ...realUser,
      password: newPassword,
    };
    storage.set(USER_KEY, users);

    const newSessionUser = { ...sessionUser };
    delete newSessionUser.password;
    storage.set(SESSION_KEY, newSessionUser);

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      message: "An error occurred while changing password",
    };
  }
};

