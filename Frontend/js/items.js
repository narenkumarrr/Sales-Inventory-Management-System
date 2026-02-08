// ====== ITEMS LOGIC ======

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

let items = []; // Items will be fetched from API
let editItemId = null;

// DOM elements
const itemNameInput = document.getElementById("itemName");
const basePriceInput = document.getElementById("basePrice");
const stockInput = document.getElementById("stock");
const addBtn = document.getElementById("addItemBtn");
const tableBody = document.getElementById("itemsTableBody");



// Render items in table
async function renderItems() {
  tableBody.innerHTML = "";
  try {
    const response = await authenticatedFetch('/api/items');
    items = await response.json();

    items.forEach(item => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.name}</td>
        <td>₹${item.basePrice}</td>
        <td>${item.stock}</td>
        <td>
          <button onclick="editItem('${item._id}')">Edit</button>
          <button onclick="deleteItem('${item._id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    alert(error.message); // Display specific message from authenticatedFetch
  }
}

// Add or Update Item
addBtn.addEventListener("click", async () => {
  const name = itemNameInput.value.trim();
  const basePrice = Number(basePriceInput.value);
  const stock = Number(stockInput.value);

  if (!name || basePrice <= 0 || stock < 0) {
    alert("Invalid input");
    return;
  }

  try {
    if (editItemId === null) {
      // Add new item
      const response = await authenticatedFetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, basePrice, stock })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to add item');
      }
    } else {
      // Update existing item
      const response = await authenticatedFetch(`/api/items/${editItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, basePrice, stock })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update item');
      }
      editItemId = null;
      addBtn.textContent = "Add Item";
    }

    renderItems();
    clearForm();
  } catch (error) {
    console.error('Error adding/updating item:', error);
    alert(error.message);
  }
});

// Edit item
async function editItem(id) {
  try {
    const response = await authenticatedFetch(`/api/items/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch item for editing');
    }
    const item = await response.json();
    itemNameInput.value = item.name;
    basePriceInput.value = item.basePrice;
    stockInput.value = item.stock;
    editItemId = item._id; // Store MongoDB _id
    addBtn.textContent = "Update Item";
  } catch (error) {
    console.error('Error editing item:', error);
    alert(error.message);
  }
}

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }
  try {
    const response = await authenticatedFetch(`/api/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete item');
    }
    renderItems();
  } catch (error) {
    console.error('Error deleting item:', error);
    alert(error.message);
  }
}

// Clear form
function clearForm() {
  itemNameInput.value = "";
  basePriceInput.value = "";
  stockInput.value = "";
}

// Initial render
renderItems();
