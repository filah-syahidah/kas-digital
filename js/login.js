import {
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-init.js";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const messageEl = document.getElementById("loginMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.textContent = "Memproses login...";

    try {
        await signInWithEmailAndPassword(
            auth,
            emailEl.value.trim(),
            passwordEl.value
        );
        window.location.href = "admin.html";
    } catch (error) {
        console.error("Login gagal:", error);
        messageEl.textContent = "Login gagal. Periksa email atau password.";
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "admin.html";
    }
});