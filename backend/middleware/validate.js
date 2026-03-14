const validateFields = (fields, body) => {
  const missing = fields.filter(f => !body[f] && body[f] !== 0);
  return missing.length > 0 ? `Missing required fields: ${missing.join(", ")}` : null;
};

module.exports = { validateFields };s