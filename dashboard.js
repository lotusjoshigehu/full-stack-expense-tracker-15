// ---------- AUTH ----------
if (!localStorage.getItem("loggedIn")) {
    window.location.href = "login.html";
}

// ---------- SAMPLE DATA SOURCE ----------
// Later you will replace this with backend data
const expenses = JSON.parse(localStorage.getItem("expenses")) || [
    {
        amount: 500,
        description: "Milk",
        category: "Food",
        type: "expense",
        createdAt: new Date().toISOString()
    },
    {
        amount: 40000,
        description: "Salary",
        category: "Income",
        type: "income",
        createdAt: new Date().toISOString()
    }
];

const table = document.getElementById("reportTable");

// ---------- DATE HELPERS ----------
function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isThisWeek(date) {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return date >= start && date <= end;
}

function isThisMonth(date) {
    const now = new Date();
    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
}

// ---------- APPLY FILTER ----------
function applyFilter() {
    const type = document.getElementById("filterType").value;
    table.innerHTML = "";

    let filtered = [];

    if (type === "daily") {
        filtered = expenses.filter(e => isToday(new Date(e.createdAt)));
    }

    if (type === "weekly") {
        filtered = expenses.filter(e => isThisWeek(new Date(e.createdAt)));
    }

    if (type === "monthly") {
        filtered = expenses.filter(e => isThisMonth(new Date(e.createdAt)));
    }

    renderTable(filtered);
}

// ---------- RENDER TABLE ----------
function renderTable(data) {
    data.forEach(e => {
        table.innerHTML += `
            <tr>
                <td>${new Date(e.createdAt).toLocaleDateString()}</td>
                <td>${e.description}</td>
                <td>${e.category}</td>
                <td>${e.type === "income" ? e.amount : "-"}</td>
                <td>${e.type === "expense" ? e.amount : "-"}</td>
            </tr>
        `;
    });
}

// ---------- DOWNLOAD CSV (PREMIUM ONLY) ----------
const downloadBtn = document.getElementById("downloadBtn");
const isPremium = localStorage.getItem("isPremium") === "true";

if (!isPremium) {
    downloadBtn.disabled = true;
    downloadBtn.innerText = "Premium Only";
}

downloadBtn.addEventListener("click", () => {
    let csv = "Date,Description,Category,Type,Amount\n";

    expenses.forEach(e => {
        csv += `${e.createdAt},${e.description},${e.category},${e.type},${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
});

// ---------- DEFAULT LOAD ----------
applyFilter();
