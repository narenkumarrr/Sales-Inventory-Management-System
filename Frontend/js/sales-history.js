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

// ===== SALES HISTORY LOGIC =====


let allSales = []; // Sales will be fetched from API

// DOM elements
const salesTableBody = document.getElementById("salesTableBody");
const filterDateInput = document.getElementById("filterDate");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const totalSalesEl = document.getElementById("totalSales");
const totalRevenueEl = document.getElementById("totalRevenue");
const totalProfitEl = document.getElementById("totalProfit");
const avgProfitEl = document.getElementById("avgProfit");

// Render sales table
async function renderSalesTable(salesData) {
  salesTableBody.innerHTML = "";

  // If salesData is not provided, fetch from API
  if (!salesData) {
    try {
      const response = await authenticatedFetch('/api/sales');
      allSales = await response.json(); // Store fetched sales globally
      salesData = allSales;
    } catch (error) {
      console.error('Error fetching sales history:', error);
      alert('Failed to load sales history.');
      updateSummary([]);
      return;
    }
  }

  if (salesData.length === 0) {
    salesTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 20px; color: #6b7280;">No sales recorded yet</td>
      </tr>
    `;
    updateSummary([]);
    return;
  }

  salesData.forEach(sale => {
    // For each sale, iterate through its items
    sale.items.forEach(item => {
      const row = document.createElement("tr");
      
      // Format date
      const saleDate = new Date(sale.date).toLocaleString();

      row.innerHTML = `
        <td>${saleDate}</td>
        <td>N/A</td> <!-- Employee not stored in backend sale model yet -->
        <td>N/A</td> <!-- Customer not stored in backend sale model yet -->
        <td>N/A</td> <!-- Customer not stored in backend sale model yet -->
        <td>${item.name}</td>
        <td>₹${item.basePrice}</td>
        <td>₹${item.sellPrice}</td>
        <td>${item.qty}</td>
        <td>₹${item.total}</td>
        <td style="color: green; font-weight: bold;">₹${item.profit}</td>
      `;
      salesTableBody.appendChild(row);
    });
  });

  updateSummary(salesData);
}

// Update summary statistics
function updateSummary(salesData) {
  if (salesData.length === 0) {
    totalSalesEl.textContent = "0";
    totalRevenueEl.textContent = "₹0";
    totalProfitEl.textContent = "₹0";
    avgProfitEl.textContent = "₹0";
    return;
  }

  const totalSalesCount = salesData.length; // Number of unique sales transactions
  const totalRevenue = salesData.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = salesData.reduce((sum, s) => sum + s.totalProfit, 0);
  const avgProfit = totalSalesCount > 0 ? Math.round(totalProfit / totalSalesCount) : 0;

  totalSalesEl.textContent = totalSalesCount;
  totalRevenueEl.textContent = `₹${totalRevenue}`;
  totalProfitEl.textContent = `₹${totalProfit}`;
  avgProfitEl.textContent = `₹${avgProfit}`;
}

// Filter by date
filterDateInput.addEventListener("change", async () => {
  const selectedDate = filterDateInput.value; // Format YYYY-MM-DD

  if (!selectedDate) {
    await renderSalesTable(); // Reload all sales if filter is cleared
    return;
  }

  // Ensure allSales is populated
  if (allSales.length === 0) {
    try {
      const response = await authenticatedFetch('/api/sales');
      allSales = await response.json();
    } catch (error) {
      console.error('Error fetching sales for filter:', error);
      alert('Failed to load sales for filtering.');
      return;
    }
  }

  const filteredSales = allSales.filter(sale => {
    const saleDate = new Date(sale.date).toISOString().split('T')[0]; // Convert sale date to YYYY-MM-DD
    return saleDate === selectedDate;
  });

  renderSalesTable(filteredSales);
});

// Clear filters
clearFilterBtn.addEventListener("click", async () => {
  filterDateInput.value = "";
  await renderSalesTable();
});

// Initial render
document.addEventListener('DOMContentLoaded', async () => {
    await renderSalesTable();
});
