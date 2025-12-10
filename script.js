let entries = [];

// Add new entry
function addEntry() {
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const amount = document.getElementById("amount").value;
    const box = document.getElementById("box").value;
    const mobile = document.getElementById("mobile").value;

    if (!name || !date || !amount) {
        alert("Please fill name, date, and amount!");
        return;
    }

    entries.push({ 
        id: Date.now(),
        name,
        date,
        amount: Number(amount),
        box,
        mobile 
    });

    document.getElementById("name").value = "";
    document.getElementById("date").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("box").value = "";
    document.getElementById("mobile").value = "";

    renderEntries();
}

// Render list + search + filter + total
function renderEntries() {
    const search = document.getElementById("search").value.toLowerCase();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    let filtered = entries.filter((e) => {
        const t = new Date(e.date).getTime();
        const s = startDate ? new Date(startDate).getTime() : 0;
        const en = endDate ? new Date(endDate).getTime() : Infinity;

        const matchText =
            e.name.toLowerCase().includes(search) ||
            e.mobile.includes(search);

        return t >= s && t <= en && matchText;
    });

    let html = "";
    let total = 0;

    filtered.forEach((e) => {
        total += e.amount;

        html += `
            <div class="entry">
                <strong>${e.name}</strong> <br>
                Date: ${e.date} <br>
                Box: ${e.box} <br>
                Mobile: ${e.mobile} <br>
                <strong>Amount: ₹${e.amount}</strong>
            </div>
        `;
    });

    document.getElementById("entryList").innerHTML = html;
    document.getElementById("total").innerText = total;
}

// Print / PDF
function printReport() {
    window.print();
}

// Export JSON
function exportJson() {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "udhar-report.json";
    a.click();
}
