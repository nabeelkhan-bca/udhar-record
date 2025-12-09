const nameInput = document.getElementById("name");
const mobileInput = document.getElementById("mobile");
const amountInput = document.getElementById("amount");
const transactionTypeInput = document.getElementById("transactionType");
const remarksInput = document.getElementById("remarks");
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
const editAmount = document.getElementById("editAmount");
const editTransactionType = document.getElementById("editTransactionType");
const editRemarks = document.getElementById("editRemarks");
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

// Auto-capitalize name inputs
nameInput.addEventListener('input', function(e) {
  this.value = this.value.toUpperCase();
});

editName.addEventListener('input', function(e) {
  this.value = this.value.toUpperCase();
});

function setupEventListeners() {
  addBtn.addEventListener("click", saveRecord);
  clearAll.addEventListener("click", clearRecords);
  searchInput.addEventListener("input", filterRecords);
  exportBtn.addEventListener("click", exportToExcel);
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

function calculateRunningBalance(records) {
  // Group by customer
  const customerBalances = {};
  
  records.forEach(rec => {
    const key = `${rec.name}_${rec.mobile}`;
    if (!customerBalances[key]) {
      customerBalances[key] = 0;
    }
    
    if (rec.type === 'credit') {
      customerBalances[key] += rec.amount;
    } else {
      customerBalances[key] -= rec.amount;
    }
    
    rec.runningBalance = customerBalances[key];
  });
  
  return records;
}

function loadRecords() {
  recordList.innerHTML = "";
  let records = JSON.parse(localStorage.getItem("records")) || [];
  
  // Calculate running balances
  records = calculateRunningBalance(records);
  
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
        <td colspan="8" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No records found</p>
        </td>
      </tr>
    `;
    return;
  }

  filteredRecords.forEach((rec, index) => {
    const originalIndex = records.findIndex(r => 
      r.date === rec.date && 
      r.name === rec.name && 
      r.mobile === rec.mobile && 
      r.amount === rec.amount && 
      r.type === rec.type &&
      r.id === rec.id
    );
    
    const row = document.createElement("tr");
    const typeClass = rec.type === 'credit' ? 'credit-type' : 'payment-type';
    const balanceClass = rec.runningBalance > 0 ? 'balance-negative' : rec.runningBalance < 0 ? 'balance-positive' : '';
    
    row.innerHTML = `
      <td>${formatDate(rec.date)}</td>
      <td>${rec.name}</td>
      <td>${rec.mobile}</td>
      <td class="${typeClass}"><strong>${rec.type === 'credit' ? 'UDHAR' : 'JAMA'}</strong></td>
      <td class="${rec.type === 'credit' ? 'new-due' : 'payment'}">₹${rec.amount}</td>
      <td class="${balanceClass}"><strong>₹${rec.runningBalance}</strong></td>
      <td>${rec.remarks || '-'}</td>
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
  return records.slice().sort((a, b) => {
    let aVal, bVal;

    if (column === 'balance') {
      aVal = a.runningBalance;
      bVal = b.runningBalance;
    } else if (column === 'date') {
      aVal = new Date(a[column]);
      bVal = new Date(b[column]);
    } else if (column === 'amount') {
      aVal = parseFloat(a[column]);
      bVal = parseFloat(b[column]);
    } else if (column === 'type') {
      aVal = a[column];
      bVal = b[column];
    } else {
      aVal = a[column];
      bVal = b[column];
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
  const name = nameInput.value.trim().toUpperCase();
  const mobile = mobileInput.value.trim();
  const amount = parseFloat(amountInput.value) || 0;
  const type = transactionTypeInput.value;
  const remarks = remarksInput.value.trim();
  const date = dateInput.value;

  if (!name || !mobile || !date || amount <= 0) {
    showNotification("Please fill all required fields (Name, Mobile, Date, Amount)!", "error");
    return;
  }

  const records = JSON.parse(localStorage.getItem("records")) || [];
  const id = Date.now() + Math.random(); // Unique ID for each transaction
  records.push({ id, name, mobile, amount, type, remarks, date });
  localStorage.setItem("records", JSON.stringify(records));
  
  clearForm();
  loadRecords();
  updateSummary();
  showNotification("Transaction added successfully!", "success");
}

function updateRecord() {
  if (currentEditIndex === -1) return;

  const name = editName.value.trim().toUpperCase();
  const mobile = editMobile.value.trim();
  const amount = parseFloat(editAmount.value) || 0;
  const type = editTransactionType.value;
  const remarks = editRemarks.value.trim();
  const date = editDate.value;

  if (!name || !mobile || !date || amount <= 0) {
    showNotification("Please fill all required fields!", "error");
    return;
  }

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records[currentEditIndex] = { 
    ...records[currentEditIndex],
    name, 
    mobile, 
    amount, 
    type, 
    remarks, 
    date 
  };
  localStorage.setItem("records", JSON.stringify(records));
  
  closeModal();
  loadRecords();
  updateSummary();
  showNotification("Transaction updated successfully!", "success");
}

function deleteRecord(index) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.splice(index, 1);
  localStorage.setItem("records", JSON.stringify(records));
  loadRecords();
  updateSummary();
  showNotification("Transaction deleted successfully!", "success");
}

function openEditModal(index) {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const record = records[index];
  
  editName.value = record.name;
  editMobile.value = record.mobile;
  editAmount.value = record.amount;
  editTransactionType.value = record.type;
  editRemarks.value = record.remarks || '';
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

function exportToExcel() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  if (records.length === 0) {
    showNotification("No records to export!", "error");
    return;
  }

  // Calculate running balances
  const recordsWithBalance = calculateRunningBalance(records);

  // Create Excel-compatible HTML table with inline styles
  let html = `
    <html xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Customer Ledger</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <style>
        table { 
          border-collapse: collapse; 
          width: 100%; 
          font-family: Arial, sans-serif;
        }
        th { 
          background-color: #2c3e50; 
          color: white; 
          font-weight: bold; 
          text-align: center;
          padding: 12px;
          border: 1px solid #000;
        }
        td { 
          text-align: center; 
          padding: 10px;
          border: 1px solid #000;
        }
        .header { 
          background-color: #34495e; 
          color: white; 
          font-size: 18px; 
          font-weight: bold; 
          text-align: center;
          padding: 15px;
        }
        .credit { color: #e74c3c; font-weight: bold; }
        .payment { color: #27ae60; font-weight: bold; }
        .balance-negative { color: #e74c3c; font-weight: bold; }
        .balance-positive { color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">HAJI PROVISION STORE - CUSTOMER LEDGER</div>
      <br>
      <table border="1">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Mobile Number</th>
            <th>Transaction Type</th>
            <th>Amount (₹)</th>
            <th>Balance (₹)</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  recordsWithBalance.forEach(rec => {
    const typeClass = rec.type === 'credit' ? 'credit' : 'payment';
    const balanceClass = rec.runningBalance > 0 ? 'balance-negative' : rec.runningBalance < 0 ? 'balance-positive' : '';
    const typeText = rec.type === 'credit' ? 'UDHAR' : 'JAMA';
    
    html += `
      <tr>
        <td>${formatDate(rec.date)}</td>
        <td>${rec.name}</td>
        <td>${rec.mobile}</td>
        <td class="${typeClass}">${typeText}</td>
        <td class="${typeClass}">${rec.amount}</td>
        <td class="${balanceClass}">${rec.runningBalance}</td>
        <td>${rec.remarks || '-'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <br>
      <div style="text-align: center; font-weight: bold; font-size: 14px;">
        Generated on: ${new Date().toLocaleString('en-IN')}
      </div>
    </body>
    </html>
  `;

  // Create Blob and download
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Haji_Provision_Store_Ledger_${new Date().toISOString().split('T')[0]}.xls`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showNotification("Excel file downloaded successfully!", "success");
}

function updateSummary() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  
  // Get unique customers
  const uniqueCustomers = new Set();
  records.forEach(rec => {
    uniqueCustomers.add(`${rec.name}_${rec.mobile}`);
  });
  
  // Calculate total outstanding
  const customerBalances = {};
  records.forEach(rec => {
    const key = `${rec.name}_${rec.mobile}`;
    if (!customerBalances[key]) {
      customerBalances[key] = 0;
    }
    if (rec.type === 'credit') {
      customerBalances[key] += rec.amount;
    } else {
      customerBalances[key] -= rec.amount;
    }
  });
  
  const totalOutstanding = Object.values(customerBalances).reduce((sum, balance) => {
    return sum + (balance > 0 ? balance : 0);
  }, 0);

  totalCustomers.textContent = uniqueCustomers.size;
  totalDebt.textContent = `₹${totalOutstanding}`;
}

function clearForm() {
  nameInput.value = "";
  mobileInput.value = "";
  amountInput.value = "0";
  transactionTypeInput.value = "credit";
  remarksInput.value = "";
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

// Make functions global for onclick handlers
window.openEditModal = openEditModal;
window.deleteRecord = deleteRecord;

// Initialize app
init();
