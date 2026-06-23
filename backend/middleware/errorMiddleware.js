function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
}

module.exports = { notFound, errorHandler };
