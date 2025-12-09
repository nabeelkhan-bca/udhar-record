// Global variables
let currentEditIndex = -1;
let sortState = { column: 'date', direction: 'desc' };
let currentTab = 'new-entry';

// DOM elements
const elements = {
  // Form elements
  nameInput: document.getElementById("name"),
  mobileInput: document.getElementById("mobile"),
  dateInput: document.getElementById("date"),
  transactionType: document.getElementById("transactionType"),
  amountInput: document.getElementById("amount"),
  descriptionInput: document.getElementById("description"),
  previousDueInput: document.getElementById("previousDue"),
  newDueInput: document.getElementById("newDue"),
  addBtn: document.getElementById("addBtn"),
  
  // Summary elements
  totalCustomers: document.getElementById("totalCustomers"),
  totalDebt: document.getElementById("totalDebt"),
  totalCredit: document.getElementById("totalCredit"),
  totalDebit: document.getElementById("totalDebit"),
  
  // Table elements
  recordList: document.getElementById("recordList"),
  transactionList: document.getElementById("transactionList"),
  searchInput: document.getElementById("searchInput"),
  
  // Filter elements
  historyCustomerFilter: document.getElementById("historyCustomerFilter"),
  historyDateFilter: document.getElementById("historyDateFilter"),
  historyTypeFilter: document.getElementById("historyTypeFilter"),
  
  // Action buttons
  clearAll: document.getElementById("clearAll"),
  exportBtn: document.getElementById("exportBtn"),
  exportTransactionsBtn: document.getElementById("exportTransactionsBtn"),
  
  // Modal elements
  editModal: document.getElementById("editModal"),
  editName: document.getElementById("editName"),
  editMobile: document.getElementById("editMobile"),
  editDate: document.getElementById("editDate"),
  editTransactionType: document.getElementById("editTransactionType"),
  editAmount: document.getElementById("editAmount"),
  editDescription: document.getElementById("editDescription"),
  updateBtn: document.getElementById("updateBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  closeBtn: document.querySelector(".close"),
  
  // Notification
  notification: document.getElementById("notification"),
  
  // Tab elements
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Customer list
  customerList: document.getElementById("customerList")
};

// Initialize the application
function init() {
  // Set current date as default
  elements.dateInput.valueAsDate = new Date();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load initial data
  loadCustomers();
  loadTransactionHistory();
  updateSummary();
  
  // Auto-capitalize name inputs
  elements.nameInput.addEventListener('input', function(e) {
    this.value = this.value.toUpperCase();
  });
  
  elements.editName.addEventListener('input', function(e) {
    this.value = this.value.toUpperCase();
  });
}

function setupEventListeners() {
  // Tab navigation
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Form events
  elements.addBtn.addEventListener("click", saveTransaction);
  elements.nameInput.addEventListener("input", loadCustomerBalance);
  elements.mobileInput.addEventListener("input", loadCustomerBalance);
  elements.amountInput.addEventListener("input", calculateNewDue);
  elements.transactionType.addEventListener("change", calculateNewDue);
  
  // Action buttons
  elements.clearAll.addEventListener("click", clearAllRecords);
  elements.exportBtn.addEventListener("click", exportToCSV);
  elements.exportTransactionsBtn.addEventListener("click", exportTransactionsToCSV);
  
  // Modal events
  elements.updateBtn.addEventListener("click", updateTransaction);
  elements.cancelBtn.addEventListener("click", closeModal);
  elements.closeBtn.addEventListener("click", closeModal);
  
  // Search and filters
  elements.searchInput.addEventListener("input", filterRecords);
  elements.historyCustomerFilter.addEventListener("change", filterTransactionHistory);
  elements.historyDateFilter.addEventListener("change", filterTransactionHistory);
  elements.historyTypeFilter.addEventListener("change", filterTransactionHistory);
  
  // Sort functionality
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      handleSort(column);
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === elements.editModal) {
      closeModal();
    }
  });
}

function switchTab(tabName) {
  // Update active tab button
  elements.tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update active tab content
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
  
  currentTab = tabName;
  
  // Load appropriate data
  if (tabName === 'customer-records') {
    loadCustomers();
  } else if (tabName === 'transaction-history') {
    loadTransactionHistory();
  }
}

function loadCustomerBalance() {
  const name = elements.nameInput.value.trim().toUpperCase();
  const mobile = elements.mobileInput.value.trim();
  
  if (name && mobile) {
    const customers = getCustomersData();
    const customer = customers.find(c => c.name === name && c.mobile === mobile);
    
    if (customer) {
      elements.previousDueInput.value = customer.balance;
      calculateNewDue();
    } else {
      elements.previousDueInput.value = '0';
      elements.newDueInput.value = '0';
    }
  }
}

function calculateNewDue() {
  const previousDue = parseFloat(elements.previousDueInput.value) || 0;
  const amount = parseFloat(elements.amountInput.value) || 0;
  const transactionType = elements.transactionType.value;
  
  let newDue;
  if (transactionType === 'credit') {
    newDue = previousDue + amount;
  } else {
    newDue = Math.max(0, previousDue - amount);
  }
  
  elements.newDueInput.value = newDue;
}

function saveTransaction() {
  const name = elements.nameInput.value.trim().toUpperCase();
  const mobile = elements.mobileInput.value.trim();
  const date = elements.dateInput.value;
  const type = elements.transactionType.value;
  const amount = parseFloat(elements.amountInput.value) || 0;
  const description = elements.descriptionInput.value.trim();
  const previousDue = parseFloat(elements.previousDueInput.value) || 0;
  const newDue = parseFloat(elements.newDueInput.value) || 0;
  
  if (!name || !mobile || !date || amount <= 0) {
    showNotification("Please fill all required fields with valid data!", "error");
    return;
  }
  
  // Save transaction
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  transactions.push({
    id: Date.now(),
    name,
    mobile,
    date,
    type,
    amount,
    description,
    previousDue,
    newDue,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem("transactions", JSON.stringify(transactions));
  
  // Clear form
  clearForm();
  
  // Update UI
  loadCustomers();
  loadTransactionHistory();
  updateSummary();
  updateCustomerList();
  
  showNotification("Transaction added successfully!", "success");
}

function getCustomersData() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const customers = {};
  
  transactions.forEach(transaction => {
    const key = `${transaction.name}-${transaction.mobile}`;
    if (!customers[key]) {
      customers[key] = {
        name: transaction.name,
        mobile: transaction.mobile,
        totalCredit: 0,
        totalDebit: 0,
        balance: 0,
        lastTransaction: transaction.date
      };
    }
    
    if (transaction.type === 'credit') {
      customers[key].totalCredit += transaction.amount;
      customers[key].balance += transaction.amount;
    } else {
      customers[key].totalDebit += transaction.amount;
      customers[key].balance -= transaction.amount;
    }
    
    // Update last transaction date
    if (new Date(transaction.date) > new Date(customers[key].lastTransaction)) {
      customers[key].lastTransaction = transaction.date;
    }
  });
  
  return Object.values(customers);
}

function loadCustomers() {
  elements.recordList.innerHTML = "";
  const customers = getCustomersData();
  const searchTerm = elements.searchInput.value.toLowerCase();
  
  // Apply search filter
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm) || 
    customer.mobile.includes(searchTerm)
  );
  
  if (filteredCustomers.length === 0) {
    elements.recordList.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No customers found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // Sort customers
  const sortedCustomers = sortCustomers(filteredCustomers, sortState.column, sortState.direction);
  
  sortedCustomers.forEach((customer, index) => {
    const row = document.createElement("tr");
    const balanceClass = customer.balance >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.mobile}</td>
      <td class="credit">₹${customer.totalCredit.toFixed(2)}</td>
      <td class="debit">₹${customer.totalDebit.toFixed(2)}</td>
      <td class="balance ${balanceClass}"><strong>₹${customer.balance.toFixed(2)}</strong></td>
      <td>
        <button class="viewBtn" onclick="viewCustomerHistory('${customer.name}', '${customer.mobile}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="editBtn" onclick="editCustomer('${customer.name}', '${customer.mobile}')">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    elements.recordList.appendChild(row);
  });
}

function sortCustomers(customers, column, direction) {
  return customers.slice().sort((a, b) => {
    let aVal, bVal;
    
    if (column === 'balance') {
      aVal = a.balance;
      bVal = b.balance;
    } else if (column === 'totalCredit') {
      aVal = a.totalCredit;
      bVal = b.totalCredit;
    } else if (column === 'totalDebit') {
      aVal = a.totalDebit;
      bVal = b.totalDebit;
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

function loadTransactionHistory() {
  elements.transactionList.innerHTML = "";
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  
  // Apply filters
  const customerFilter = elements.historyCustomerFilter.value;
  const dateFilter = elements.historyDateFilter.value;
  const typeFilter = elements.historyTypeFilter.value;
  
  if (customerFilter) {
    const [name, mobile] = customerFilter.split('|');
    transactions = transactions.filter(t => t.name === name && t.mobile === mobile);
  }
  
  if (dateFilter) {
    transactions = transactions.filter(t => t.date === dateFilter);
  }
  
  if (typeFilter) {
    transactions = transactions.filter(t => t.type === typeFilter);
  }
  
  // Sort by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (transactions.length === 0) {
    elements.transactionList.innerHTML = `
      <tr>
        <td colspan="8" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No transactions found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  transactions.forEach((transaction, index) => {
    const row = document.createElement("tr");
    const typeClass = transaction.type === 'credit' ? 'credit' : 'debit';
    const balanceClass = transaction.newDue >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${transaction.name}</td>
      <td>${transaction.mobile}</td>
      <td class="${typeClass}"><strong>${transaction.type.toUpperCase()}</strong></td>
      <td class="${typeClass}">₹${transaction.amount.toFixed(2)}</td>
      <td>${transaction.description || '-'}</td>
      <td class="balance ${balanceClass}"><strong>₹${transaction.newDue.toFixed(2)}</strong></td>
      <td>
        <button class="editBtn" onclick="openEditModal(${index})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="deleteBtn" onclick="deleteTransaction(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    elements.transactionList.appendChild(row);
  });
}

function updateCustomerList() {
  const customers = getCustomersData();
  elements.customerList.innerHTML = '';
  
  customers.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.name;
    elements.customerList.appendChild(option);
  });
  
  // Update history customer filter
  elements.historyCustomerFilter.innerHTML = '<option value="">All Customers</option>';
  customers.forEach(customer => {
    const option = document.createElement('option');
    option.value = `${customer.name}|${customer.mobile}`;
    option.textContent = `${customer.name} (${customer.mobile})`;
    elements.historyCustomerFilter.appendChild(option);
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
  
  if (currentTab === 'customer-records') {
    loadCustomers();
  } else if (currentTab === 'transaction-history') {
    loadTransactionHistory();
  }
}

function openEditModal(index) {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const transaction = transactions[index];
  
  elements.editName.value = transaction.name;
  elements.editMobile.value = transaction.mobile;
  elements.editDate.value = transaction.date;
  elements.editTransactionType.value = transaction.type;
  elements.editAmount.value = transaction.amount;
  elements.editDescription.value = transaction.description || '';
  
  currentEditIndex = index;
  elements.editModal.style.display = "block";
}

function closeModal() {
  elements.editModal.style.display = "none";
  currentEditIndex = -1;
}

function updateTransaction() {
  if (currentEditIndex === -1) return;
  
  const name = elements.editName.value.trim().toUpperCase();
  const mobile = elements.editMobile.value.trim();
  const date = elements.editDate.value;
  const type = elements.editTransactionType.value;
  const amount = parseFloat(elements.editAmount.value) || 0;
  const description = elements.editDescription.value.trim();
  
  if (!name || !mobile || !date || amount <= 0) {
    showNotification("Please fill all required fields with valid data!", "error");
    return;
  }
  
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  
  // Update the transaction
  transactions[currentEditIndex] = {
    ...transactions[currentEditIndex],
    name,
    mobile,
    date,
    type,
    amount,
    description
  };
  
  // Recalculate all balances
  recalculateAllBalances();
  
  closeModal();
  loadCustomers();
  loadTransactionHistory();
  updateSummary();
  showNotification("Transaction updated successfully!", "success");
}

function deleteTransaction(index) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  transactions.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  
  // Recalculate all balances
  recalculateAllBalances();
  
  loadCustomers();
  loadTransactionHistory();
  updateSummary();
  showNotification("Transaction deleted successfully!", "success");
}

function recalculateAllBalances() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  
  // Group transactions by customer
  const customerTransactions = {};
  transactions.forEach(transaction => {
    const key = `${transaction.name}-${transaction.mobile}`;
    if (!customerTransactions[key]) {
      customerTransactions[key] = [];
    }
    customerTransactions[key].push(transaction);
  });
  
  // Sort each customer's transactions by date
  Object.keys(customerTransactions).forEach(key => {
    customerTransactions[key].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Recalculate balances
    let runningBalance = 0;
    customerTransactions[key].forEach(transaction => {
      transaction.previousDue = runningBalance;
      if (transaction.type === 'credit') {
        runningBalance += transaction.amount;
      } else {
        runningBalance = Math.max(0, runningBalance - transaction.amount);
      }
      transaction.newDue = runningBalance;
    });
  });
  
  // Save updated transactions
  const updatedTransactions = Object.values(customerTransactions).flat();
  localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
}

function viewCustomerHistory(name, mobile) {
  // Switch to transaction history tab and filter by customer
  switchTab('transaction-history');
  elements.historyCustomerFilter.value = `${name}|${mobile}`;
  loadTransactionHistory();
}

function editCustomer(name, mobile) {
  // Switch to new entry tab with customer pre-filled
  switchTab('new-entry');
  elements.nameInput.value = name;
  elements.mobileInput.value = mobile;
  loadCustomerBalance();
}

function clearAllRecords() {
  if (!confirm("Are you sure you want to delete all records? This action cannot be undone!")) return;
  
  localStorage.removeItem("transactions");
  loadCustomers();
  loadTransactionHistory();
  updateSummary();
  updateCustomerList();
  showNotification("All records deleted successfully!", "success");
}

function filterRecords() {
  if (currentTab === 'customer-records') {
    loadCustomers();
  }
}

function filterTransactionHistory() {
  loadTransactionHistory();
}

function exportToCSV() {
  const customers = getCustomersData();
  if (customers.length === 0) {
    showNotification("No customer records to export!", "error");
    return;
  }
  
  let csv = "Customer Name,Mobile Number,Total Credit,Total Debit,Balance\n";
  
  customers.forEach(customer => {
    csv += `"${customer.name}","${customer.mobile}","${customer.totalCredit.toFixed(2)}","${customer.totalDebit.toFixed(2)}","${customer.balance.toFixed(2)}"\n`;
  });
  
  downloadCSV(csv, `haji_customers_${new Date().toISOString().split('T')[0]}.csv`);
  showNotification("Customer records exported successfully!", "success");
}

function exportTransactionsToCSV() {
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  if (transactions.length === 0) {
    showNotification("No transactions to export!", "error");
    return;
  }
  
  let csv = "Date,Customer Name,Mobile Number,Type,Amount,Description,Balance\n";
  
  transactions.forEach(transaction => {
    csv += `"${formatDate(transaction.date)}","${transaction.name}","${transaction.mobile}","${transaction.type}","${transaction.amount.toFixed(2)}","${transaction.description || ''}","${transaction.newDue.toFixed(2)}"\n`;
  });
  
  downloadCSV(csv, `haji_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  showNotification("Transaction history exported successfully!", "success");
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function updateSummary() {
  const customers = getCustomersData();
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  
  const total = customers.length;
  const totalOutstanding = customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0);
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  
  elements.totalCustomers.textContent = total;
  elements.totalDebt.textContent = `₹${totalOutstanding.toFixed(2)}`;
  elements.totalCredit.textContent = `₹${totalCredit.toFixed(2)}`;
  elements.totalDebit.textContent = `₹${totalDebit.toFixed(2)}`;
}

function clearForm() {
  elements.nameInput.value = "";
  elements.mobileInput.value = "";
  elements.amountInput.value = "0";
  elements.descriptionInput.value = "";
  elements.previousDueInput.value = "0";
  elements.newDueInput.value = "0";
  elements.dateInput.valueAsDate = new Date();
  elements.transactionType.value = "credit";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function showNotification(message, type) {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type}`;
  elements.notification.style.display = 'block';
  
  setTimeout(() => {
    elements.notification.style.display = 'none';
  }, 3000);
}

// Initialize app
init();
