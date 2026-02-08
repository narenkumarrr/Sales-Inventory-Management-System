// ===== DASHBOARD LOGIC =====

// Get today's date in consistent format (YYYY-MM-DD)
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

// Calculate dashboard statistics
function calculateStats() {
  // Reload data from localStorage
  let items = JSON.parse(localStorage.getItem("items")) || [];
  let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];

  const todayDate = getTodayDate();
  
  // Today's sales count
  const todaySales = salesHistory.filter(sale => {
    const saleDate = sale.date.split(",")[0].trim(); // Extract date part
    return saleDate === todayDate;
  }).length;

  // Total revenue (today)
  const todayRevenue = salesHistory
    .filter(sale => sale.date.split(",")[0].trim() === todayDate)
    .reduce((sum, sale) => sum + (sale.totalRevenue || 0), 0);

  // Total profit (today)
  const todayProfit = salesHistory
    .filter(sale => sale.date.split(",")[0].trim() === todayDate)
    .reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);

  // Total items count
  const totalItems = items.length;

  // Low stock items (stock < 10)
  const lowStockItems = items.filter(item => item.stock < 10).length;

  console.log("Dashboard Stats:", { todayDate, todaySales, todayRevenue, todayProfit, totalItems, lowStockItems });

  return {
    todaySales,
    todayRevenue,
    todayProfit,
    totalItems,
    lowStockItems
  };
}

// Render dashboard cards
function renderDashboard() {
  const stats = calculateStats();

  document.getElementById("todaySales").textContent = stats.todaySales;
  document.getElementById("totalRevenue").textContent = `₹${stats.todayRevenue}`;
  document.getElementById("totalProfit").textContent = `₹${stats.todayProfit}`;
  document.getElementById("totalItems").textContent = stats.totalItems;
  document.getElementById("lowStock").textContent = stats.lowStockItems;
}

// Make cards navigatable
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard loaded");
  renderDashboard();

  // Helper function to add card interactivity
  function makeCardClickable(cardId, href) {
    const card = document.getElementById(cardId);
    if (card) {
      card.style.cursor = "pointer";
      card.style.transition = "transform 0.2s ease";
      
      card.addEventListener("click", () => {
        window.location.href = href;
      });

      card.addEventListener("mouseover", () => {
        card.style.transform = "translateY(-5px)";
        card.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
      });

      card.addEventListener("mouseout", () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      });
    }
  }

  // Make all cards clickable
  makeCardClickable("todaySalesCard", "sales-history.html");
  makeCardClickable("totalRevenueCard", "sales-history.html");
  makeCardClickable("totalProfitCard", "sales-history.html");
  makeCardClickable("totalItemsCard", "items.html");
  makeCardClickable("lowStockCard", "items.html");
});
