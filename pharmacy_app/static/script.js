// Pharmacy POS System - Modular JavaScript
// Author: AI Assistant
// Version: 1.0

/**
 * Core Application Module
 */
const PharmacyApp = {
    // Application state
    state: {
        currentInvoice: {
            items: [],
            patient: {},
            subtotal: 0,
            discount: 0,
            total: 0
        },
        pendingItem: null,
        searchResults: [],
        patients: [],
        isLoading: false
    },

    // Initialize the application
    init() {
        this.bindEvents();
        this.loadPatients();
        this.resetInvoice();
        console.log('Pharmacy POS System initialized');
    },

    // Bind all event listeners
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('medicineSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
            searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
        }

        // Patient selection
        const patientSelect = document.getElementById('patientSelect');
        if (patientSelect) {
            patientSelect.addEventListener('change', this.handlePatientSelect.bind(this));
        }

        // Discount input
        const discountInput = document.getElementById('discountAmount');
        if (discountInput) {
            discountInput.addEventListener('input', this.calculateTotals.bind(this));
        }

        // Form submissions
        const saveInvoiceBtn = document.getElementById('saveInvoice');
        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', this.saveInvoice.bind(this));
        }

        // Click outside to close dropdowns
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },

    // Debounce utility function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Handle medicine search
    async handleSearch(event) {
        const query = event.target.value.trim();
        const dropdown = document.getElementById('searchDropdown');

        if (query.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`/api/search_medicines?q=${encodeURIComponent(query)}`);
            const medicines = await response.json();
            this.state.searchResults = medicines;
            this.renderSearchResults(medicines);
        } catch (error) {
            console.error('Search error:', error);
            this.showAlert('Search failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    // Handle search keyboard navigation
    handleSearchKeydown(event) {
        const dropdown = document.getElementById('searchDropdown');
        const items = dropdown.querySelectorAll('.search-item');
        const selectedItem = dropdown.querySelector('.search-item.selected');

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (selectedItem) {
                    const next = selectedItem.nextElementSibling;
                    if (next) {
                        selectedItem.classList.remove('selected');
                        next.classList.add('selected');
                        next.scrollIntoView({ block: 'nearest' });
                    }
                } else if (items.length > 0) {
                    items[0].classList.add('selected');
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (selectedItem) {
                    const prev = selectedItem.previousElementSibling;
                    if (prev) {
                        selectedItem.classList.remove('selected');
                        prev.classList.add('selected');
                        prev.scrollIntoView({ block: 'nearest' });
                    }
                }
                break;

            case 'Enter':
                event.preventDefault();
                if (selectedItem) {
                    const medicineId = selectedItem.dataset.medicineId;
                    this.selectMedicine(medicineId);
                }
                break;

            case 'Escape':
                dropdown.classList.add('hidden');
                break;
        }
    },

    // Render search results
    renderSearchResults(medicines) {
        const dropdown = document.getElementById('searchDropdown');
        
        if (medicines.length === 0) {
            dropdown.innerHTML = '<div class="px-4 py-3 text-gray-500">No medicines found</div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = medicines.map(medicine => `
            <div class="search-item" data-medicine-id="${medicine.id}" onclick="PharmacyApp.selectMedicine(${medicine.id})">
                <div class="font-medium text-gray-900">
                    ${medicine.sortedName || medicine.name}
                </div>
                <div class="text-sm text-gray-600">
                    ${medicine.company} • ${medicine.strength} • ${medicine.package_size}
                </div>
                <div class="text-sm font-medium text-blue-600">
                    ৳${medicine.price}
                </div>
            </div>
        `).join('');

        dropdown.classList.remove('hidden');
    },

    // Select medicine from search
    selectMedicine(medicineId) {
        const medicine = this.state.searchResults.find(m => m.id == medicineId);
        if (!medicine) return;

        this.state.pendingItem = {
            ...medicine,
            quantity: 1,
            total: medicine.price
        };

        this.renderPendingItem();
        this.clearSearch();
    },

    // Render pending item panel
    renderPendingItem() {
        const panel = document.getElementById('pendingItemPanel');
        const item = this.state.pendingItem;

        if (!item) {
            panel.classList.add('hidden');
            return;
        }

        panel.innerHTML = `
            <div class="pending-item">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-medium text-gray-900">${item.sortedName || item.name}</h4>
                        <p class="text-sm text-gray-600">${item.company} • ${item.package_size}</p>
                    </div>
                    <button onclick="PharmacyApp.clearPendingItem()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input type="number" id="pendingQuantity" value="${item.quantity}" min="1" 
                               class="form-input" onchange="PharmacyApp.updatePendingQuantity(this.value)">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                        <input type="text" value="৳${item.price}" class="form-input" readonly>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
                        <input type="text" value="৳${item.total.toFixed(2)}" class="form-input" readonly>
                    </div>
                </div>
                <button onclick="PharmacyApp.addToCart()" class="btn btn-primary w-full">
                    Add to Bill
                </button>
            </div>
        `;

        panel.classList.remove('hidden');
        document.getElementById('pendingQuantity').focus();
    },

    // Update pending item quantity
    updatePendingQuantity(quantity) {
        if (this.state.pendingItem) {
            this.state.pendingItem.quantity = parseInt(quantity) || 1;
            this.state.pendingItem.total = this.state.pendingItem.price * this.state.pendingItem.quantity;
            this.renderPendingItem();
        }
    },

    // Add pending item to cart
    addToCart() {
        if (!this.state.pendingItem) return;

        const existingItemIndex = this.state.currentInvoice.items.findIndex(
            item => item.id === this.state.pendingItem.id
        );

        if (existingItemIndex !== -1) {
            // Add to existing item
            this.state.currentInvoice.items[existingItemIndex].quantity += this.state.pendingItem.quantity;
            this.state.currentInvoice.items[existingItemIndex].total = 
                this.state.currentInvoice.items[existingItemIndex].quantity * 
                this.state.currentInvoice.items[existingItemIndex].price;
        } else {
            // Add as new item
            this.state.currentInvoice.items.push({
                id: this.state.pendingItem.id,
                name: this.state.pendingItem.sortedName || this.state.pendingItem.name,
                price: this.state.pendingItem.price,
                quantity: this.state.pendingItem.quantity,
                total: this.state.pendingItem.total,
                package_size: this.state.pendingItem.package_size
            });
        }

        this.clearPendingItem();
        this.renderCart();
        this.calculateTotals();
        this.showAlert('Item added to bill', 'success');
    },

    // Clear pending item
    clearPendingItem() {
        this.state.pendingItem = null;
        document.getElementById('pendingItemPanel').classList.add('hidden');
    },

    // Clear search
    clearSearch() {
        document.getElementById('medicineSearch').value = '';
        document.getElementById('searchDropdown').classList.add('hidden');
    },

    // Render cart items
    renderCart() {
        const cartContainer = document.getElementById('cartItems');
        const items = this.state.currentInvoice.items;

        if (items.length === 0) {
            cartContainer.innerHTML = '<div class="text-gray-500 text-center py-8">No items in bill</div>';
            return;
        }

        cartContainer.innerHTML = items.map((item, index) => `
            <div class="cart-item">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">${item.name}</h4>
                    <p class="text-sm text-gray-600">${item.package_size || ''}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="PharmacyApp.updateItemQuantity(${index}, ${item.quantity - 1})" 
                                class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                            </svg>
                        </button>
                        <span class="w-8 text-center">${item.quantity}</span>
                        <button onclick="PharmacyApp.updateItemQuantity(${index}, ${item.quantity + 1})" 
                                class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="text-right">
                        <div class="font-medium">৳${item.total.toFixed(2)}</div>
                        <div class="text-sm text-gray-600">৳${item.price} each</div>
                    </div>
                    <button onclick="PharmacyApp.removeItem(${index})" 
                            class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Update item quantity
    updateItemQuantity(index, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(index);
            return;
        }

        this.state.currentInvoice.items[index].quantity = newQuantity;
        this.state.currentInvoice.items[index].total = 
            this.state.currentInvoice.items[index].price * newQuantity;

        this.renderCart();
        this.calculateTotals();
    },

    // Remove item from cart
    removeItem(index) {
        this.state.currentInvoice.items.splice(index, 1);
        this.renderCart();
        this.calculateTotals();
        this.showAlert('Item removed', 'warning');
    },

    // Calculate totals
    calculateTotals() {
        const items = this.state.currentInvoice.items;
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const discountInput = document.getElementById('discountAmount');
        const discount = parseFloat(discountInput?.value || 0);
        const total = subtotal - discount;

        this.state.currentInvoice.subtotal = subtotal;
        this.state.currentInvoice.discount = discount;
        this.state.currentInvoice.total = Math.max(0, total);

        this.renderTotals();
    },

    // Render totals
    renderTotals() {
        const invoice = this.state.currentInvoice;
        
        document.getElementById('subtotalAmount').textContent = `৳${invoice.subtotal.toFixed(2)}`;
        document.getElementById('discountAmount').value = invoice.discount.toFixed(2);
        document.getElementById('totalAmount').textContent = `৳${invoice.total.toFixed(2)}`;
    },

    // Load patients for dropdown
    async loadPatients() {
        try {
            const response = await fetch('/api/patients');
            const patients = await response.json();
            this.state.patients = patients;
            this.renderPatientsDropdown();
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    },

    // Render patients dropdown
    renderPatientsDropdown() {
        const select = document.getElementById('patientSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select existing patient or enter new</option>' +
            this.state.patients.map(patient => 
                `<option value="${patient.name}" data-phone="${patient.phone}" data-address="${patient.address}" 
                         data-bed-no="${patient.bed_no}" data-care-of="${patient.care_of}">
                    ${patient.name} ${patient.phone ? '- ' + patient.phone : ''}
                </option>`
            ).join('');
    },

    // Handle patient selection
    handlePatientSelect(event) {
        const option = event.target.selectedOptions[0];
        if (option && option.value) {
            document.getElementById('patientName').value = option.value;
            document.getElementById('patientPhone').value = option.dataset.phone || '';
            document.getElementById('patientAddress').value = option.dataset.address || '';
            document.getElementById('patientBedNo').value = option.dataset.bedNo || '';
            document.getElementById('patientCareOf').value = option.dataset.careOf || '';
        }
    },

    // Save invoice
    async saveInvoice() {
        if (this.state.currentInvoice.items.length === 0) {
            this.showAlert('Please add items to the bill', 'warning');
            return;
        }

        const patientName = document.getElementById('patientName').value.trim();
        if (!patientName) {
            this.showAlert('Please enter patient name', 'warning');
            return;
        }

        this.showLoading();

        const invoiceData = {
            items: this.state.currentInvoice.items,
            patient: {
                name: patientName,
                phone: document.getElementById('patientPhone').value.trim(),
                address: document.getElementById('patientAddress').value.trim(),
                bed_no: document.getElementById('patientBedNo').value.trim(),
                care_of: document.getElementById('patientCareOf').value.trim()
            },
            subtotal: this.state.currentInvoice.subtotal,
            discount: this.state.currentInvoice.discount,
            total: this.state.currentInvoice.total
        };

        try {
            const response = await fetch('/api/save_invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoiceData)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(`Invoice ${result.invoice_number} saved successfully!`, 'success');
                
                // Open print window
                const printWindow = window.open(`/invoice?id=${result.invoice_id}`, '_blank');
                printWindow.onload = () => {
                    setTimeout(() => printWindow.print(), 100);
                };

                // Reset for next invoice
                this.resetInvoice();
                this.loadPatients(); // Refresh patients list
            } else {
                this.showAlert('Failed to save invoice: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showAlert('Failed to save invoice. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    // Reset invoice
    resetInvoice() {
        this.state.currentInvoice = {
            items: [],
            patient: {},
            subtotal: 0,
            discount: 0,
            total: 0
        };

        // Clear form
        document.getElementById('patientName').value = '';
        document.getElementById('patientPhone').value = '';
        document.getElementById('patientAddress').value = '';
        document.getElementById('patientBedNo').value = '';
        document.getElementById('patientCareOf').value = '';
        document.getElementById('patientSelect').value = '';
        document.getElementById('discountAmount').value = '0';

        this.clearPendingItem();
        this.clearSearch();
        this.renderCart();
        this.calculateTotals();
    },

    // Handle outside clicks
    handleOutsideClick(event) {
        const dropdown = document.getElementById('searchDropdown');
        const searchInput = document.getElementById('medicineSearch');
        
        if (dropdown && !dropdown.contains(event.target) && event.target !== searchInput) {
            dropdown.classList.add('hidden');
        }
    },

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl+S to save invoice
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.saveInvoice();
        }
        
        // Ctrl+F to focus search
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            document.getElementById('medicineSearch').focus();
        }
        
        // Escape to clear search
        if (event.key === 'Escape') {
            this.clearSearch();
            this.clearPendingItem();
        }
    },

    // Show loading state
    showLoading() {
        this.state.isLoading = true;
        document.body.classList.add('loading');
    },

    // Hide loading state
    hideLoading() {
        this.state.isLoading = false;
        document.body.classList.remove('loading');
    },

    // Show alert
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} fade-in`;
        alert.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-current opacity-70 hover:opacity-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        alertContainer.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    },

    // Create alert container
    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }
};

/**
 * History Management Module
 */
const HistoryManager = {
    // Search invoices
    async searchInvoices() {
        const query = document.getElementById('historySearch').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        try {
            const response = await fetch(`/api/search_invoices?${params}`);
            const invoices = await response.json();
            this.renderInvoiceHistory(invoices);
        } catch (error) {
            console.error('Search error:', error);
            PharmacyApp.showAlert('Search failed', 'error');
        }
    },

    // Render invoice history
    renderInvoiceHistory(invoices) {
        const container = document.getElementById('invoiceHistory');
        
        if (invoices.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No invoices found</div>';
            return;
        }

        container.innerHTML = invoices.map(invoice => `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-lg">${invoice.invoice_number}</h3>
                            <p class="text-gray-600">${invoice.patient_name}</p>
                            <p class="text-sm text-gray-500">${new Date(invoice.created_at).toLocaleString()}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-xl font-bold text-green-600">৳${invoice.total}</div>
                            <div class="space-x-2 mt-2">
                                <button onclick="HistoryManager.reprintInvoice(${invoice.id})" 
                                        class="btn btn-outline btn-sm">
                                    Print
                                </button>
                                <button onclick="HistoryManager.viewInvoice(${invoice.id})" 
                                        class="btn btn-primary btn-sm">
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Reprint invoice
    async reprintInvoice(invoiceId) {
        const printWindow = window.open(`/invoice?id=${invoiceId}`, '_blank');
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 100);
        };
    },

    // View invoice details
    async viewInvoice(invoiceId) {
        try {
            const response = await fetch(`/api/get_invoice/${invoiceId}`);
            const data = await response.json();
            
            if (data.error) {
                PharmacyApp.showAlert(data.error, 'error');
                return;
            }

            this.showInvoiceModal(data.invoice, data.items);
        } catch (error) {
            console.error('View error:', error);
            PharmacyApp.showAlert('Failed to load invoice', 'error');
        }
    },

    // Show invoice modal
    showInvoiceModal(invoice, items) {
        const modal = document.getElementById('invoiceModal');
        const content = document.getElementById('invoiceModalContent');
        
        content.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold">${invoice.invoice_number}</h2>
                    <button onclick="HistoryManager.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 class="font-medium mb-2">Patient Information</h3>
                        <p><strong>Name:</strong> ${invoice.patient_name}</p>
                        <p><strong>Phone:</strong> ${invoice.patient_phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${invoice.patient_address || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 class="font-medium mb-2">Invoice Details</h3>
                        <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString()}</p>
                        <p><strong>Total:</strong> ৳${invoice.total}</p>
                        <p><strong>Discount:</strong> ৳${invoice.discount}</p>
                    </div>
                </div>

                <div class="mb-4">
                    <h3 class="font-medium mb-2">Items</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.medicine_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>৳${item.unit_price}</td>
                                    <td>৳${item.total_price}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end space-x-2">
                    <button onclick="HistoryManager.reprintInvoice(${invoice.id})" class="btn btn-primary">
                        Print Invoice
                    </button>
                    <button onclick="HistoryManager.closeModal()" class="btn btn-outline">
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    // Close modal
    closeModal() {
        document.getElementById('invoiceModal').classList.add('hidden');
    }
};

/**
 * Reports Module
 */
const ReportsManager = {
    // Load trending medicines
    async loadTrendingMedicines(days = 7) {
        try {
            const response = await fetch(`/api/reports/trending?days=${days}`);
            const trending = await response.json();
            this.renderTrendingMedicines(trending);
        } catch (error) {
            console.error('Reports error:', error);
            PharmacyApp.showAlert('Failed to load reports', 'error');
        }
    },

    // Load sales statistics
    async loadSalesStats(days = 30) {
        try {
            const response = await fetch(`/api/reports/stats?days=${days}`);
            const data = await response.json();
            this.renderSalesStats(data.stats, data.top_medicines);
        } catch (error) {
            console.error('Stats error:', error);
            PharmacyApp.showAlert('Failed to load statistics', 'error');
        }
    },

    // Render trending medicines
    renderTrendingMedicines(trending) {
        const container = document.getElementById('trendingMedicines');
        
        if (trending.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No data available</div>';
            return;
        }

        container.innerHTML = trending.map((medicine, index) => `
            <div class="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        ${index + 1}
                    </div>
                    <div>
                        <h4 class="font-medium">${medicine.sortedName || medicine.name}</h4>
                        <p class="text-sm text-gray-600">${medicine.company}</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-green-600">${medicine.total_sold} sold</div>
                    <div class="text-sm text-gray-500">${medicine.days_sold} days</div>
                </div>
            </div>
        `).join('');
    },

    // Render sales statistics
    renderSalesStats(stats, topMedicines) {
        // Stats cards
        document.getElementById('totalSales').textContent = `৳${(stats.total_sales || 0).toFixed(2)}`;
        document.getElementById('totalInvoices').textContent = stats.total_invoices || 0;
        document.getElementById('averageBill').textContent = `৳${(stats.average_bill || 0).toFixed(2)}`;
        document.getElementById('uniquePatients').textContent = stats.unique_patients || 0;

        // Top medicines
        const topContainer = document.getElementById('topMedicines');
        topContainer.innerHTML = topMedicines.map((medicine, index) => `
            <div class="flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0">
                <div class="flex items-center">
                    <span class="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        ${index + 1}
                    </span>
                    <span class="font-medium">${medicine.sortedName || medicine.name}</span>
                </div>
                <div class="text-right">
                    <div class="font-medium text-green-600">৳${medicine.total_revenue}</div>
                    <div class="text-sm text-gray-500">${medicine.total_quantity} units</div>
                </div>
            </div>
        `).join('');
    }
};

/**
 * Medicine Management Module
 */
const MedicineManager = {
    medicines: [],

    // Load all medicines
    async loadMedicines() {
        try {
            const response = await fetch('/api/medicines');
            this.medicines = await response.json();
            this.renderMedicinesTable();
        } catch (error) {
            console.error('Load medicines error:', error);
            PharmacyApp.showAlert('Failed to load medicines', 'error');
        }
    },

    // Render medicines table
    renderMedicinesTable() {
        const container = document.getElementById('medicinesTable');
        
        if (this.medicines.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No medicines found</div>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Generic</th>
                        <th>Strength</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.medicines.map(medicine => `
                        <tr>
                            <td>
                                <div class="font-medium">${medicine.name}</div>
                                <div class="text-sm text-gray-600">${medicine.sortedName || ''}</div>
                            </td>
                            <td>${medicine.company}</td>
                            <td>${medicine.generic}</td>
                            <td>${medicine.strength}</td>
                            <td>৳${medicine.price}</td>
                            <td>${medicine.stock_level || 0}</td>
                            <td>
                                <div class="space-x-2">
                                    <button onclick="MedicineManager.editMedicine(${medicine.id})" 
                                            class="btn btn-outline btn-sm">Edit</button>
                                    <button onclick="MedicineManager.deleteMedicine(${medicine.id})" 
                                            class="btn btn-danger btn-sm">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // Show medicine form
    showMedicineForm(medicine = null) {
        const modal = document.getElementById('medicineModal');
        const form = document.getElementById('medicineForm');
        
        // Reset form
        form.reset();
        
        if (medicine) {
            document.getElementById('medicineId').value = medicine.id;
            document.getElementById('medicineName').value = medicine.name;
            document.getElementById('medicineStrength').value = medicine.strength || '';
            document.getElementById('medicineGeneric').value = medicine.generic || '';
            document.getElementById('medicineSubGeneric').value = medicine.sub_generic || '';
            document.getElementById('medicineDosageForm').value = medicine.dosage_form || '';
            document.getElementById('medicineCompany').value = medicine.company || '';
            document.getElementById('medicinePackageSize').value = medicine.package_size || '';
            document.getElementById('medicinePrice').value = medicine.price;
            document.getElementById('medicineSortedName').value = medicine.sortedName || '';
            document.getElementById('medicineStockLevel').value = medicine.stock_level || 0;
        }

        modal.classList.remove('hidden');
    },

    // Save medicine
    async saveMedicine() {
        const form = document.getElementById('medicineForm');
        const formData = new FormData(form);
        
        const medicineData = {
            id: formData.get('id') || null,
            name: formData.get('name'),
            strength: formData.get('strength'),
            generic: formData.get('generic'),
            sub_generic: formData.get('sub_generic'),
            dosage_form: formData.get('dosage_form'),
            company: formData.get('company'),
            package_size: formData.get('package_size'),
            price: parseFloat(formData.get('price')),
            sortedName: formData.get('sortedName'),
            stock_level: parseInt(formData.get('stock_level'))
        };

        try {
            const response = await fetch('/api/save_medicine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(medicineData)
            });

            const result = await response.json();

            if (result.success) {
                PharmacyApp.showAlert('Medicine saved successfully', 'success');
                this.closeMedicineModal();
                this.loadMedicines();
            } else {
                PharmacyApp.showAlert('Failed to save medicine: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Save medicine error:', error);
            PharmacyApp.showAlert('Failed to save medicine', 'error');
        }
    },

    // Edit medicine
    editMedicine(medicineId) {
        const medicine = this.medicines.find(m => m.id === medicineId);
        if (medicine) {
            this.showMedicineForm(medicine);
        }
    },

    // Delete medicine
    async deleteMedicine(medicineId) {
        if (!confirm('Are you sure you want to delete this medicine?')) {
            return;
        }

        try {
            const response = await fetch(`/api/delete_medicine/${medicineId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                PharmacyApp.showAlert('Medicine deleted successfully', 'success');
                this.loadMedicines();
            } else {
                PharmacyApp.showAlert('Failed to delete medicine: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Delete medicine error:', error);
            PharmacyApp.showAlert('Failed to delete medicine', 'error');
        }
    },

    // Close medicine modal
    closeMedicineModal() {
        document.getElementById('medicineModal').classList.add('hidden');
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    PharmacyApp.init();
    
    // Initialize specific modules based on current page
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/history')) {
        HistoryManager.searchInvoices();
    } else if (currentPath.includes('/reports')) {
        ReportsManager.loadTrendingMedicines();
        ReportsManager.loadSalesStats();
    } else if (currentPath.includes('/manage')) {
        MedicineManager.loadMedicines();
    }
});

// Export modules for global access
window.PharmacyApp = PharmacyApp;
window.HistoryManager = HistoryManager;
window.ReportsManager = ReportsManager;
window.MedicineManager = MedicineManager;