const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeRegistrationInput } = require("../src/routes/authValidation");

test("normalizes and validates registration input", () => {
  const result = normalizeRegistrationInput({
    name: "  Jane Doe  ",
    email: "  Jane@Example.com  ",
    password: "secret123"
  });

  assert.deepEqual(result, {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "secret123"
  });
});

test("rejects malformed emails and blank values", () => {
  assert.equal(normalizeRegistrationInput({ name: "", email: "", password: "" }).error, "Name, email, and password are required.");
  assert.equal(normalizeRegistrationInput({ name: "Jane", email: "invalid-email", password: "secret123" }).error, "Please provide a valid email address.");
  assert.equal(normalizeRegistrationInput({ name: "Jane", email: "jane@example.com", password: "short" }).error, "Password must be at least 8 characters.");
});
