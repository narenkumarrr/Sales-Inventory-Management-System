const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === "" || password === "") {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token); // Store the JWT

    // Optionally, decode token to get user details or fetch user profile
    // For now, let's assume the presence of token means successful login
    // And role will be checked on protected routes.
    // However, for UI-level role checks, you might decode the token here
    // or have the backend send user role explicitly in login response.
    
    // For seamless transition, we'll store a placeholder currentUser based on username for now,
    // and rely on backend for role enforcement.
    // Frontend could later decode JWT to get role if needed for UI.
    localStorage.setItem('currentUser', JSON.stringify({ username: username }));

    window.location.href = 'dashboard.html';

  } catch (error) {
    console.error('Login error:', error);
    alert(error.message);
  }
});
