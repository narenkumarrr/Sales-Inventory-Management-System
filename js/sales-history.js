// ===== SALES HISTORY LOGIC =====

// Load sales history from localStorage
let allSales = JSON.parse(localStorage.getItem("salesHistory")) || [];

// DOM elements
const salesTableBody = document.getElementById("salesTableBody");
const filterDateInput = document.getElementById("filterDate");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const totalSalesEl = document.getElementById("totalSales");
const totalRevenueEl = document.getElementById("totalRevenue");
const totalProfitEl = document.getElementById("totalProfit");
const avgProfitEl = document.getElementById("avgProfit");

// Render sales table
function renderSalesTable(salesData = allSales) {
  salesTableBody.innerHTML = "";

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
    const row = document.createElement("tr");
    // Display customer info if available
    const customerName = sale.customer ? sale.customer.name : "N/A";
    const customerPhone = sale.customer ? sale.customer.phone : "N/A";
    const employeeName = sale.employee || "N/A";
    
    row.innerHTML = `
      <td>${sale.date}</td>
      <td>${employeeName}</td>
      <td>${customerName}</td>
      <td>${customerPhone}</td>
      <td>${sale.itemName}</td>
      <td>₹${sale.basePrice}</td>
      <td>₹${sale.sellingPrice}</td>
      <td>${sale.quantity}</td>
      <td>₹${sale.totalRevenue}</td>
      <td style="color: green; font-weight: bold;">₹${sale.profit}</td>
    `;
    salesTableBody.appendChild(row);
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

  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalProfit = salesData.reduce((sum, s) => sum + s.profit, 0);
  const avgProfit = Math.round(totalProfit / totalSales);

  totalSalesEl.textContent = totalSales;
  totalRevenueEl.textContent = `₹${totalRevenue}`;
  totalProfitEl.textContent = `₹${totalProfit}`;
  avgProfitEl.textContent = `₹${avgProfit}`;
}

// Filter by date
filterDateInput.addEventListener("change", () => {
  const selectedDate = filterDateInput.value;

  if (!selectedDate) {
    renderSalesTable(allSales);
    return;
  }

  const filteredSales = allSales.filter(sale => {
    const saleDate = sale.date.split(",")[0]; // Extract date part (YYYY-MM-DD)
    return saleDate === selectedDate;
  });

  renderSalesTable(filteredSales);
});

// Clear filters
clearFilterBtn.addEventListener("click", () => {
  filterDateInput.value = "";
  renderSalesTable(allSales);
});

// Initial render
renderSalesTable();
