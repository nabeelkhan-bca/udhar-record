// ===== script.js (Full Clean JS File) =====

let mode = "receive";
let data = JSON.parse(localStorage.getItem("ledgerData") || "[]");

const receiveBtn = document.getElementById("receiveBtn");
const payBtn = document.getElementById("payBtn");
const saveBtn = document.getElementById("saveBtn");
const entriesDiv = document.getElementById("entries");
const searchInput = document.getElementById("searchInput");

const customerName = document.getElementById("customerName");
const mobileInput = document.getElementById("mobile");
const aadhaarInput = document.getElementById("aadhaar");
const amountInput = document.getElementById("amount");
const remarksInput = document.getElementById("remarks");
const lastBalanceSpan = document.getElementById("lastBalance");

// -------- Mode Switching (Receive / Pay) --------
receiveBtn.onclick = () => switchMode("receive");
payBtn.onclick = () => switchMode("pay");

function switchMode(m) {
  mode = m;
  receiveBtn.classList.toggle("active", m === "receive");
  payBtn.classList.toggle("active", m === "pay");
}

// -------- Get Previous Balance --------
function getLastBalance(mobile) {
  let list = data.filter(e => e.mobile === mobile);
  if (list.length === 0) return 0;
  return list[list.length - 1].balance;
}

// -------- Render ALL Entries --------
function render() {
  entriesDiv.innerHTML = "";

  let filtered = data.filter(e => {
    let q = searchInput.value.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.mobile.includes(q)
    );
  });

  let grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  Object.keys(grouped).forEach(date => {
    entriesDiv.innerHTML += `<div class='entry-date'>${date}</div>`;
    grouped[date].forEach(e => {
      entriesDiv.innerHTML += `
        <div class='entry'>
          <div class='type'>${(e.type === "udhar" ? "UDDHAR" : "RECEIVE")} - ₹${e.amount}</div>
          <div>${e.name} (${e.mobile})</div>
          <div>Balance: ₹${e.balance}</div>
          <div>${e.remarks}</div>
          <button class='payNow' data-id='${e.id}' style="margin-top:6px;background:#28a745;color:white;padding:4px 10px;border-radius:6px;border:none;">Pay Now</button>
        </div>
      `;
    });(e => {
      entriesDiv.innerHTML += `
        <div class='entry'>
          <div class='type'>${(e.type === "pay" ? "UDDHAR" : e.type.toUpperCase())()} - ₹${e.amount}</div>
          <div>${e.name} (${e.mobile})</div>
          <div>Balance: ₹${e.balance}</div>
          <div>${e.remarks}</div>
        </div>
      `;
    });
  });
}

searchInput.oninput = render;

// -------- Save Button Logic --------
saveBtn.onclick = () => {
  let name = customerName.value.trim();
  let mobile = mobileInput.value.trim();
  let aadhaar = aadhaarInput.value.trim();
  let amount = Number(amountInput.value.trim());
  let remarks = remarksInput.value.trim();

  if (!name || !mobile || !amount) return alert("Please fill required fields");

  let previous = getLastBalance(mobile);
  let newBalance = mode === "receive" ? previous - amount : previous + amount;

  let entry = {
    id: Date.now(), {
    date: new Date().toLocaleDateString(),
    name,
    mobile,
    aadhaar,
    amount,
    type: (mode === "pay" ? "udhar" : "receive"),
    remarks,
    balance: newBalance
  };

  data.push(entry);
  localStorage.setItem("ledgerData", JSON.stringify(data));

  lastBalanceSpan.innerText = newBalance;
  render();
};

// -------- Auto-fill When Mobile Changes --------
mobileInput.oninput = () => {
  lastBalanceSpan.innerText = getLastBalance(mobileInput.value);
};

// -------- Auto-fill When Aadhaar Matches --------
aadhaarInput.oninput = () => {
  if (aadhaarInput.value.length === 12) {
    let match = data.find(e => e.aadhaar === aadhaarInput.value);
    if (match) {
      customerName.value = match.name;
      mobileInput.value = match.mobile;
      lastBalanceSpan.innerText = match.balance;
    }
  }
};

// Pay Now Action
entriesDiv.onclick = (e) => {
  if (e.target.classList.contains('payNow')) {
    let id = Number(e.target.getAttribute('data-id'));
    let entry = data.find(x => x.id === id);
    if (!entry) return;

    let amount = prompt(`Enter amount to receive from ${entry.name}:`);
    if (!amount) return;
    amount = Number(amount);
    if (amount <= 0) return alert('Invalid amount');

    let previous = getLastBalance(entry.mobile);
    let newBalance = previous - amount;

    let newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      name: entry.name,
      mobile: entry.mobile,
      aadhaar: entry.aadhaar,
      amount,
      type: "receive",
      remarks: "Auto-pay from entry",
      balance: newBalance
    };

    data.push(newEntry);
    localStorage.setItem('ledgerData', JSON.stringify(data));
    render();
  }
};

// Initial render
render();
