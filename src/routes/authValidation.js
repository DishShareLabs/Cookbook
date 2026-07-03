const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRegistrationInput(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  return { name, email, password };
}

module.exports = {
  normalizeRegistrationInput
};
