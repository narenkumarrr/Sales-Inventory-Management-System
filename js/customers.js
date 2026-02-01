// ===== CUSTOMERS LOGIC =====

let customers = JSON.parse(localStorage.getItem("customers")) || [];
let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];

// DOM elements
const customersContainer = document.getElementById("customersContainer");
const searchInput = document.getElementById("searchCustomer");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// Render all customers with their purchase history
function renderCustomers(customersToShow = customers) {
  customersContainer.innerHTML = "";

  if (customersToShow.length === 0) {
    customersContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No customers found</p>';
    return;
  }

  customersToShow.forEach(customer => {
    // Get all purchases for this customer
    const customerSales = salesHistory.filter(sale => sale.customer && sale.customer.id === customer.id);
    
    // Calculate statistics
    const totalTransactions = customerSales.length;
    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    
    // Get employee frequency (who sells most to this customer)
    const employeeFrequency = {};
    customerSales.forEach(sale => {
      const employeeName = sale.employee || "Unknown";
      employeeFrequency[employeeName] = (employeeFrequency[employeeName] || 0) + 1;
    });
    
    // Find top selling employee
    let topEmployee = "None";
    if (Object.keys(employeeFrequency).length > 0) {
      topEmployee = Object.entries(employeeFrequency)
        .sort((a, b) => b[1] - a[1])[0];
      topEmployee = `${topEmployee[0]} (${topEmployee[1]} sales)`;
    }

    const customerCard = document.createElement("div");
    customerCard.style.cssText = "border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #f9fafb;";
    
    customerCard.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <!-- Left Column -->
        <div>
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">NAME</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; font-size: 16px;">${customer.name}</p>
          
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">PHONE</p>
          <p style="margin: 0 0 15px 0; font-family: monospace;">${customer.phone}</p>
          
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">ADDRESS</p>
          <p style="margin: 0 0 15px 0;">${customer.address}</p>
        </div>
        
        <!-- Right Column -->
        <div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="background: white; padding: 10px; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Total Transactions</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 18px; color: #2563eb;">${totalTransactions}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Total Spent</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 18px; color: #10b981;">₹${totalSpent}</p>
            </div>
          </div>
          
          <div style="background: white; padding: 10px; border-radius: 4px;">
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">TOP EMPLOYEE SELLING TO THEM</p>
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #7c3aed;">${topEmployee}</p>
          </div>
        </div>
      </div>
    `;
    
    customersContainer.appendChild(customerCard);
  });
}

// Search functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm) ||
    customer.phone.includes(searchTerm)
  );
  
  renderCustomers(filteredCustomers);
});

// Clear search
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderCustomers(customers);
});

// Initial render
renderCustomers();
