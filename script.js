// Global variables
let currentEditIndex = -1;
let currentTab = 'new-entry';
let transactions = [];

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
  customerList: document.getElementById("customerList"),
  dateWiseLedger: document.getElementById("dateWiseLedger"),
  searchInput: document.getElementById("searchInput"),
  
  // Filter elements
  ledgerCustomerFilter: document.getElementById("ledgerCustomerFilter"),
  ledgerDateFilter: document.getElementById("ledgerDateFilter"),
  viewLedgerBtn: document.getElementById("viewLedgerBtn"),
  ledgerSummary: document.getElementById("ledgerSummary"),
  
  // Action buttons
  clearAll: document.getElementById("clearAll"),
  exportBtn: document.getElementById("exportBtn"),
  exportDateWiseBtn: document.getElementById("exportDateWiseBtn"),
  
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
  loadTransactions();
  loadCustomers();
  updateDateWiseLedgerFilters();
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
  elements.exportBtn.addEventListener("click", exportCustomerLedger);
  elements.exportDateWiseBtn.addEventListener("click", exportDateWiseLedger);
  elements.viewLedgerBtn.addEventListener("click", loadDateWiseLedger);
  
  // Modal events
  elements.updateBtn.addEventListener("click", updateTransaction);
  elements.cancelBtn.addEventListener("click", closeModal);
  elements.closeBtn.addEventListener("click", closeModal);
  
  // Search and filters
  elements.searchInput.addEventListener("input", filterCustomers);
  elements.ledgerCustomerFilter.addEventListener("change", loadDateWiseLedger);
  elements.ledgerDateFilter.addEventListener("change", loadDateWiseLedger);
  
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
  if (tabName === 'customer-ledger') {
    loadCustomers();
  } else if (tabName === 'date-wise-ledger') {
    updateDateWiseLedgerFilters();
    loadDateWiseLedger();
  }
}

function loadTransactions() {
  transactions = JSON.parse(localStorage.getItem("transactions")) || [];
}

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function loadCustomerBalance() {
  const name = elements.nameInput.value.trim().toUpperCase();
  const mobile = elements.mobileInput.value.trim();
  
  if (name && mobile) {
    const balance = getCustomerBalance(name, mobile);
    elements.previousDueInput.value = balance;
    calculateNewDue();
  } else {
    elements.previousDueInput.value = '0';
    elements.newDueInput.value = '0';
  }
}

function getCustomerBalance(name, mobile) {
  const customerTransactions = transactions.filter(t => 
    t.name === name && t.mobile === mobile
  );
  
  if (customerTransactions.length === 0) return 0;
  
  // Return the latest balance
  const latestTransaction = customerTransactions[customerTransactions.length - 1];
  return latestTransaction.newDue;
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
  
  // Create transaction
  const transaction = {
    id: Date.now(),
    name,
    mobile,
    date,
    type,
    amount,
    description: description || `${type === 'credit' ? 'Purchase' : 'Payment'} of ₹${amount}`,
    previousDue,
    newDue,
    timestamp: new Date().toISOString()
  };
  
  // Add to transactions array
  transactions.push(transaction);
  
  // Sort by date to maintain chronological order
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Save to localStorage
  saveTransactions();
  
  // Clear form
  clearForm();
  
  // Update UI
  loadCustomers();
  updateDateWiseLedgerFilters();
  loadDateWiseLedger();
  updateSummary();
  
  showNotification("Transaction added successfully!", "success");
}

function loadCustomers() {
  elements.customerList.innerHTML = "";
  const customers = getUniqueCustomers();
  const searchTerm = elements.searchInput.value.toLowerCase();
  
  // Apply search filter
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm) || 
    customer.mobile.includes(searchTerm)
  );
  
  if (filteredCustomers.length === 0) {
    elements.customerList.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No customers found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  filteredCustomers.forEach(customer => {
    const row = document.createElement("tr");
    const balanceClass = customer.balance >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.mobile}</td>
      <td class="credit">₹${customer.totalCredit.toFixed(2)}</td>
      <td class="debit">₹${customer.totalDebit.toFixed(2)}</td>
      <td class="balance ${balanceClass}"><strong>₹${customer.balance.toFixed(2)}</strong></td>
      <td>${formatDate(customer.lastTransaction)}</td>
      <td>
        <button class="viewBtn" onclick="viewCustomerLedger('${customer.name}', '${customer.mobile}')">
          <i class="fas fa-eye"></i> View Ledger
        </button>
      </td>
    `;
    elements.customerList.appendChild(row);
  });
}

function getUniqueCustomers() {
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
        lastTransaction: transaction.date,
        transactions: []
      };
    }
    
    if (transaction.type === 'credit') {
      customers[key].totalCredit += transaction.amount;
    } else {
      customers[key].totalDebit += transaction.amount;
    }
    
    customers[key].balance = transaction.newDue;
    customers[key].transactions.push(transaction);
    
    // Update last transaction date
    if (new Date(transaction.date) > new Date(customers[key].lastTransaction)) {
      customers[key].lastTransaction = transaction.date;
    }
  });
  
  return Object.values(customers);
}

function updateDateWiseLedgerFilters() {
  const customers = getUniqueCustomers();
  
  // Update customer filter
  elements.ledgerCustomerFilter.innerHTML = '<option value="">All Customers</option>';
  customers.forEach(customer => {
    const option = document.createElement('option');
    option.value = `${customer.name}|${customer.mobile}`;
    option.textContent = `${customer.name} (${customer.mobile})`;
    elements.ledgerCustomerFilter.appendChild(option);
  });
}

function loadDateWiseLedger() {
  const customerFilter = elements.ledgerCustomerFilter.value;
  const dateFilter = elements.ledgerDateFilter.value;
  
  let filteredTransactions = [...transactions];
  
  // Apply customer filter
  if (customerFilter) {
    const [name, mobile] = customerFilter.split('|');
    filteredTransactions = filteredTransactions.filter(t => 
      t.name === name && t.mobile === mobile
    );
  }
  
  // Apply date filter
  if (dateFilter) {
    filteredTransactions = filteredTransactions.filter(t => t.date === dateFilter);
  }
  
  // Sort by date
  filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  displayDateWiseLedger(filteredTransactions, customerFilter);
}

function displayDateWiseLedger(filteredTransactions, customerFilter) {
  elements.dateWiseLedger.innerHTML = "";
  
  if (filteredTransactions.length === 0) {
    elements.dateWiseLedger.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          <i class="fas fa-inbox"></i>
          <p>No transactions found for selected criteria</p>
        </td>
      </tr>
    `;
    elements.ledgerSummary.innerHTML = "";
    return;
  }
  
  // Calculate summary
  let totalCredit = 0;
  let totalDebit = 0;
  
  filteredTransactions.forEach(transaction => {
    if (transaction.type === 'credit') {
      totalCredit += transaction.amount;
    } else {
      totalDebit += transaction.amount;
    }
  });
  
  // Display summary
  const summaryHTML = `
    <div class="ledger-summary-cards">
      <div class="summary-card">
        <i class="fas fa-arrow-up"></i>
        <div>
          <h4>Total Credit</h4>
          <span>₹${totalCredit.toFixed(2)}</span>
        </div>
      </div>
      <div class="summary-card">
        <i class="fas fa-arrow-down"></i>
        <div>
          <h4>Total Debit</h4>
          <span>₹${totalDebit.toFixed(2)}</span>
        </div>
      </div>
      <div class="summary-card">
        <i class="fas fa-balance-scale"></i>
        <div>
          <h4>Net Balance</h4>
          <span>₹${(totalCredit - totalDebit).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
  elements.ledgerSummary.innerHTML = summaryHTML;
  
  // Display transactions
  let runningBalance = 0;
  
  filteredTransactions.forEach((transaction, index) => {
    // Calculate running balance
    if (index === 0) {
      runningBalance = transaction.previousDue;
    }
    
    const row = document.createElement("tr");
    
    if (transaction.type === 'credit') {
      runningBalance += transaction.amount;
      row.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>${transaction.description}</td>
        <td class="credit">₹${transaction.amount.toFixed(2)}</td>
        <td>-</td>
        <td class="balance ${runningBalance >= 0 ? 'positive' : 'negative'}">₹${runningBalance.toFixed(2)}</td>
      `;
    } else {
      runningBalance = Math.max(0, runningBalance - transaction.amount);
      row.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>${transaction.description}</td>
        <td>-</td>
        <td class="debit">₹${transaction.amount.toFixed(2)}</td>
        <td class="balance ${runningBalance >= 0 ? 'positive' : 'negative'}">₹${runningBalance.toFixed(2)}</td>
      `;
    }
    
    elements.dateWiseLedger.appendChild(row);
  });
}

function viewCustomerLedger(name, mobile) {
  // Switch to date-wise ledger tab
  switchTab('date-wise-ledger');
  
  // Set the customer filter
  elements.ledgerCustomerFilter.value = `${name}|${mobile}`;
  
  // Load the ledger
  loadDateWiseLedger();
  
  showNotification(`Showing ledger for ${name} (${mobile})`, "success");
}

function filterCustomers() {
  loadCustomers();
}

function deleteTransaction(index) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  
  // Find the transaction to delete
  const transactionToDelete = transactions[index];
  
  // Remove from transactions array
  transactions.splice(index, 1);
  
  // Recalculate all balances after this transaction
  recalculateBalancesFromDate(transactionToDelete.date, transactionToDelete.name, transactionToDelete.mobile);
  
  // Save to localStorage
  saveTransactions();
  
  // Update UI
  loadCustomers();
  updateDateWiseLedgerFilters();
  loadDateWiseLedger();
  updateSummary();
  
  showNotification("Transaction deleted successfully!", "success");
}

function recalculateBalancesFromDate(startDate, customerName, customerMobile) {
  // Get all transactions for this customer from the start date
  const customerTransactions = transactions.filter(t => 
    t.name === customerName && 
    t.mobile === customerMobile && 
    new Date(t.date) >= new Date(startDate)
  );
  
  // Sort by date and time
  customerTransactions.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // Recalculate balances
  let runningBalance = 0;
  
  // Find the balance before the start date
  const transactionsBeforeDate = transactions.filter(t => 
    t.name === customerName && 
    t.mobile === customerMobile && 
    new Date(t.date) < new Date(startDate)
  );
  
  if (transactionsBeforeDate.length > 0) {
    const latestBefore = transactionsBeforeDate[transactionsBeforeDate.length - 1];
    runningBalance = latestBefore.newDue;
  }
  
  // Update balances
  customerTransactions.forEach(transaction => {
    transaction.previousDue = runningBalance;
    if (transaction.type === 'credit') {
      runningBalance += transaction.amount;
    } else {
      runningBalance = Math.max(0, runningBalance - transaction.amount);
    }
    transaction.newDue = runningBalance;
  });
}

function openEditModal(index) {
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
  
  // Update the transaction
  const oldTransaction = transactions[currentEditIndex];
  transactions[currentEditIndex] = {
    ...transactions[currentEditIndex],
    name,
    mobile,
    date,
    type,
    amount,
    description: description || `${type === 'credit' ? 'Purchase' : 'Payment'} of ₹${amount}`
  };
  
  // Sort by date to maintain chronological order
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Recalculate balances from the old transaction date
  recalculateBalancesFromDate(oldTransaction.date, oldTransaction.name, oldTransaction.mobile);
  
  // Save to localStorage
  saveTransactions();
  
  closeModal();
  loadCustomers();
  updateDateWiseLedgerFilters();
  loadDateWiseLedger();
  updateSummary();
  
  showNotification("Transaction updated successfully!", "success");
}

function clearAllRecords() {
  if (!confirm("Are you sure you want to delete all records? This action cannot be undone!")) return;
  
  transactions = [];
  localStorage.removeItem("transactions");
  loadCustomers();
  updateDateWiseLedgerFilters();
  loadDateWiseLedger();
  updateSummary();
  showNotification("All records deleted successfully!", "success");
}

function exportCustomerLedger() {
  const customers = getUniqueCustomers();
  if (customers.length === 0) {
    showNotification("No customer records to export!", "error");
    return;
  }
  
  let csv = "Customer Name,Mobile Number,Total Credit,Total Debit,Current Balance,Last Transaction\n";
  
  customers.forEach(customer => {
    csv += `"${customer.name}","${customer.mobile}","${customer.totalCredit.toFixed(2)}","${customer.totalDebit.toFixed(2)}","${customer.balance.toFixed(2)}","${formatDate(customer.lastTransaction)}"\n`;
  });
  
  downloadCSV(csv, `haji_customer_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  showNotification("Customer ledger exported successfully!", "success");
}

function exportDateWiseLedger() {
  const customerFilter = elements.ledgerCustomerFilter.value;
  const dateFilter = elements.ledgerDateFilter.value;
  
  let filteredTransactions = [...transactions];
  
  // Apply filters
  if (customerFilter) {
    const [name, mobile] = customerFilter.split('|');
    filteredTransactions = filteredTransactions.filter(t => 
      t.name === name && t.mobile === mobile
    );
  }
  
  if (dateFilter) {
    filteredTransactions = filteredTransactions.filter(t => t.date === dateFilter);
  }
  
  if (filteredTransactions.length === 0) {
    showNotification("No transactions to export!", "error");
    return;
  }
  
  // Sort by date
  filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let csv = "Date,Description,Credit (₹),Debit (₹),Balance (₹)\n";
  
  let runningBalance = 0;
  filteredTransactions.forEach((transaction, index) => {
    if (index === 0) {
      runningBalance = transaction.previousDue;
    }
    
    if (transaction.type === 'credit') {
      runningBalance += transaction.amount;
      csv += `"${formatDate(transaction.date)}","${transaction.description}","${transaction.amount.toFixed(2)}","-","${runningBalance.toFixed(2)}"\n`;
    } else {
      runningBalance = Math.max(0, runningBalance - transaction.amount);
      csv += `"${formatDate(transaction.date)}","${transaction.description}","-","${transaction.amount.toFixed(2)}","${runningBalance.toFixed(2)}"\n`;
    }
  });
  
  const filename = customerFilter ? 
    `haji_ledger_${customerFilter.split('|')[0]}_${new Date().toISOString().split('T')[0]}.csv` :
    `haji_date_wise_ledger_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
  showNotification("Date-wise ledger exported successfully!", "success");
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
  const customers = getUniqueCustomers();
  
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
