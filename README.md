# Inventory and Data Management System

A backend-based Inventory Management System built using Node.js, Express.js, MongoDB, and Mongoose. This project provides REST APIs to manage products, track stock levels, and generate inventory reports.

## Features

- Create new products
- Retrieve all products and individual products
- Update product details
- Delete products
- Restock products and record sales
- Filter products by category, search term, and price range
- Sort and paginate product listings
- Generate low-stock reports
- Generate category-wise inventory summaries
- Validate user input and handle errors centrally
- Store configuration securely using environment variables

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- dotenv
- Postman for API testing

## Project Structure

```text
inventory-management/
├── config/
│   └── db.js
├── middleware/
│   └── errorMiddleware.js
├── models/
│   └── Product.js
├── postman/
├── routes/
│   └── productRoutes.js
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Shubham01107/inventory-management.git
cd inventory-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root directory and add your MongoDB connection string and port:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Replace the placeholder with your actual MongoDB connection string. Do not upload your `.env` file or expose database credentials publicly.

### 4. Start the server

For development:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The server runs on `http://localhost:5000` by default.

## API Endpoints

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a product |
| GET | `/` | Get products with filtering, sorting, and pagination |
| GET | `/:id` | Get a product by ID |
| PATCH | `/:id` | Update product details |
| PATCH | `/:id/restock` | Increase stock quantity |
| PATCH | `/:id/sale` | Record a sale and decrease stock |
| DELETE | `/:id` | Delete a product |
| GET | `/reports/low-stock` | Get low-stock products |
| GET | `/reports/category-summary` | Get category-wise inventory summary |

## Product Data

A product can include the following fields:

- `name` — Product name
- `sku` — Unique stock keeping unit
- `category` — Product category
- `price` — Product price
- `quantity` — Available stock quantity
- `lowStockThreshold` — Threshold used for low-stock reporting
- `supplier` — Supplier name

## API Testing

The APIs can be tested using Postman. Test requests for product creation, retrieval, updates, stock adjustments, deletion, and inventory reports.

## Error Handling

The application includes centralized error handling for validation errors, invalid product IDs, duplicate SKUs, and other request errors.

## Author

Shubham Gautam

## License

This project was developed for educational purposes.