// ===== EMPLOYEE PROFILE LOGIC =====

const currentUserRaw = localStorage.getItem("currentUser");
const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : { username: "Unknown Employee", role: 'employee' };
const salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
const targets = JSON.parse(localStorage.getItem("employeeTargets")) || [];

// DOM elements
const employeeUsernameEl = document.getElementById("employeeUsername");
const loginTimeEl = document.getElementById("loginTime");
const monthlyProgressContainer = document.getElementById("monthlyProgressContainer");
const yearlyProgressContainer = document.getElementById("yearlyProgressContainer");
const todaySalesQtyEl = document.getElementById("todaySalesQty");
const monthSalesQtyEl = document.getElementById("monthSalesQty");
const yearSalesQtyEl = document.getElementById("yearSalesQty");
const totalRevenueEl = document.getElementById("totalRevenue");

// Display employee info
employeeUsernameEl.textContent = currentUser.username;
loginTimeEl.textContent = new Date().toLocaleString();

// View month/year selectors (populated from HTML)
const viewMonthSelect = document.getElementById('viewMonth');
const viewYearSelect = document.getElementById('viewYear');

function populateViewYear() {
  const currentYear = new Date().getFullYear();
  viewYearSelect.innerHTML = '';
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    viewYearSelect.appendChild(opt);
  }
}
populateViewYear();

// default to current month/year
if (viewMonthSelect) viewMonthSelect.value = new Date().getMonth();
if (viewYearSelect) viewYearSelect.value = new Date().getFullYear();

if (viewMonthSelect) viewMonthSelect.addEventListener('change', () => { updateStatistics(); renderTargetProgress(); });
if (viewYearSelect) viewYearSelect.addEventListener('change', () => { updateStatistics(); renderTargetProgress(); });

function calculateProgressFor(monthForView, yearForView) {
  const now = new Date();
  const todayString = now.toDateString();
  let todayQty = 0, monthQty = 0, yearQty = 0, totalRevenue = 0;
  salesHistory.forEach(sale => {
    if (sale.employee === currentUser.username) {
      const saleDate = new Date(sale.date);
      if (saleDate.toDateString() === todayString) todayQty += sale.quantity;
      if (saleDate.getFullYear() === Number(yearForView)) yearQty += sale.quantity;
      if (saleDate.getFullYear() === Number(yearForView) && saleDate.getMonth() === Number(monthForView)) monthQty += sale.quantity;
      totalRevenue += sale.totalRevenue;
    }
  });
  return { todayQty, monthQty, yearQty, totalRevenue };
}

function calculateProgress() {
  const m = viewMonthSelect ? Number(viewMonthSelect.value) : new Date().getMonth();
  const y = viewYearSelect ? Number(viewYearSelect.value) : new Date().getFullYear();
  return calculateProgressFor(m, y);
}

// Render target progress
function renderTargetProgress() {
  const progress = calculateProgress();
  // use selected month/year from view selectors
  const curMonth = viewMonthSelect ? Number(viewMonthSelect.value) : new Date().getMonth();
  const curYear = viewYearSelect ? Number(viewYearSelect.value) : new Date().getFullYear();

  const monthlyTarget = targets.find(t => t.employeeUsername === currentUser && t.type === 'monthly' && Number(t.month) === curMonth && Number(t.year) === curYear);
  const yearlyTarget = targets.find(t => t.employeeUsername === currentUser && t.type === 'yearly' && Number(t.year) === curYear);

  // Monthly progress
  if (monthlyTarget) {
    const monthlyRemaining = Math.max(0, monthlyTarget.target - progress.monthQty);
    const monthlyPercentage = monthlyTarget.target > 0 ? Math.min(100, (progress.monthQty / monthlyTarget.target) * 100) : 0;
    const monthlyColor = monthlyRemaining === 0 ? "#10b981" : monthlyPercentage >= 50 ? "#f59e0b" : "#ef4444";

    monthlyProgressContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
        <div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">TARGET: ${monthlyTarget.target} units</p>
          <div style="background: #e5e7eb; border-radius: 8px; height: 40px; position: relative; overflow: hidden;">
            <div style="background: ${monthlyColor}; height: 100%; width: ${monthlyPercentage}%; display: flex; align-items: center; justify-content: center; transition: width 0.3s;">
              <span style="color: white; font-weight: bold; font-size: 12px;">${monthlyPercentage.toFixed(0)}%</span>
            </div>
          </div>
          <p style="margin: 10px 0 0 0; color: #6b7280;">Progress: ${progress.monthQty}/${monthlyTarget.target} units</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 10px 0;">REMAINING</p>
          <p style="font-weight: bold; font-size: 32px; color: ${monthlyRemaining === 0 ? '#10b981' : '#ef4444'}; margin: 0;">${monthlyRemaining}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">units left to sell</p>
        </div>
      </div>
    `;
  } else {
    monthlyProgressContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No monthly target set by admin</p>';
  }

  // Yearly progress
  if (yearlyTarget) {
    const yearlyRemaining = Math.max(0, yearlyTarget.target - progress.yearQty);
    const yearlyPercentage = yearlyTarget.target > 0 ? Math.min(100, (progress.yearQty / yearlyTarget.target) * 100) : 0;
    const yearlyColor = yearlyRemaining === 0 ? "#10b981" : yearlyPercentage >= 50 ? "#f59e0b" : "#ef4444";

    yearlyProgressContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center;">
        <div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">TARGET: ${yearlyTarget.target} units</p>
          <div style="background: #e5e7eb; border-radius: 8px; height: 40px; position: relative; overflow: hidden;">
            <div style="background: ${yearlyColor}; height: 100%; width: ${yearlyPercentage}%; display: flex; align-items: center; justify-content: center; transition: width 0.3s;">
              <span style="color: white; font-weight: bold; font-size: 12px;">${yearlyPercentage.toFixed(0)}%</span>
            </div>
          </div>
          <p style="margin: 10px 0 0 0; color: #6b7280;">Progress: ${progress.yearQty}/${yearlyTarget.target} units</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 10px 0;">REMAINING</p>
          <p style="font-weight: bold; font-size: 32px; color: ${yearlyRemaining === 0 ? '#10b981' : '#ef4444'}; margin: 0;">${yearlyRemaining}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">units left to sell</p>
        </div>
      </div>
    `;
  } else {
    yearlyProgressContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No yearly target set by admin</p>';
  }
}

// Update statistics
function updateStatistics() {
  const progress = calculateProgress();
  
  todaySalesQtyEl.textContent = progress.todayQty;
  monthSalesQtyEl.textContent = progress.monthQty;
  yearSalesQtyEl.textContent = progress.yearQty;
  // Only admins should see total revenue on profile
  if (currentUser.role === 'admin') {
    totalRevenueEl.textContent = `₹${progress.totalRevenue}`;
    totalRevenueEl.style.display = '';
  } else {
    totalRevenueEl.textContent = '--';
    totalRevenueEl.style.display = 'none';
  }
}

// Initial render
updateStatistics();
renderTargetProgress();

// Refresh every 10 seconds
setInterval(() => {
  const newSalesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
  const newTargets = JSON.parse(localStorage.getItem("employeeTargets")) || [];
  
  // Update global variables if data changed
  Object.assign(salesHistory, newSalesHistory);
  Object.assign(targets, newTargets);
  
  updateStatistics();
  renderTargetProgress();
}, 10000);
