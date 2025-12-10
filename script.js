/* Udhar Ledger — script.js (vanilla JS) */

let entries = loadEntries(); // load from localStorage

// DOM refs
const entryList = document.getElementById("entryList");
const customerSelect = document.getElementById("customerSelect");
const customerSummary = document.getElementById("customerSummary");
const totalCreditEl = document.getElementById("totalCredit");
const totalDebitEl = document.getElementById("totalDebit");
const netBalanceEl = document.getElementById("netBalance");
const quickSearch = document.getElementById("quickSearch");
const viewMode = document.getElementById("viewMode");

// initial render
renderAll();
populateCustomerSelect();
renderCustomerSummary();

// helpers
function saveEntries() {
  localStorage.setItem("udhar_entries_v1", JSON.stringify(entries));
}
function loadEntries() {
  try {
    const raw = localStorage.getItem("udhar_entries_v1");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function uid(){ return Date.now() + Math.floor(Math.random()*999) }

// Add transaction
function addTransaction(){
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value; // credit / debit
  const amount = Number(document.getElementById("amount").value || 0);
  const box = document.getElementById("box").value.trim();
  const desc = document.getElementById("desc") ? document.getElementById("desc").value.trim() : '';

  if(!name || !date || !amount || amount <= 0){
    alert("Please enter valid Name, Date and Amount.");
    return;
  }

  const t = { id: uid(), name, mobile, date, type, amount, box, desc };
  entries.unshift(t); // newest first
  saveEntries();
  clearForm();
  populateCustomerSelect();
  renderAll();
  renderCustomerSummary();
}

function clearForm(){
  document.getElementById("name").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("date").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("box").value = "";
  if(document.getElementById("desc")) document.getElementById("desc").value = "";
}

// Render everything (based on viewMode)
function renderAll(){
  const mode = viewMode.value; // owner | customer
  const search = (quickSearch.value || "").toLowerCase();
  const selCustomer = customerSelect.value;
  const sDate = document.getElementById("startDate").value;
  const eDate = document.getElementById("endDate").value;

  // filter function
  const filtered = entries.filter(e => {
    const t = new Date(e.date).getTime();
    const s = sDate ? new Date(sDate).getTime() : -Infinity;
    const en = eDate ? new Date(eDate).getTime() : Infinity;
    const textMatch = e.name.toLowerCase().includes(search) || (e.mobile || '').includes(search);
    const custMatch = selCustomer ? e.name === selCustomer : true;
    return t >= s && t <= en && textMatch && custMatch;
  });

  // if customer view selected, show only that customer's transactions
  let showList = filtered;
  if(mode === "customer" && selCustomer){
    showList = filtered.filter(x => x.name === selCustomer);
  }

  renderList(showList);
  updateBalance(filtered);
}

// Render transaction list
function renderList(list){
  entryList.innerHTML = "";
  if(list.length === 0){
    document.getElementById("noRecords").style.display = "block";
    return;
  } else {
    document.getElementById("noRecords").style.display = "none";
  }

  list.forEach(t => {
    const row = document.createElement("div");
    row.className = "entry";

    const name = document.createElement("div"); name.className="name col"; name.innerText = t.name + (t.mobile ? " • " + t.mobile : "");
    const date = document.createElement("div"); date.className="date col"; date.innerText = t.date;
    const type = document.createElement("div"); type.className="type col";
    const badge = document.createElement("span"); badge.className = "badge " + (t.type === "credit" ? "credit" : "debit"); badge.innerText = t.type.toUpperCase();
    type.appendChild(badge);

    const amt = document.createElement("div"); amt.className="amt col"; amt.innerText = "₹" + t.amount.toLocaleString();
    const note = document.createElement("div"); note.className="note col"; note.innerText = (t.box ? t.box + " • " : "") + (t.desc || "");

    const actions = document.createElement("div"); actions.className="act col";
    const editBtn = document.createElement("button"); editBtn.className="action-btn"; editBtn.innerText="Edit";
    editBtn.onclick = () => editTransaction(t.id);
    const delBtn = document.createElement("button"); delBtn.className="action-btn"; delBtn.innerText="Delete";
    delBtn.onclick = () => { if(confirm("Delete this transaction?")) deleteTransaction(t.id); };

    actions.appendChild(editBtn); actions.appendChild(delBtn);

    // append columns
    row.appendChild(name);
    row.appendChild(date);
    row.appendChild(type);
    row.appendChild(amt);
    row.appendChild(note);
    row.appendChild(actions);

    entryList.appendChild(row);
  });
}

// Update balance sheet (for filtered list)
function updateBalance(list){
  let credit = 0, debit = 0;
  list.forEach(t => {
    if(t.type === "credit") credit += Number(t.amount || 0);
    else debit += Number(t.amount || 0);
  });
  const net = credit - debit;
  totalCreditEl.innerText = "₹" + credit.toLocaleString();
  totalDebitEl.innerText = "₹" + debit.toLocaleString();
  netBalanceEl.innerText = "₹" + net.toLocaleString();
}

// populate customer select & summary
function populateCustomerSelect(){
  const names = Array.from(new Set(entries.map(e => e.name))).sort();
  // clear
  customerSelect.innerHTML = '<option value="">— Select Customer (All) —</option>';
  names.forEach(n => {
    const o = document.createElement("option"); o.value = n; o.innerText = n; customerSelect.appendChild(o);
  });
}

function renderCustomerSummary(){
  // group by customer
  const map = {};
  entries.forEach(e => {
    if(!map[e.name]) map[e.name] = { credit:0, debit:0, lastDate: e.date, mobile: e.mobile || '' };
    if(e.type === "credit") map[e.name].credit += e.amount;
    else map[e.name].debit += e.amount;
    if(new Date(e.date) > new Date(map[e.name].lastDate)) map[e.name].lastDate = e.date;
    if(e.mobile) map[e.name].mobile = e.mobile;
  });

  customerSummary.innerHTML = "";
  const keys = Object.keys(map).sort();
  if(keys.length === 0) {
    customerSummary.innerHTML = '<div class="no-records">No customers yet.</div>';
    return;
  }
  keys.forEach(name => {
    const data = map[name];
    const item = document.createElement("div");
    item.className = "cust-item";
    item.innerHTML = `<div>
        <div class="cname">${name}</div>
        <div class="small-muted">${data.mobile || ''} • Last: ${data.lastDate}</div>
      </div>
      <div style="text-align:right">
        <div>Cr: ₹${data.credit.toLocaleString()}</div>
        <div>Dr: ₹${data.debit.toLocaleString()}</div>
        <div style="font-weight:700">Bal: ₹${(data.credit-data.debit).toLocaleString()}</div>
        <div style="margin-top:6px">
          <button class="action-btn" onclick="selectCustomer('${escapeQuotes(name)}')">Open</button>
        </div>
      </div>`;
    customerSummary.appendChild(item);
  });
}

function escapeQuotes(s){ return s.replace(/'/g,"\\'").replace(/\"/g,'\\"') }

// Select customer from summary
function selectCustomer(name){
  customerSelect.value = name;
  renderAll();
}

// Edit transaction
function editTransaction(id){
  const t = entries.find(x => x.id === id);
  if(!t) return alert("Transaction not found");
  // fill form
  document.getElementById("name").value = t.name;
  document.getElementById("mobile").value = t.mobile || "";
  document.getElementById("date").value = t.date;
  document.getElementById("type").value = t.type;
  document.getElementById("amount").value = t.amount;
  document.getElementById("box").value = t.box || "";
  if(document.getElementById("desc")) document.getElementById("desc").value = t.desc || "";

  // remove old entry then save when user clicks add (we will replace id to new)
  if(confirm("Editing will remove the old transaction. After editing press Add Transaction to save.")){
    entries = entries.filter(x => x.id !== id);
    saveEntries();
    renderAll();
    populateCustomerSelect();
    renderCustomerSummary();
  }
}

// Delete transaction
function deleteTransaction(id){
  entries = entries.filter(x => x.id !== id);
  saveEntries();
  populateCustomerSelect();
  renderAll();
  renderCustomerSummary();
}

// Export CSV
function exportCSV(){
  if(entries.length === 0) return alert("No data to export");
  const rows = [
    ["id","name","mobile","date","type","amount","box","desc"]
  ];
  entries.forEach(e => rows.push([e.id,e.name,e.mobile || '',e.date,e.type,e.amount,e.box || '', e.desc || '']));
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "udhar_ledger.csv"; a.click();
}

// Export JSON
function exportJson(){
  const blob = new Blob([JSON.stringify(entries, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "udhar_ledger.json"; a.click();
}

// Print
function printReport(){
  window.print();
}

// reset filters
function resetFilters(){
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  customerSelect.value = "";
  quickSearch.value = "";
  renderAll();
}

// initial search listener
quickSearch.addEventListener('input', () => renderAll());
viewMode.addEventListener('change', () => renderAll());

// make sample data (only if empty) — optional helpful demo
if(entries.length === 0){
  entries = [
    { id: uid(), name:"Ravi Kumar", mobile:"9876543210", date: today(-3), type:"debit", amount:500, box:"Small", desc:"Rice pack" },
    { id: uid(), name:"Ravi Kumar", mobile:"9876543210", date: today(-1), type:"credit", amount:200, box:"Return", desc:"Partial payment" },
    { id: uid(), name:"Sana Ali", mobile:"9123456780", date: today(-10), type:"debit", amount:1200, box:"Medium", desc:"Order boxes" },
  ];
  saveEntries();
  populateCustomerSelect();
}

renderAll();
renderCustomerSummary();

// utility: today offset days
function today(offset=0){
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0,10);
}
