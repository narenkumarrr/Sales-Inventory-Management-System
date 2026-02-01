// ====== ITEMS LOGIC ======

// Load items from localStorage or initialize empty array
let items = JSON.parse(localStorage.getItem("items")) || [];
let editItemId = null;

// DOM elements
const itemNameInput = document.getElementById("itemName");
const basePriceInput = document.getElementById("basePrice");
const stockInput = document.getElementById("stock");
const addBtn = document.getElementById("addItemBtn");
const tableBody = document.getElementById("itemsTableBody");

// Save items to localStorage
function saveItems() {
  localStorage.setItem("items", JSON.stringify(items));
}

// Render items in table
function renderItems() {
  tableBody.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.name}</td>
      <td>₹${item.price}</td>
      <td>${item.stock}</td>
      <td>
        <button onclick="editItem(${item.id})">Edit</button>
        <button onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// Add or Update Item
addBtn.addEventListener("click", () => {
  const name = itemNameInput.value.trim();
  const basePrice = Number(basePriceInput.value);
  const stock = Number(stockInput.value);

  if (!name || basePrice <= 0 || stock < 0) {
    alert("Invalid input");
    return;
  }

  if (editItemId === null) {
    // Add new item
    const newItem = {
      id: Date.now(),
      name,
      basePrice,
      stock
    };
    items.push(newItem);
  } else {
    // Update existing item
    const item = items.find(i => i.id === editItemId);
    item.name = name;
    item.basePrice = basePrice;
    item.stock = stock;
    editItemId = null;
    addBtn.textContent = "Add Item";
  }

  saveItems();
  renderItems();
  clearForm();
});

// Edit item
function editItem(id) {
  const item = items.find(i => i.id === id);
  itemNameInput.value = item.name;
  basePriceInput.value = item.basePrice;
  stockInput.value = item.stock;
  editItemId = id;
  addBtn.textContent = "Update Item";
}

// Delete item
function deleteItem(id) {
  items = items.filter(item => item.id !== id);
  saveItems();
  renderItems();
}

// Clear form
function clearForm() {
  itemNameInput.value = "";
  basePriceInput.value = "";
  stockInput.value = "";
}

// Initial render
renderItems();
