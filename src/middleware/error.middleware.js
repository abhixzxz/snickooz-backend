import AppError from '../utils/AppError.js';

// Handle Mongoose validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};

// Handle Mongoose duplicate field errors
const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`, 400);
};

// Handle Mongoose cast errors
const handleCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.code === 11000) error = handleDuplicateFieldsError(err);
    if (err.name === 'CastError') error = handleCastError(err);

    sendErrorProd(error, res);
  }
};