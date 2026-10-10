const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [2, "Name must have at least 2 characters"]
        },

        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            trim: true,
            uppercase: true
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0.01, "Price must be greater than zero"]
        },

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            default: 0,
            min: [0, "Quantity cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number"
            }
        },

        lowStockThreshold: {
            type: Number,
            default: 10,
            min: [0, "Threshold cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Threshold must be a whole number"
            }
        },

        supplier: {
            type: String,
            trim: true,
            default: "Not specified"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);