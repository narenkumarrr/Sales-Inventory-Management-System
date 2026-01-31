const form = document.getElementById("loginForm");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "" || password === "") {
    alert("Please fill all fields");
    return;
  }

  console.log("Username:", username);
  console.log("Password:", password);
});

