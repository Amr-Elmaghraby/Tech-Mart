import * as userService from "../services/userService.js";

export async function init() {
  const form = document.querySelector(".forgetPasword-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtns = document.querySelectorAll(".toggle-password");

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  var passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  // Toggle password visibility
  togglePasswordBtns.forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Get the parent container
      const parent = toggleBtn.closest(".password-group");

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

  // Live validation
  emailInput.addEventListener("input", () => {
    if (emailPattern.test(emailInput.value)) {
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
    if (passwordPattern.test(passwordInput.value)) {
      passwordInput.classList.add("valid");
      passwordInput.classList.remove("invalid");
      passwordError.textContent = "";
    } else {
      passwordInput.classList.add("invalid");
      passwordInput.classList.remove("valid");
      passwordError.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }
  });

  confirmPasswordInput.addEventListener("input", () => {
    if (passwordInput.value === confirmPasswordInput.value) {
      confirmPasswordInput.classList.add("valid");
      confirmPasswordInput.classList.remove("invalid");
      confirmPasswordError.textContent = "";
    } else {
      confirmPasswordInput.classList.add("invalid");
      confirmPasswordInput.classList.remove("valid");
      confirmPasswordError.textContent = "Passwords do not match";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!form || !emailInput || !passwordInput || !confirmPasswordInput) {
      return;
    }

    // Validation before submitting
    if (!emailPattern.test(email)) return;
    if (!passwordPattern.test(password)) return;
    if (password !== confirmPassword) return;

    //Reset Password
    const resetPasswordResponse = await userService.resetPassword(
      email,
      password,
    );
    if (!resetPasswordResponse.success) {
      console.error(resetPasswordResponse.message);
      return;
    }

    // Success
    alert("Password reset successful! You can now login.");
    window.location.replace("./login.html");
  });
}

// try {
//   const newUser = {
//     email: email,
//     password: password,
//     name: nameInput.value.trim(),
//   };
//   await userService.register(newUser);
//   window.location.replace("login.html");
// } catch (error) {
//   console.error("Error registering user:", error);
// }
