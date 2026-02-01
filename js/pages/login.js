import * as userService from "../services/userService.js";
import {updateUser} from "../components/header.js";

export async function init() {
  const BASE_URL = window.location.origin;

  const form = document.querySelector(".login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const loginError = document.getElementById("loginError");
  const togglePasswordBtn = document.querySelector(".toggle-password");

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  console.log("login page initialized");

  // Toggle password visibility
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.classList.toggle("fa-eye");
    togglePasswordBtn.classList.toggle("fa-eye-slash");
  });

  // Live validation
  emailInput.addEventListener("input", () => {
    if (emailPattern.test(emailInput.value.trim())) {
      emailInput.classList.add("valid");
      emailInput.classList.remove("invalid");
      emailError.textContent = "";
    } else {
      emailInput.classList.add("invalid");
      emailInput.classList.remove("valid");
      emailError.textContent = "Invalid email format";
    }
  });

  passwordInput.addEventListener("input", () => {
    if (passwordInput.value.length >= 8) {
      passwordInput.classList.add("valid");
      passwordInput.classList.remove("invalid");
      passwordError.textContent = "";
    } else {
      passwordInput.classList.add("invalid");
      passwordInput.classList.remove("valid");
      passwordError.textContent = "Password must be at least 8 characters";
    }
  });

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    // Validation
    if (!emailPattern.test(email)) return;
    if (password.length < 8) return;

    const existingUser = await userService.emailExists(email);

    if (!existingUser) {
      loginError.textContent = "Email or password is invalid";
      emailInput.classList.add("invalid");
      passwordInput.classList.add("invalid");
      return;
    }

    // Success login
   var response = await userService.login(email, password);

    if (!response.success) {
      loginError.textContent = response.message;
      emailInput.classList.add("invalid");
      passwordInput.classList.add("invalid");
      return;
    }
    // window.location.replace(`${BASE_URL}/index.html`); // Redirect to home

    history.replaceState(null, null, `${BASE_URL}/index.html`);
    window.location.reload();
    
  });

  await updateUser();
}
