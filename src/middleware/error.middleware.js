import ApiError from "../utils/ApiError.js"; // Adjust the path to your ApiError class

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong on the server";
    
    error = new ApiError(
      statusCode, 
      message, 
      error?.errors || [], 
      err.stack
    );
  }

  const response = {
    success: error.success,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  };

  if (process.env.NODE_ENV === "production") {
    console.error(`[API ERROR] ${error.statusCode} - ${error.message}\nStack: ${error.stack}`);
  } else {
    console.error(error);
  }

  // Send the JSON response to the client
  return res.status(error.statusCode).json(response);
};

export default errorHandler;