// Database
let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveDB() {
    localStorage.setItem("entries", JSON.stringify(entries));
}

// Perfect Balance Calculation
function getBalance(customer) {
    let bal = 0;

    entries
        .filter(e => e.customer === customer)
        .forEach(e => {
            if (e.type === "pay") bal += Number(e.amount);
            if (e.type === "receive") bal -= Number(e.amount);
        });

    return bal;
}

// Save New Entry
document.getElementById("entryForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let entry = {
        id: Date.now(),
        date: document.getElementById("date").value,
        customer: document.getElementById("customer").value.trim(),
        mobile: document.getElementById("mobile").value.trim(),
        type: document.getElementById("type").value,
        amount: Number(document.getElementById("amount").value),
        remark: document.getElementById("remark").value
    };

    entries.push(entry);
    saveDB();
    renderEntries();
    this.reset();
});

// Render Entries
function renderEntries(list = entries) {
    let box = document.getElementById("entriesBox");
    box.innerHTML = "";

    list.forEach(e => {
        let bal = getBalance(e.customer);

        let card = document.createElement("div");
        card.className = "entry-card";

        card.innerHTML = `
            <div class="entry-top">
                <div><b>${e.customer}</b> (${e.mobile || "—"})</div>
                <div class="date">${e.date}</div>
            </div>
            
            <div class="entry-middle">
                <span class="${e.type}">${e.type.toUpperCase()}</span>
                <span class="amount">₹${e.amount}</span>
            </div>

            <div class="remark">📝 ${e.remark || "No remark"}</div>

            <div class="bal">Balance: ₹${bal}</div>

            <button class="payNowBtn" onclick="openPayNow('${e.customer}')">Pay Now</button>
        `;

        box.appendChild(card);
    });
}

// Pay Now Button
function openPayNow(customer) {
    let amt = prompt(`${customer} kitna pay kar raha hai?`);
    if (!amt || isNaN(amt)) return;

    entries.push({
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        customer,
        mobile: "",
        type: "receive",
        amount: Number(amt),
        remark: "Pay Now Auto Entry"
    });

    saveDB();
    renderEntries();
}

// Search
document.getElementById("search").addEventListener("input", function () {
    let q = this.value.toLowerCase();
    let filtered = entries.filter(
        e =>
            e.customer.toLowerCase().includes(q) ||
            (e.mobile && e.mobile.includes(q))
    );
    renderEntries(filtered);
});

// PDF
document.getElementById("downloadPDF").addEventListener("click", () => {
    let opt = {
        margin: 0.5,
        filename: "Ledger.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { format: "A4" }
    };
    html2pdf().from(document.getElementById("entriesBox")).set(opt).save();
});

// Load initial
renderEntries();
