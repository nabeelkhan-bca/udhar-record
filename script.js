// ---- LocalStorage Database ----
let entries = JSON.parse(localStorage.getItem("entries")) || [];

// Save
function saveDB() {
    localStorage.setItem("entries", JSON.stringify(entries));
}

// ---- Balance Calculation (Perfect Logic) ----
function getBalance(customer) {
    let bal = 0;

    entries
        .filter(e => e.customer === customer)
        .forEach(e => {
            if (e.type === "pay") {
                bal += Number(e.amount);      // Udhaar diya → increase
            } else if (e.type === "receive") {
                bal -= Number(e.amount);      // Customer ne pay kiya → decrease
            }
        });

    return bal;
}

// ---- Add Entry ----
document.getElementById("entryForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let date = document.getElementById("date").value;
    let customer = document.getElementById("customer").value.trim();
    let mobile = document.getElementById("mobile").value.trim();
    let type = document.getElementById("type").value;
    let amount = Number(document.getElementById("amount").value);
    let remark = document.getElementById("remark").value;

    if (!customer || !amount) {
        alert("Customer name & amount required");
        return;
    }

    // Add new entry
    entries.push({
        id: Date.now(),
        date,
        customer,
        mobile,
        type,
        amount,
        remark
    });

    saveDB();
    renderEntries();
    this.reset();
});

// ---- Render All Entries ----
function renderEntries(list = entries) {
    let box = document.getElementById("entriesBox");
    box.innerHTML = "";

    list.forEach((e) => {
        let bal = getBalance(e.customer);

        let card = document.createElement("div");
        card.className = "entry-card";

        card.innerHTML = `
            <div class="entry-top">
                <div><b>${e.customer}</b> (${e.mobile || "—"})</div>
                <div class="date">${e.date}</div>
            </div>

            <div class="entry-middle">
                <span class="${e.type === "pay" ? "pay" : "receive"}">${e.type.toUpperCase()}</span>
                <span class="amount">₹${e.amount}</span>
            </div>

            <div class="remark">📝 ${e.remark || "No remark"}</div>

            <div class="bal">Balance: <b>₹${bal}</b></div>

            <button class="payNowBtn" onclick="openPayNow(${e.id}, '${e.customer}')">Pay Now</button>
        `;

        box.appendChild(card);
    });
}

// ---- Pay Now Button ----
function openPayNow(id, customer) {
    let amt = prompt(`Customer "${customer}" kitna pay kar raha hai?`);

    if (!amt || isNaN(amt)) {
        alert("Invalid amount");
        return;
    }

    // Add receive entry
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

// ---- Search ----
document.getElementById("search").addEventListener("input", function () {
    let q = this.value.toLowerCase();

    let filtered = entries.filter(e =>
        e.customer.toLowerCase().includes(q) ||
        (e.mobile && e.mobile.includes(q))
    );

    renderEntries(filtered);
});

// ---- PDF Export ----
document.getElementById("downloadPDF").addEventListener("click", () => {
    const element = document.getElementById("entriesBox");

    const opt = {
        margin: 0.5,
        filename: "Customer-Entries.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "A4", orientation: "portrait" }
    };

    html2pdf().from(element).set(opt).save();
});

// ---- Initial Load ----
renderEntries();
