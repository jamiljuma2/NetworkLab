const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { env } = require("../config/env");

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtTtl,
  });
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  signToken,
  hashPassword,
  comparePassword,
};
