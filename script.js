const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");
const amountInput = document.getElementById("amount");
const addBtn = document.getElementById("addBtn");
const recordList = document.getElementById("recordList");
const clearAll = document.getElementById("clearAll");

function loadRecords() {
  recordList.innerHTML = "";
  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.forEach((rec, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${rec.name}</td>
      <td>${rec.mobile}</td>
      <td>₹${rec.amount}</td>
      <td><button class="deleteBtn" onclick="deleteRecord(${index})">हटाएँ</button></td>
    `;
    recordList.appendChild(row);
  });
}

function saveRecord() {
  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();
  const amount = amountInput.value.trim();
  if (!name || !mobile || !amount) return alert("कृपया सभी जानकारी भरें!");
  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.push({ name, mobile, amount });
  localStorage.setItem("records", JSON.stringify(records));
  nameInput.value = mobileInput.value = amountInput.value = "";
  loadRecords();
}

function deleteRecord(index) {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.splice(index, 1);
  localStorage.setItem("records", JSON.stringify(records));
  loadRecords();
}

function clearRecords() {
  if (confirm("क्या आप सभी रिकॉर्ड हटाना चाहते हैं?")) {
    localStorage.removeItem("records");
    loadRecords();
  }
}

addBtn.addEventListener("click", saveRecord);
clearAll.addEventListener("click", clearRecords);

loadRecords();
