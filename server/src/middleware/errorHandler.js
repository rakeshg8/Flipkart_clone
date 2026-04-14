export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
};
