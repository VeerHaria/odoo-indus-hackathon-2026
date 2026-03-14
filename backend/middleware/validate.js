const validateFields = (fields, body) => {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Field "${field}" is required.`;
    }
  }
  return null;
};

module.exports = { validateFields };