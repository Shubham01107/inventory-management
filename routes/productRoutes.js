const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// Validate MongoDB product ID
const checkId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
    }

    next();
};

// 1. CREATE PRODUCT
router.post("/", async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// 2. GET ALL PRODUCTS
// Supports filtering, sorting and pagination
router.get("/", async (req, res, next) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = "createdAt",
            order = "desc",
            page = "1",
            limit = "10"
        } = req.query;

        const allowedSortFields = [
            "name",
            "price",
            "quantity",
            "createdAt"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sortBy field"
            });
        }

        if (!["asc", "desc"].includes(order)) {
            return res.status(400).json({
                success: false,
                message: "Order must be asc or desc"
            });
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(pageSize) ||
            pageNumber < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid page or limit"
            });
        }

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.name = {
                $regex: escapedSearch,
                $options: "i"
            };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }

            if (
                Object.values(filter.price).some(
                    value => !Number.isFinite(value) || value < 0
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid price range"
                });
            }

            if (
                minPrice !== undefined &&
                maxPrice !== undefined &&
                Number(minPrice) > Number(maxPrice)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "minPrice cannot exceed maxPrice"
                });
            }
        }

        const sortDirection = order === "asc" ? 1 : -1;
        const skip = (pageNumber - 1) * pageSize;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ [sortBy]: sortDirection })
                .skip(skip)
                .limit(pageSize),

            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// 3. LOW-STOCK REPORT
router.get("/reports/low-stock", async (req, res, next) => {
    try {
        const products = await Product.find({
            $expr: {
                $lte: ["$quantity", "$lowStockThreshold"]
            }
        }).sort({ quantity: 1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// 4. CATEGORY-WISE INVENTORY SUMMARY
router.get("/reports/category-summary", async (req, res, next) => {
    try {
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    totalUnits: { $sum: "$quantity" },
                    totalInventoryValue: {
                        $sum: {
                            $multiply: ["$price", "$quantity"]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalProducts: 1,
                    totalUnits: 1,
                    totalInventoryValue: {
                        $round: ["$totalInventoryValue", 2]
                    }
                }
            },
            {
                $sort: { category: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
});

// 5. GET SINGLE PRODUCT
router.get("/:id", checkId, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// 6. UPDATE PRODUCT DETAILS
router.patch("/:id", checkId, async (req, res, next) => {
    try {
        const allowedFields = [
            "name",
            "sku",
            "category",
            "price",
            "lowStockThreshold",
            "supplier"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide valid product fields to update"
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// 7. RESTOCK PRODUCT
router.patch("/:id/restock", checkId, async (req, res, next) => {
    try {
        const amount = req.body.amount;

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Restock amount must be a positive integer"
            });
        }

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                quantity: { $lte: Number.MAX_SAFE_INTEGER - amount }
            },
            {
                $inc: { quantity: amount }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            const exists = await Product.exists({
                _id: req.params.id
            });

            return res.status(exists ? 400 : 404).json({
                success: false,
                message: exists
                    ? "Restock would exceed the safe quantity limit"
                    : "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock increased successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// 8. RECORD A SALE
router.patch("/:id/sale", checkId, async (req, res, next) => {
    try {
        const amount = req.body.amount;

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Sale amount must be a positive integer"
            });
        }

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                quantity: { $gte: amount }
            },
            {
                $inc: { quantity: -amount }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            const existingProduct = await Product.findById(
                req.params.id
            );

            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            return res.status(400).json({
                success: false,
                message: "Insufficient stock for this sale",
                availableQuantity: existingProduct.quantity
            });
        }

        res.status(200).json({
            success: true,
            message: "Sale recorded successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
});

// 9. DELETE PRODUCT
router.delete("/:id", checkId, async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;