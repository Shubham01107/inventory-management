const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200
        ? 500
        : res.statusCode;

    let message = err.message || "Internal Server Error";

    // Invalid MongoDB ID
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid product ID";
    }

    // Mongoose schema validation errors
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(error => error.message)
            .join(", ");
    }

    // Duplicate SKU error
    if (err.code === 11000) {
        statusCode = 409;
        message = "A product with this SKU already exists";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;