const form = document.getElementById("loginForm");

// Ensure users storage exists; seed default admin if missing
function ensureUsersSeeded() {
  let users = JSON.parse(localStorage.getItem('users')) || [];
  if (!users.find(u => u.role === 'admin')) {
    users.push({ username: 'admin', password: 'admin123', role: 'admin' });
    localStorage.setItem('users', JSON.stringify(users));
  }
}

ensureUsersSeeded();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === "" || password === "") {
    alert("Please fill all fields");
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const matched = users.find(u => u.username === username && u.password === password);
  if (!matched) {
    alert('Invalid username or password');
    return;
  }

  // Store current user as object with role
  localStorage.setItem('currentUser', JSON.stringify({ username: matched.username, role: matched.role }));
  window.location.href = 'dashboard.html';
});
