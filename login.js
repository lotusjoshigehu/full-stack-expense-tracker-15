document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.status === 200) {
        localStorage.setItem("loggedIn", true);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("isPremium", data.isPremium);
        window.location.href = "expense.html";
    } else {
        alert(data);
    }
});

function goToSignup() {
    window.location.href = "signup.html";
}


