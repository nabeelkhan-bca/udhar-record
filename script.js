let data = [];

// ADD ENTRY
function addEntry() {
    const e = {
        id: Date.now(),
        customer: document.getElementById("customer").value,
        mobile: document.getElementById("mobile").value,
        date: document.getElementById("date").value,
        amount: Number(document.getElementById("amount").value),
        type: document.getElementById("type").value,
        note: document.getElementById("note").value,
    };

    if (!e.customer || !e.date || !e.amount) {
        alert("Customer, Date & Amount required!");
        return;
    }

    data.push(e);

    document.getElementById("customer").value = "";
    document.getElementById("mobile").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";

    renderList();
}

// RENDER LIST
function renderList() {
    const search = document.getElementById("search").value.toLowerCase();
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;

    let filtered = data.filter((e) => {
        const match =
            e.customer.toLowerCase().includes(search) ||
            e.mobile.includes(search);

        const d = new Date(e.date).getTime();
        const f = from ? new Date(from).getTime() : 0;
        const t = to ? new Date(to).getTime() : Infinity;

        return match && d >= f && d <= t;
    });

    let html = "";
    let balance = 0;

    filtered.forEach((e) => {
        balance += e.type === "credit" ? e.amount : -e.amount;

        html += `
            <div class="entry">
                <strong>${e.customer}</strong><br>
                📅 ${e.date}<br>
                📞 ${e.mobile}<br>
                📝 ${e.note || "—"}<br>
                <span class="amount ${e.type}">
                    ${e.type === "credit" ? "+" : "-"} ₹${e.amount}
                </span>
            </div>
        `;
    });

    document.getElementById("entryList").innerHTML = html;
    document.getElementById("balanceAmount").innerText = "₹" + balance;
}

// PRINT REPORT (Pro)
function printReport() {
    window.print();
}

// EXPORT JSON
function exportJson() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "udhar-report.json";
    a.click();
}
