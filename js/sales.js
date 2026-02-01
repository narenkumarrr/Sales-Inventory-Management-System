// ===== SALES LOGIC =====

// Get current logged-in user (object with username and role)
const currentUserRaw = localStorage.getItem("currentUser");
const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : { username: "Unknown Employee", role: 'employee' };

// Initialize customers list
let customers = JSON.parse(localStorage.getItem("customers")) || [];

// Load items from localStorage
let items = JSON.parse(localStorage.getItem("items")) || [];
let bill = [];
let selectedCustomer = null;

// DOM elements - Customer Section
const customerTypeRadios = document.querySelectorAll("input[name='customerType']");
const newCustomerForm = document.getElementById("newCustomerForm");
const existingCustomerForm = document.getElementById("existingCustomerForm");
const newCustomerNameInput = document.getElementById("newCustomerName");
const newCustomerPhoneInput = document.getElementById("newCustomerPhone");
const newCustomerAddressInput = document.getElementById("newCustomerAddress");
const existingCustomerSelect = document.getElementById("existingCustomerSelect");
const selectedCustomerInfo = document.getElementById("selectedCustomerInfo");
const displayCustomerName = document.getElementById("displayCustomerName");
const displayCustomerPhone = document.getElementById("displayCustomerPhone");
const displayCustomerAddress = document.getElementById("displayCustomerAddress");

// DOM elements - Sale Section
const itemSelect = document.getElementById("itemSelect");
const qtyInput = document.getElementById("quantity");
const sellingPriceInput = document.getElementById("sellingPrice");
const addBtn = document.getElementById("addToBillBtn");
const billTable = document.getElementById("billTableBody");
const grandTotalEl = document.getElementById("grandTotal");
const confirmBtn = document.getElementById("confirmSaleBtn");

// ===== CUSTOMER MANAGEMENT =====

// Toggle between new and existing customer forms
customerTypeRadios.forEach(radio => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "new") {
      newCustomerForm.style.display = "block";
      existingCustomerForm.style.display = "none";
      selectedCustomerInfo.style.display = "none";
      selectedCustomer = null;
    } else {
      newCustomerForm.style.display = "none";
      existingCustomerForm.style.display = "block";
      loadExistingCustomers();
    }
  });
});

// Load existing customers into dropdown
function loadExistingCustomers() {
  existingCustomerSelect.innerHTML = '<option value="">-- Select Customer --</option>';
  customers.forEach(customer => {
    const option = document.createElement("option");
    option.value = customer.id;
    option.textContent = `${customer.name} (${customer.phone})`;
    existingCustomerSelect.appendChild(option);
  });
}

// Handle existing customer selection
existingCustomerSelect.addEventListener("change", (e) => {
  if (e.target.value) {
    selectedCustomer = customers.find(c => c.id === Number(e.target.value));
    // Display customer info
    displayCustomerName.textContent = selectedCustomer.name;
    displayCustomerPhone.textContent = selectedCustomer.phone;
    displayCustomerAddress.textContent = selectedCustomer.address;
    selectedCustomerInfo.style.display = "block";
  } else {
    selectedCustomer = null;
    selectedCustomerInfo.style.display = "none";
  }
});

// Get or create customer
function getOrCreateCustomer() {
  const customerTypeRadio = document.querySelector("input[name='customerType']:checked");
  
  if (customerTypeRadio.value === "new") {
    const name = newCustomerNameInput.value.trim();
    const phone = newCustomerPhoneInput.value.trim();
    const address = newCustomerAddressInput.value.trim();

    if (!name || !phone || !address) {
      alert("Please fill in all customer details");
      return null;
    }

    // Create new customer
    const newCustomer = {
      id: Date.now(),
      name: name,
      phone: phone,
      address: address
    };

    customers.push(newCustomer);
    localStorage.setItem("customers", JSON.stringify(customers));
    selectedCustomer = newCustomer;
    return newCustomer;
  } else {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return null;
    }
    return selectedCustomer;
  }
}

// ===== SALE MANAGEMENT =====

// Populate item dropdown
function loadItems() {
  itemSelect.innerHTML = "";

  items.forEach(item => {
    if (item.stock > 0) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `${item.name} (Stock: ${item.stock})`;
      itemSelect.appendChild(option);
    }
  });
}

// Add item to bill
addBtn.addEventListener("click", () => {
  const itemId = Number(itemSelect.value);
  const qty = Number(qtyInput.value);
  const sellingPrice = Number(sellingPriceInput.value);

  const item = items.find(i => i.id === itemId);

  if (!item || qty <= 0 || sellingPrice <= 0) {
    alert("Please select item, quantity, and selling price");
    return;
  }

  // Validate selling price >= basePrice
  if (sellingPrice < item.basePrice) {
    alert(`Selling price (₹${sellingPrice}) cannot be less than base price (₹${item.basePrice})`);
    return;
  }

  // Check if item already in bill
  const existingBillItem = bill.find(b => b.id === itemId);
  
  if (existingBillItem) {
    // Update quantity if same item added again
    const totalQty = existingBillItem.qty + qty;
    if (totalQty > item.stock) {
      alert(`Cannot add ${qty} more units. Total (${totalQty}) exceeds available stock (${item.stock})`);
      return;
    }
    existingBillItem.qty = totalQty;
    existingBillItem.sellingPrice = sellingPrice; // Update selling price
    existingBillItem.total = sellingPrice * existingBillItem.qty;
    existingBillItem.profit = (sellingPrice - item.basePrice) * existingBillItem.qty;
  } else {
    // Check stock for new item
    if (qty > item.stock) {
      alert(`Only ${item.stock} units available`);
      return;
    }

    const billItem = {
      id: item.id,
      name: item.name,
      basePrice: item.basePrice,
      sellingPrice: sellingPrice,
      qty: qty,
      total: sellingPrice * qty,
      profit: (sellingPrice - item.basePrice) * qty
    };

    bill.push(billItem);
  }

  renderBill();
  qtyInput.value = "";
  sellingPriceInput.value = "";
});

// Render bill table
function renderBill() {
  billTable.innerHTML = "";
  let grandTotal = 0;
  let totalProfit = 0;

  bill.forEach(b => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.name}</td>
      <td>₹${b.basePrice}</td>
      <td>₹${b.sellingPrice}</td>
      <td>${b.qty}</td>
      <td>₹${b.total}</td>
    `;
    billTable.appendChild(row);
    grandTotal += b.total;
    totalProfit += b.profit;
  });

  grandTotalEl.innerHTML = `<strong>Grand Total: ₹${grandTotal}</strong>`;
}

// Confirm sale and reduce stock
confirmBtn.addEventListener("click", () => {
  if (bill.length === 0) {
    alert("No items in bill");
    return;
  }

  // Get or create customer
  const customer = getOrCreateCustomer();
  if (!customer) {
    return;
  }

  // Validate stock before confirming
  for (let b of bill) {
    const item = items.find(i => i.id === b.id);
    if (b.qty > item.stock) {
      alert(`Insufficient stock for ${b.name}. Available: ${item.stock}`);
      return;
    }
  }

  // Load sales history
  let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];

  // Calculate totals
  let totalAmount = 0;
  let totalProfit = 0;

  // Reduce stock and save each sale item
  bill.forEach(b => {
    const item = items.find(i => i.id === b.id);
    item.stock -= b.qty;
    totalAmount += b.total;
    totalProfit += b.profit;

    // Record individual sale items
    const saleRecord = {
      employee: currentUser.username,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      },
      itemName: b.name,
      basePrice: b.basePrice,
      sellingPrice: b.sellingPrice,
      quantity: b.qty,
      totalRevenue: b.total,
      profit: b.profit,
      date: new Date().toLocaleString()
    };

    salesHistory.push(saleRecord);
  });

  localStorage.setItem("items", JSON.stringify(items));
  localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
  
  alert(`Sale completed successfully!\\nCustomer: ${customer.name}\\nTotal: ₹${totalAmount}\\nProfit: ₹${totalProfit}`);
  
  // Reset form
  bill = [];
  renderBill();
  loadItems();
  newCustomerNameInput.value = "";
  newCustomerPhoneInput.value = "";
  newCustomerAddressInput.value = "";
  existingCustomerSelect.value = "";
  selectedCustomer = null;
  qtyInput.value = "";
  sellingPriceInput.value = "";
});

// Initial load
loadItems();
