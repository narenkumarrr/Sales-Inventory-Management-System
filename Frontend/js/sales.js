// ===== SALES LOGIC =====

// Helper function for authenticated API requests
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if no token is found
    window.location.href = 'login.html';
    throw new Error('No authentication token found.');
  }

  options.headers = {
    ...options.headers,
    'x-auth-token': token
  };

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    throw new Error('Authentication failed or access denied.');
  }

  return response;
}

// Initialize customers list (still local for now)
let customers = JSON.parse(localStorage.getItem("customers")) || [];

// Items will be fetched from the API
let items = [];
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

// ... (customer management functions remain unchanged for now) ...

// Populate item dropdown
async function loadItems() {
  itemSelect.innerHTML = "";
  try {
    const response = await authenticatedFetch('/api/items');
    items = await response.json(); // Store fetched items globally

    items.forEach(item => {
      if (item.stock > 0) { // Only show items with stock
        const option = document.createElement("option");
        option.value = item._id; // Use MongoDB _id
        option.textContent = `${item.name} (Stock: ${item.stock}, Base Price: ₹${item.basePrice})`;
        itemSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    alert('Failed to load items for sale.');
  }
}

// Add item to bill
addBtn.addEventListener("click", () => {
  const itemId = itemSelect.value; // Use string _id
  const qty = Number(qtyInput.value);
  const sellingPrice = Number(sellingPriceInput.value);

  const item = items.find(i => i._id === itemId); // Find by _id

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
      id: item._id, // Use MongoDB _id
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
confirmBtn.addEventListener("click", async () => {
  if (bill.length === 0) {
    alert("No items in bill");
    return;
  }

  // Get or create customer - keep this local for now
  const customer = getOrCreateCustomer();
  if (!customer) {
    return;
  }

  // Prepare sale data for the backend
  const saleData = {
    items: bill.map(item => ({
      id: item.id,
      name: item.name,
      basePrice: item.basePrice,
      sellPrice: item.sellingPrice,
      qty: item.qty,
      total: item.total,
      profit: item.profit
    })),
  };

  try {
    const response = await authenticatedFetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to complete sale.');
    }

    const completedSale = await response.json();

    alert(`Sale completed successfully!\\nTotal Amount: ₹${completedSale.totalAmount}\\nTotal Profit: ₹${completedSale.totalProfit}`);
    
    // Reset form
    bill = [];
    renderBill();
    await loadItems(); // Reload items to reflect stock changes
    newCustomerNameInput.value = "";
    newCustomerPhoneInput.value = "";
    newCustomerAddressInput.value = "";
    existingCustomerSelect.value = "";
    selectedCustomer = null;
    qtyInput.value = "";
    sellingPriceInput.value = "";

  } catch (error) {
    console.error('Error confirming sale:', error);
    alert(error.message);
  }
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
  await loadItems();
  // Also load existing customers here if it's dependent on the DOM being ready
  loadExistingCustomers();
});
