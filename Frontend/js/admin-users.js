// Admin Users management

let users = JSON.parse(localStorage.getItem('users')) || [];

// Ensure at least one admin exists
function ensureAdmin() {
  if (!users.find(u => u.role === 'admin')) {
    users.push({ username: 'admin', password: 'admin123', role: 'admin' });
    localStorage.setItem('users', JSON.stringify(users));
  }
}

ensureAdmin();

const createUserForm = document.getElementById('createUserForm');
const usersTableBody = document.getElementById('usersTableBody');
const newUsername = document.getElementById('newUsername');
const newPassword = document.getElementById('newPassword');
const newRole = document.getElementById('newRole');

function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

function renderUsers() {
  usersTableBody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;">${u.username}</td>
      <td style="padding:8px;">${u.role}</td>
      <td style="padding:8px;"><button data-username="${u.username}" class="deleteUserBtn">Delete</button></td>
    `;
    usersTableBody.appendChild(tr);
  });

  // Attach delete handlers
  document.querySelectorAll('.deleteUserBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const username = e.target.getAttribute('data-username');
      if (username === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
        alert('Cannot delete the only admin account');
        return;
      }
      if (confirm('Delete user ' + username + '?')) {
        users = users.filter(x => x.username !== username);
        saveUsers();
        renderUsers();
      }
    });
  });
}

createUserForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = newUsername.value.trim();
  const p = newPassword.value;
  const r = newRole.value;

  if (!u || !p) { alert('Enter username and password'); return; }
  if (users.find(x => x.username === u)) { alert('Username already exists'); return; }

  users.push({ username: u, password: p, role: r });
  saveUsers();
  newUsername.value = '';
  newPassword.value = '';
  newRole.value = 'employee';
  renderUsers();
});

renderUsers();

// Refresh when window focused (in case other pages edited users)
window.addEventListener('focus', () => {
  users = JSON.parse(localStorage.getItem('users')) || [];
  renderUsers();
});
