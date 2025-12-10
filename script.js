// Global Variables
let customers = [];
let selectedCustomerId = null;
let editingEntryId = null;
let currentEntryType = 'credit';
let currentEditEntryType = 'credit';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setTodayDate();
});

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const entryDateInput = document.getElementById('entryDate');
    if (entryDateInput) {
        entryDateInput.value = today;
    }
}

// Storage Functions
async function loadData() {
    try {
        const result = await window.storage.get('ledger-customers-data');
        if (result && result.value) {
            customers = JSON.parse(result.value);
            renderDashboard();
            updateStats();
        }
    } catch (error) {
        console.log('No existing data found');
        customers = [];
        renderDashboard();
    }
}

async function saveData() {
    try {
        await window.storage.set('ledger-customers-data', JSON.stringify(customers));
    } catch (error) {
        console.error('Error saving data:', error);
        alert('डेटा सेव करने में समस्या आई');
    }
}

// Customer Management
function showAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.add('active');
    document.getElementById('newCustomerName').focus();
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.remove('active');
    document.getElementById('newCustomerName').value = '';
    document.getElementById('newCustomerMobile').value = '';
    document.getElementById('newCustomerAddress').value = '';
    document.getElementById('newCustomerOpeningBalance').value = '';
}

function addCustomer() {
    const name = document.getElementById('newCustomerName').value.trim();
    const mobile = document.getElementById('newCustomerMobile').value.trim();
    const address = document.getElementById('newCustomerAddress').value.trim();
    const openingBalance = parseFloat(document.getElementById('newCustomerOpeningBalance').value) || 0;
    
    if (!name || !mobile) {
        alert('कृपया नाम और मोबाइल नंबर भरें');
        return;
    }
    
    const customer = {
        id: Date.now(),
        name,
        mobile,
        address,
        entries: [],
        openingBalance: openingBalance,
        createdAt: new Date().toISOString()
    };
    
    // Add opening balance entry if provided
    if (openingBalance !== 0) {
        customer.entries.push({
            id: Date.now() + 1,
            date: new Date().toISOString().split('T')[0],
            type: openingBalance > 0 ? 'credit' : 'debit',
            amount: Math.abs(openingBalance),
            description: 'Opening Balance',
            timestamp: new Date().toISOString()
        });
    }
    
    customers.push(customer);
    saveData();
    renderDashboard();
    updateStats();
    closeAddCustomerModal();
}

function deleteCustomer(id, event) {
    event.stopPropagation();
    
    if (!confirm('क्या आप इस ग्राहक को हटाना चाहते हैं? सभी एंट्री भी डिलीट हो जाएंगी।')) return;
    
    customers = customers.filter(c => c.id !== id);
    saveData();
    renderDashboard();
    updateStats();
}

function filterCustomers() {
    renderDashboard();
}

function renderDashboard() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.mobile.includes(searchTerm) ||
        c.entries.some(e => e.date.includes(searchTerm) || (e.description && e.description.toLowerCase().includes(searchTerm)))
    );
    
    const grid = document.getElementById('customerGrid');
    
    if (filteredCustomers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p>कोई ग्राहक नहीं मिला</p>
                <button class="btn-primary" onclick="showAddCustomerModal()">पहला ग्राहक जोड़ें</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredCustomers.map(customer => {
        const totals = calculateCustomerTotals(customer);
        return `
            <div class="customer-card" onclick="showLedger(${customer.id})">
                <div class="customer-card-header">
                    <div class="customer-info">
                        <h3>${customer.name}</h3>
                        <p>📱 ${customer.mobile}</p>
                        ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    </div>
                    <button class="delete-btn" onclick="deleteCustomer(${customer.id}, event)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="customer-balance-info">
                    <div class="balance-mini">
                        <p class="balance-mini-label">जमा (Cr)</p>
                        <p class="balance-mini-value credit">${formatCurrency(totals.credit)}</p>
                    </div>
                    <div class="balance-mini">
                        <p class="balance-mini-label">नामे (Dr)</p>
                        <p class="balance-mini-value debit">${formatCurrency(totals.debit)}</p>
                    </div>
                    <div class="entry-count">${customer.entries.length} एंट्री</div>
                </div>
            </div>
        `;
    }).join('');
}

// Ledger View
function showLedger(customerId) {
    selectedCustomerId = customerId;
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;
    
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('ledgerView').style.display = 'block';
    
    // Update customer info
    document.getElementById('ledgerCustomerName').textContent = customer.name;
    document.getElementById('ledgerCustomerMobile').textContent = '📱 ' + customer.mobile;
    
    if (customer.address) {
        document.getElementById('ledgerCustomerAddress').textContent = '📍 ' + customer.address;
        document.getElementById('ledgerCustomerAddress').style.display = 'block';
    } else {
        document.getElementById('ledgerCustomerAddress').style.display = 'none';
    }
    
    // Clear date filters
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    
    renderLedger();
}

function showDashboard() {
    selectedCustomerId = null;
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('ledgerView').style.display = 'none';
}

function renderLedger() {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    
    // Filter entries by date if filters are set
    let filteredEntries = [...customer.entries];
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    
    if (fromDate) {
        filteredEntries = filteredEntries.filter(e => e.date >= fromDate);
    }
    if (toDate) {
        filteredEntries = filteredEntries.filter(e => e.date <= toDate);
    }
    
    // Sort by date
    filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate totals
    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    const tableBody = document.getElementById('ledgerTableBody');
    
    if (filteredEntries.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: #999;">
                    कोई एंट्री नहीं मिली
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = filteredEntries.map(entry => {
            if (entry.type === 'credit') {
                totalCredit += entry.amount;
                runningBalance += entry.amount;
            } else {
                totalDebit += entry.amount;
                runningBalance -= entry.amount;
            }
            
            return `
                <tr>
                    <td>${formatDate(entry.date)}</td>
                    <td>${entry.description || '-'}</td>
                    <td class="text-right ${entry.type === 'debit' ? 'amount-debit' : ''}">${entry.type === 'debit' ? formatCurrency(entry.amount) : '-'}</td>
                    <td class="text-right ${entry.type === 'credit' ? 'amount-credit' : ''}">${entry.type === 'credit' ? formatCurrency(entry.amount) : '-'}</td>
                    <td class="text-right amount-balance">${formatCurrency(runningBalance)}</td>
                    <td class="text-center">
                        <div class="entry-actions">
                            <button class="action-btn edit" onclick="showEditEntryModal(${entry.id})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="action-btn delete" onclick="deleteEntry(${entry.id})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Update summary
    document.getElementById('customerTotalCredit').textContent = formatCurrency(totalCredit);
    document.getElementById('customerTotalDebit').textContent = formatCurrency(totalDebit);
    document.getElementById('customerBalance').textContent = formatCurrency(runningBalance);
}

// Entry Management
function showAddEntryModal() {
    currentEntryType = 'credit';
    document.getElementById('addEntryModal').classList.add('active');
    setTodayDate();
    
    // Reset buttons
    const buttons = document.querySelectorAll('#addEntryModal .type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === 'credit') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.getElementById('entryAmount').focus();
}

function closeAddEntryModal() {
    document.getElementById('addEntryModal').classList.remove('active');
    document.getElementById('entryAmount').value = '';
    document.getElementById('entryDescription').value = '';
    setTodayDate();
}

function selectEntryType(type) {
    currentEntryType = type;
    const buttons = document.querySelectorAll('#addEntryModal .type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function addEntry() {
    const date = document.getElementById('entryDate').value;
    const amount = parseFloat(document.getElementById('entryAmount').value);
    const description = document.getElementById('entryDescription').value.trim();
    
    if (!date) {
        alert('कृपया तारीख चुनें');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('कृपया सही राशि भरें');
        return;
    }
    
    const entry = {
        id: Date.now(),
        date,
        type: currentEntryType,
        amount,
        description,
        timestamp: new Date().toISOString()
    };
    
    const customerIndex = customers.findIndex(c => c.id === selectedCustomerId);
    if (customerIndex === -1) return;
    
    customers[customerIndex].entries.push(entry);
    saveData();
    renderLedger();
    updateStats();
    closeAddEntryModal();
}

function showEditEntryModal(entryId) {
    editingEntryId = entryId;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const entry = customer.entries.find(e => e.id === entryId);
    
    if (!entry) return;
    
    currentEditEntryType = entry.type;
    document.getElementById('editEntryDate').value = entry.date;
    document.getElementById('editEntryAmount').value = entry.amount;
    document.getElementById('editEntryDescription').value = entry.description || '';
    
    // Update buttons
    const buttons = document.querySelectorAll('#editEntryModal .type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === entry.type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.getElementById('editEntryModal').classList.add('active');
}

function closeEditEntryModal() {
    document.getElementById('editEntryModal').classList.remove('active');
    editingEntryId = null;
}

function selectEditEntryType(type) {
    currentEditEntryType = type;
    const buttons = document.querySelectorAll('#editEntryModal .type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateEntry() {
    const date = document.getElementById('editEntryDate').value;
    const amount = parseFloat(document.getElementById('editEntryAmount').value);
    const description = document.getElementById('editEntryDescription').value.trim();
    
    if (!date) {
        alert('कृपया तारीख चुनें');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('कृपया सही राशि भरें');
        return;
    }
    
    const customerIndex = customers.findIndex(c => c.id === selectedCustomerId);
    if (customerIndex === -1) return;
    
    const entryIndex = customers[customerIndex].entries.findIndex(e => e.id === editingEntryId);
    if (entryIndex === -1) return;
    
    customers[customerIndex].entries[entryIndex] = {
        ...customers[customerIndex].entries[entryIndex],
        date,
        type: currentEditEntryType,
        amount,
        description
    };
    
    saveData();
    renderLedger();
    updateStats();
    closeEditEntryModal();
}

function deleteEntry(entryId) {
    if (!confirm('क्या आप इस एंट्री को हटाना चाहते हैं?')) return;
    
    const customerIndex = customers.findIndex(c => c.id === selectedCustomerId);
    if (customerIndex === -1) return;
    
    customers[customerIndex].entries = customers[customerIndex].entries.filter(e => e.id !== entryId);
    
    saveData();
    renderLedger();
    updateStats();
}

// Date Filter
function filterLedgerByDate() {
    renderLedger();
}

function clearDateFilter() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    renderLedger();
}

// Utility Functions
function calculateCustomerTotals(customer) {
    let credit = 0;
    let debit = 0;
    
    customer.entries.forEach(entry => {
        if (entry.type === 'credit') {
            credit += entry.amount;
        } else {
            debit += entry.amount;
        }
    });
    
    return { credit, debit, balance: credit - debit };
}

function updateStats() {
    const totalCustomers = customers.length;
    let totalCredit = 0;
    let totalDebit = 0;
    
    customers.forEach(customer => {
        const totals = calculateCustomerTotals(customer);
        totalCredit += totals.credit;
        totalDebit += totals.debit;
    });
    
    const netBalance = totalCredit - totalDebit;
    
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('totalCredit').textContent = formatCurrency(totalCredit);
    document.getElementById('totalDebit').textContent = formatCurrency(totalDebit);
    document.getElementById('netBalance').textContent = formatCurrency(netBalance);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('hi-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Math.abs(amount));
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hi-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Export/Import Functions
function exportData() {
    const dataStr = JSON.stringify(customers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer-ledger-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert('गलत फ़ाइल फ़ॉर्मेट');
                return;
            }
            customers = imported;
            saveData();
            renderDashboard();
            updateStats();
            alert('डेटा सफलतापूर्वक आयात किया गया');
            event.target.value = '';
        } catch (error) {
            alert('गलत फ़ाइल फ़ॉर्मेट');
        }
    };
    reader.readAsText(file);
}

// Print Functions
function printLedger() {
    window.print();
}

function printCustomerLedger() {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    const entries = [...customer.entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    const entriesHTML = entries.map(entry => {
        if (entry.type === 'credit') {
            totalCredit += entry.amount;
            runningBalance += entry.amount;
        } else {
            totalDebit += entry.amount;
            runningBalance -= entry.amount;
        }
        
        return `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.description || '-'}</td>
                <td style="text-align: right;">${entry.type === 'debit' ? formatCurrency(entry.amount) : '-'}</td>
                <td style="text-align: right;">${entry.type === 'credit' ? formatCurrency(entry.amount) : '-'}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(runningBalance)}</td>
            </tr>
        `;
    }).join('');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ledger - ${customer.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }
                h1 {
                    text-align: center;
                    color: #333;
                }
                .customer-info {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background: #667eea;
                    color: white;
                }
                tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .summary {
                    margin-top: 30px;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    font-size: 18px;
                }
                .summary-item.total {
                    font-weight: bold;
                    font-size: 20px;
                    border-top: 2px solid #333;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <h1>Customer Ledger</h1>
            <div class="customer-info">
                <p><strong>नाम:</strong> ${customer.name}</p>
                <p><strong>मोबाइल:</strong> ${customer.mobile}</p>
                ${customer.address ? `<p><strong>पता:</strong> ${customer.address}</p>` : ''}
                <p><strong>तारीख:</strong> ${new Date().toLocaleDateString('hi-IN')}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>तारीख</th>
                        <th>विवरण</th>
                        <th style="text-align: right;">नामे (Debit)</th>
                        <th style="text-align: right;">जमा (Credit)</th>
                        <th style="text-align: right;">शेष राशि</th>
                    </tr>
                </thead>
                <tbody>
                    ${entriesHTML}
                </tbody>
            </table>
            
            <div class="summary">
                <div class="summary-item">
                    <span>कुल जमा (Credit):</span>
                    <span style="color: #10b981;">${formatCurrency(totalCredit)}</span>
                </div>
                <div class="summary-item">
                    <span>कुल नामे (Debit):</span>
                    <span style="color: #ef4444;">${formatCurrency(totalDebit)}</span>
                </div>
                <div class="summary-item total">
                    <span>शेष राशि (Balance):</span>
                    <span style="color: #764ba2;">${formatCurrency(runningBalance)}</span>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}
