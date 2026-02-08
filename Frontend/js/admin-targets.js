// ===== ADMIN TARGETS LOGIC =====

// Get all unique employees from sales history
let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
let targets = JSON.parse(localStorage.getItem("employeeTargets")) || [];

// DOM elements
const employeeSelect = document.getElementById("employeeSelect");
const monthlyTargetInput = document.getElementById("monthlyTarget");
const yearlyTargetInput = document.getElementById("yearlyTarget");
const setTargetBtn = document.getElementById("setTargetBtn");
const targetsTableBody = document.getElementById("targetsTableBody");
const targetMonthSelect = document.getElementById("targetMonth");
const targetMonthYearSelect = document.getElementById("targetMonthYear");
const targetYearForYearly = document.getElementById("targetYearForYearly");

// Get all unique employee names from sales history
function getAllEmployees() {
  const employeeSet = new Set();
  // Include employees from users list (preferred source) and fallback to sales history
  const users = JSON.parse(localStorage.getItem('users')) || [];
  users.forEach(u => {
    if (u.role === 'employee') employeeSet.add(u.username);
  });

  salesHistory.forEach(sale => {
    if (sale.employee) {
      employeeSet.add(sale.employee);
    }
  });

  return Array.from(employeeSet).sort();
}

// Load employees into dropdown
function loadEmployees() {
  const employees = getAllEmployees();
  employeeSelect.innerHTML = '<option value="">-- Select Employee --</option>';
  
  employees.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp;
    option.textContent = emp;
    employeeSelect.appendChild(option);
  });
}

// Populate month/year selectors
function populatePeriodSelectors() {
  const currentYear = new Date().getFullYear();
  // month-year select: show last 3 years and next year
  targetMonthYearSelect.innerHTML = "";
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    targetMonthYearSelect.appendChild(opt);
  }

  // yearly select
  targetYearForYearly.innerHTML = "";
  for (let y = currentYear - 1; y <= currentYear + 3; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    targetYearForYearly.appendChild(opt);
  }
}

// Calculate employee monthly and yearly progress
// Calculate sold quantity for a given target entry
function getProgressForTarget(target) {
  let qty = 0;
  salesHistory.forEach(sale => {
    if (sale.employee !== target.employeeUsername) return;
    const saleDate = new Date(sale.date);
    if (target.type === 'monthly') {
      if (saleDate.getFullYear() === Number(target.year) && saleDate.getMonth() === Number(target.month)) {
        qty += sale.quantity;
      }
    } else if (target.type === 'yearly') {
      if (saleDate.getFullYear() === Number(target.year)) {
        qty += sale.quantity;
      }
    }
  });
  return qty;
}

// Set target for employee
setTargetBtn.addEventListener("click", () => {
  const employee = employeeSelect.value.trim();
  const monthlyTargetVal = Number(monthlyTargetInput.value);
  const yearlyTargetVal = Number(yearlyTargetInput.value);
  const month = Number(targetMonthSelect.value);
  const monthYear = Number(targetMonthYearSelect.value);
  const yearlyYear = Number(targetYearForYearly.value);

  if (!employee) {
    alert('Please select an employee');
    return;
  }

  let changed = false;

  // Handle monthly target if provided
  if (monthlyTargetVal > 0) {
    // find existing monthly target for same employee+month+year
    const existing = targets.find(t => t.employeeUsername === employee && t.type === 'monthly' && Number(t.month) === month && Number(t.year) === monthYear);
    if (existing) {
      existing.target = monthlyTargetVal;
      existing.updatedAt = new Date().toLocaleString();
    } else {
      targets.push({
        id: Date.now() + Math.random(),
        employeeUsername: employee,
        type: 'monthly',
        month: month,
        year: monthYear,
        target: monthlyTargetVal,
        createdAt: new Date().toLocaleString()
      });
    }
    changed = true;
  }

  // Handle yearly target if provided
  if (yearlyTargetVal > 0) {
    const existingY = targets.find(t => t.employeeUsername === employee && t.type === 'yearly' && Number(t.year) === yearlyYear);
    if (existingY) {
      existingY.target = yearlyTargetVal;
      existingY.updatedAt = new Date().toLocaleString();
    } else {
      targets.push({
        id: Date.now() + Math.random(),
        employeeUsername: employee,
        type: 'yearly',
        year: yearlyYear,
        target: yearlyTargetVal,
        createdAt: new Date().toLocaleString()
      });
    }
    changed = true;
  }

  if (!changed) {
    alert('Please enter at least one valid target value');
    return;
  }

  localStorage.setItem('employeeTargets', JSON.stringify(targets));
  alert(`Target(s) saved for ${employee}`);
  // reset only inputs
  monthlyTargetInput.value = '';
  yearlyTargetInput.value = '';
  renderTargets();
});

// Render targets table
function renderTargets() {
  targetsTableBody.innerHTML = "";

  if (targets.length === 0) {
    targetsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">No targets set yet</td>
      </tr>
    `;
    return;
  }

  targets.forEach(target => {
    const soldQty = getProgressForTarget(target);
    const remaining = Math.max(0, target.target - soldQty);
    const percent = target.target > 0 ? Math.min(100, (soldQty / target.target) * 100) : 0;
    const color = percent >= 100 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444';

    const periodLabel = target.type === 'monthly' ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][target.month]} ${target.year}` : `${target.year}`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${target.employeeUsername}</strong></td>
      <td>${target.type === 'monthly' ? 'Monthly' : 'Yearly'}</td>
      <td>${periodLabel}</td>
      <td>${target.target} units</td>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1; background:#e5e7eb; border-radius:4px; height:20px; overflow:hidden;">
            <div style="background:${color}; height:100%; width:${percent}%;"></div>
          </div>
          <span style="font-weight:bold; min-width:70px;">${soldQty}/${target.target}</span>
        </div>
      </td>
      <td>
        <button type="button" onclick="deleteTargetById('${target.id}')" style="background-color: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
      </td>
    `;
    targetsTableBody.appendChild(row);
  });
}

// Delete target
function deleteTargetById(id) {
  if (confirm('Delete this target?')) {
    targets = targets.filter(t => String(t.id) !== String(id));
    localStorage.setItem('employeeTargets', JSON.stringify(targets));
    renderTargets();
  }
}

// Initial load
populatePeriodSelectors();
loadEmployees();
renderTargets();

// Reload employees when page is visited (in case new employees added via sales)
window.addEventListener("focus", () => {
  salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
  loadEmployees();
  renderTargets();
});
