import * as userService from "../services/userService.js";
import * as orderService from "../services/orderService.js";

let menuItems;
let forms;
let firstName;
let lastName;
let email;
let phone;
let userName;
let userEmail;
let activeForm;
let submitBtn;
let oldPasswordInput;
let newPasswordInput;
let confirmPasswordInput;
let togglePasswordBtns;
let passwordError;
let addressInput;
let avatarInput;
let userAvatar;
let orderList;
let noOrdersMsg;
const internationalPhoneRegex = /^\+?\d{1,3}[\s-]?\d{1,4}([\s-]?\d{2,4}){2,3}$/;
var passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
let currentUser;
const orders = [];

export async function init() {
  menuItems = document.querySelectorAll(".menu li");
  forms = document.querySelectorAll(".form");
  firstName = document.getElementById("firstName");
  lastName = document.getElementById("lastName");
  email = document.getElementById("email");
  phone = document.getElementById("phone");
  userName = document.querySelector(".user-info .user-name");
  userEmail = document.querySelector(".user-email");
  activeForm = document.querySelector(".form.active");
  submitBtn = activeForm.querySelector('button[type="submit"]');
  oldPasswordInput = document.getElementById("oldpassword");
  newPasswordInput = document.getElementById("newpassword");
  confirmPasswordInput = document.getElementById("confirmpassword");
  togglePasswordBtns = document.querySelectorAll(".toggle-password");
  passwordError = document.getElementById("passwordError");
  addressInput = document.querySelectorAll("#my-address textarea");
  avatarInput = document.getElementById("avatarInput");
  userAvatar = document.getElementById("userAvatar");
  orderList = document.getElementById("orderList");
  noOrdersMsg = document.getElementById("noOrdersMsg");

  submitBtn.classList.add("disabled");

  //Check if user is logged in
  const BASE_URL = window.location.origin;
  currentUser = await userService.getCurrentUser();

  if (!currentUser) {
    // If no user, redirect to login/index page
    history.replaceState(null, null, `${BASE_URL}/index.html`);
    window.location.reload();
  } else {
    await updateProfileData(currentUser);
    renderOrders(orders);
    updateProfileInfo();
  }

  if (!menuItems || !forms) return;

  menuItems.forEach((item) => {
    item.addEventListener("click", async () => {
      await updateProfileData(currentUser);
      renderOrders(orders);

      // Remove active class from all menu items
      menuItems.forEach((i) => i.classList.remove("active"));
      // Add active class to clicked item
      item.classList.add("active");

      // Hide all forms
      forms.forEach((f) => f.classList.remove("active"));
      // Show the form corresponding to clicked item
      const target = item.dataset.target;
      document.getElementById(target).classList.add("active");
      activeForm = document.getElementById(target);
      submitBtn = activeForm.querySelector('button[type="submit"]');
      console.log(target);

      if (target === "change-password") {
        submitBtn.classList.add("disabled");
        changePassword();
      } else if (target === "account-info") {
        submitBtn.classList.add("disabled");
        updateProfileInfo();
      } else if (target === "my-order") {
        submitBtn.classList.add("disabled");
         await renderOrders();
      } else if (target === "my-address") {
        submitBtn.classList.add("disabled");
        renderAddresses();
      }
    });
  });

  // Update avatar
  avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
      const base64Image = event.target.result;

      userAvatar.src = base64Image;

      try {
        const updatedUser = await userService.updateProfile({
          avatar: base64Image,
        });

        if (!updatedUser.success) throw new Error(updatedUser.message);

        console.log("Avatar updated ✅");
      } catch (err) {
        console.error(err);
        alert(err.message || "Failed to update avatar ❌");
      }
    };

    reader.readAsDataURL(file);

    window.location.reload();
  });
}

async function updateProfileData(currentUser) {
  firstName.value = currentUser.name.split(" ")[0] || "";
  lastName.value = currentUser.name.split(" ").slice(1).join(" ") || "";
  email.value = currentUser.email;
  email.classList.add("disabled");
  phone.value = currentUser.phone || "";

  userAvatar.src =
    currentUser.avatar || "../assets/images/users/default-avatar.png";
  userName.innerText =
    currentUser.name.split(" ")[0] + " " + currentUser.name.split(" ")[1] || "";
  userEmail.textContent = currentUser.email;
}

function changePassword() {
  // Change password form
  // Toggle password visibility

  togglePasswordBtns.forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Get the parent container
      const parent = toggleBtn.closest(".input-wrapper");

      // Get the input inside this parent only
      const input = parent.querySelector("input");

      // Toggle type
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      // Toggle icon
      toggleBtn.classList.toggle("fa-eye");
      toggleBtn.classList.toggle("fa-eye-slash");
    });
  });

  oldPasswordInput.addEventListener("input", () => {
    if (passwordPattern.test(oldPasswordInput.value)) {
      oldPasswordInput.classList.add("valid");
      oldPasswordInput.classList.remove("invalid");
      passwordError.textContent = "";
    } else {
      oldPasswordInput.classList.add("invalid");
      oldPasswordInput.classList.remove("valid");
      passwordError.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }
    if (
      passwordPattern.test(newPasswordInput.value) &&
      newPasswordInput.value === confirmPasswordInput.value &&
      passwordPattern.test(oldPasswordInput.value)
    ) {
      submitBtn.classList.remove("disabled");
    } else {
      console.log("Passwords do not match");
      submitBtn.classList.add("disabled");
    }
  });

  newPasswordInput.addEventListener("input", () => {
    if (passwordPattern.test(newPasswordInput.value)) {
      newPasswordInput.classList.add("valid");
      newPasswordInput.classList.remove("invalid");
      passwordError.textContent = "";
    } else {
      newPasswordInput.classList.add("invalid");
      newPasswordInput.classList.remove("valid");
      passwordError.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }
    if (
      passwordPattern.test(newPasswordInput.value) &&
      newPasswordInput.value === confirmPasswordInput.value &&
      passwordPattern.test(oldPasswordInput.value)
    ) {
      submitBtn.classList.remove("disabled");
    } else {
      submitBtn.classList.add("disabled");
    }
  });

  confirmPasswordInput.addEventListener("input", () => {
    if (newPasswordInput.value === confirmPasswordInput.value) {
      confirmPasswordInput.classList.add("valid");
      confirmPasswordInput.classList.remove("invalid");
      passwordError.textContent = "";
    } else {
      confirmPasswordInput.classList.add("invalid");
      confirmPasswordInput.classList.remove("valid");
      passwordError.textContent = "Passwords do not match";
    }
    if (
      passwordPattern.test(newPasswordInput.value) &&
      newPasswordInput.value === confirmPasswordInput.value &&
      passwordPattern.test(oldPasswordInput.value)
    ) {
      submitBtn.classList.remove("disabled");
    } else {
      console.log("Passwords do not match");
      submitBtn.classList.add("disabled");
    }
  });

  submitBtn.addEventListener("click", async () => {
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (passwordPattern.test(newPassword) && newPassword === confirmPassword) {
      try {
        const result = await userService.changePassword({
          oldPassword,
          newPassword,
        });

        if (!result.success) {
          alert(String(result.message));
          return;
        }

        passwordError.textContent = "";
        alert("Password changed successfully ✅");
        await userService.logout();

        window.location.href = "/pages/login.html";

        submitBtn.classList.add("disabled");
      } catch (err) {
        console.error("Change password error:", err);
        passwordError.textContent = "Something went wrong. Please try again.";
      }
    }
  });
}

function updateProfileInfo() {
  const originalName = currentUser.name.trim();
  const originalPhone = currentUser.phone;

  const inputs = [
    { el: firstName, type: "firstName", required: true },
    { el: lastName, type: "lastName", required: true },
    { el: phone, type: "phone", required: false },
  ];

  const checkChanges = () => {
    const newName = firstName.value.trim() + " " + lastName.value.trim();
    const newPhone = phone.value.trim();

    // Enable submit if name changed OR phone changed
    const changed =
      newName !== originalName || (newPhone && newPhone !== originalPhone);

    submitBtn.disabled = !changed;
    submitBtn.classList.toggle("disabled", !changed);
  };

  // Live validation
  inputs.forEach(({ el, type, required }) => {
    el.addEventListener("input", () => {
      const value = el.value.trim();
      let isValid = true;

      if (type === "phone" && value) {
        isValid = internationalPhoneRegex.test(value); // validation only if entered
      } else if (required) {
        isValid = value.length >= 3;
      }

      el.classList.toggle("valid", isValid);
      el.classList.toggle("invalid", !isValid);

      checkChanges();
    });
  });

  // Submit form
  activeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userName = firstName.value.trim() + " " + lastName.value.trim();
    const phonenumber = phone.value.trim();

    if (userName.length < 3) return; // name required
    if (phonenumber && !internationalPhoneRegex.test(phonenumber)) return; // phone optional

    const updates = { id: currentUser.id, name: userName };
    if (phonenumber) updates.phone = phonenumber; // update phone only if entered

    try {
      const updatedUser = await userService.updateProfile(updates);

      if (updatedUser.success) {
        submitBtn.disabled = true;
        submitBtn.classList.add("disabled");
        alert("Profile updated successfully ✅");
        window.location.reload();
      } else {
        throw new Error(updatedUser.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong ❌");
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
    }
  });
}

function renderAddresses() {
  if (!currentUser || !addressInput?.length) return;

  const addresses = currentUser.address || [];

  const addr1 = addresses[0] || "";
  const addr2 = addresses[1] || "";

  addressInput[0].value = addr1;
  addressInput[1].value = addr2;

  const checkChanges = () => {
    const changed =
      addressInput[0].value.trim() !== addr1 ||
      addressInput[1].value.trim() !== addr2;
    submitBtn.classList.toggle("disabled", !changed);
  };

  addressInput[0].addEventListener("input", checkChanges);
  addressInput[1].addEventListener("input", checkChanges);

  submitBtn.onclick = async () => {
    const main = addressInput[0].value.trim();
    const alt = addressInput[1].value.trim();

    try {
      const result = await userService.updateAddress([main, alt]);

      if (result.success) {
        alert("Address updated successfully ✅");
        submitBtn.classList.add("disabled");
        window.location.reload();
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong ❌");
    }
  };
}

async function renderOrders() {
  const orders = await orderService.getOrdersForCurrentUser();
  orderList.innerHTML = ""; 

  if (!orders || orders.length === 0) {
    noOrdersMsg.classList.remove("hidden");
    return;
  } else {
    noOrdersMsg.classList.add("hidden");
  }

  orders.forEach((order) => {
    const orderDiv = document.createElement("div");
    orderDiv.classList.add("order-card");

    orderDiv.innerHTML = `
      <div class="order-info">
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</p>
      </div>
      <div class="order-total">
        $${order.summary.total.toFixed(2)}
      </div>
    `;

    orderList.appendChild(orderDiv);
  });
}
