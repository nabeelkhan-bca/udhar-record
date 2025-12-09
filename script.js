const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");
const udharInput = document.getElementById("udharAmount");
const creditInput = document.getElementById("creditAmount");
const dateInput = document.getElementById("date");
const addBtn = document.getElementById("addBtn");
const recordList = document.getElementById("recordList");
const clearAll = document.getElementById("clearAll");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");
const totalCustomers = document.getElementById("totalCustomers");
const totalDebt = document.getElementById("totalDebt");

// Modal elements
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editMobile = document.getElementById("editMobile");
const editUdhar = document.getElementById("editUdhar");
const editCredit = document.getElementById("editCredit");
const editDate = document.getElementById("editDate");
const updateBtn = document.getElementById("updateBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closeBtn = document.querySelector(".close");

// Notification element
const notification = document.getElementById("notification");

let currentEditIndex = -1;
let sortState = { column: 'date', direction: 'desc' };

// Set current date as default
dateInput.valueAsDate = new Date();

// Initialize the application
function init() {
  loadRecords();
  setupEventListeners();
  updateSummary();
}

function setupEventListeners() {
  addBtn.addEventListener("click", saveRecord);
  clearAll.addEventListener("click", clearRecords);
  searchInput.addEventListener("input", filterRecords);
  exportBtn.addEventListener("click", exportToCSV);
  updateBtn.addEventListener("click", updateRecord);
  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  
  // Sort functionality
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      handleSort(column);
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeModal();
    }
  });
}

function loadRecords() {
  recordList.innerHTML = "";
  const records = JSON.parse(localStorage.getItem("records")) || [];
  
  // Apply sorting
  const sortedRecords = sortRecords(records, sortState.column, sortState.direction);
  
  // Apply filtering if search term exists
  const searchTerm = searchInput.value.toLowerCase();
  const filteredRecords = sortedRecords.filter(rec => 
    rec.name.toLowerCase().includes(searchTerm) || 
    rec.mobile.includes(searchTerm)
  );

  if (filteredRecords.length === 0) {
    recordList.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No records found</p>
        </td>
      </tr>
    `;
    return;
  }

  filteredRecords.forEach((rec, index) => {
    const originalIndex = records.findIndex(r => 
      r.date === rec.date && r.name === rec.name && r.mobile === rec.mobile
    );
    
    const balance = rec.udharAmount - rec.creditAmount;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(rec.date)}</td>
      <td>${rec.name}</td>
      <td>${rec.mobile}</td>
      <td class="debit">₹${rec.udharAmount}</td>
      <td class="credit">₹${rec.creditAmount}</td>
      <td class="balance ${balance < 0 ? 'negative' : balance > 0 ? 'positive' : ''}">
        ₹${Math.abs(balance)} ${balance < 0 ? '(Credit)' : balance > 0 ? '(Loan)' : ''}
      </td>
      <td>
        <button class="editBtn" onclick="openEditModal(${originalIndex})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="deleteBtn" onclick="deleteRecord(${originalIndex})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    recordList.appendChild(row);
  });
}

function sortRecords(records, column, direction) {
  return records.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    if (column === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (column === 'udhar' || column === 'credit' || column === 'balance') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

function handleSort(column) {
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortState.column = column;
    sortState.direction = 'asc';
  }
  
  // Update sort icons
  document.querySelectorAll('th[data-sort]').forEach(th => {
    const icon = th.querySelector('i');
    if (th.getAttribute('data-sort') === column) {
      icon.className = sortState.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    } else {
      icon.className = 'fas fa-sort';
    }
  });
  
  loadRecords();
}

function saveRecord() {
  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();
  const udharAmount = parseFloat(udharInput.value) || 0;
  const creditAmount = parseFloat(creditInput.value) || 0;
  const date = dateInput.value;

  if (!name || !mobile || !date) {
    showNotification("Please fill all required information!", "error");
    return;
  }

  if (udharAmount === 0 && creditAmount === 0) {
    showNotification("Please enter loan or credit amount!", "error");
    return;
  }

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.push({ name, mobile, udharAmount, creditAmount, date });
  localStorage.setItem("records", JSON.stringify(records));
  
  clearForm();
  loadRecords();
  updateSummary();
  showNotification("Record added successfully!", "success");
}

function updateRecord() {
  if (currentEditIndex === -1) return;

  const name = editName.value.trim();
  const mobile = editMobile.value.trim();
  const udharAmount = parseFloat(editUdhar.value) || 0;
  const creditAmount = parseFloat(editCredit.value) || 0;
  const date = editDate.value;

  if (!name || !mobile || !date) {
    showNotification("Please fill all required information!", "error");
    return;
  }

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records[currentEditIndex] = { name, mobile, udharAmount, creditAmount, date };
  localStorage.setItem("records", JSON.stringify(records));
  
  closeModal();
  loadRecords();
  updateSummary();
  showNotification("Record updated successfully!", "success");
}

function deleteRecord(index) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.splice(index, 1);
  localStorage.setItem("records", JSON.stringify(records));
  loadRecords();
  updateSummary();
  showNotification("Record deleted successfully!", "success");
}

function openEditModal(index) {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const record = records[index];
  
  editName.value = record.name;
  editMobile.value = record.mobile;
  editUdhar.value = record.udharAmount;
  editCredit.value = record.creditAmount;
  editDate.value = record.date;
  
  currentEditIndex = index;
  editModal.style.display = "block";
}

function closeModal() {
  editModal.style.display = "none";
  currentEditIndex = -1;
}

function clearRecords() {
  if (!confirm("Are you sure you want to delete all records? This action cannot be undone!")) return;

  localStorage.removeItem("records");
  loadRecords();
  updateSummary();
  showNotification("All records deleted successfully!", "success");
}

function filterRecords() {
  loadRecords();
}

function exportToCSV() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) {
    showNotification("No records to export!", "error");
    return;
  }

  let csv = "Date,Customer Name,Mobile Number,Loan Amount,Credit Amount,Balance Amount\n";
  
  records.forEach(rec => {
    const balance = rec.udharAmount - rec.creditAmount;
    csv += `"${formatDate(rec.date)}","${rec.name}","${rec.mobile}","${rec.udharAmount}","${rec.creditAmount}","${balance}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loan_records_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showNotification("CSV file downloaded successfully!", "success");
}

function updateSummary() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const total = records.length;
  const totalUdhar = records.reduce((sum, rec) => sum - rec.udharAmount, 0) ;
  const totalCredit = records.reduce((sum, rec) => sum + rec.creditAmount, 0);
  const netBalance = totalUdhar - totalCredit;

  totalCustomers.textContent = total;
  totalDebt.textContent = `₹${netBalance}`;
}

function clearForm() {
  nameInput.value = "";
  mobileInput.value = "";
  udharInput.value = "";
  creditInput.value = "";
  dateInput.valueAsDate = new Date();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN');
}

function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Initialize app
init();
