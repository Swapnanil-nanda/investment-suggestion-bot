const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../../controllers/product.controller');
const { protect } = require('../../middleware/auth.middleware');
const { handleValidationErrors } = require('../../middleware/validate.middleware');

const router = express.Router();

// All product routes require authentication
router.use(protect);

// Validation schemas
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['electronics', 'clothing', 'food', 'other'])
    .withMessage('Category must be electronics, clothing, food, or other'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  handleValidationErrors,
];

const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .isIn(['electronics', 'clothing', 'food', 'other'])
    .withMessage('Category must be electronics, clothing, food, or other'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  handleValidationErrors,
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  handleValidationErrors,
];

router.route('/')
  .get(getProducts)
  .post(createProductValidation, createProduct);

router.route('/:id')
  .get(idValidation, getProductById)
  .put(updateProductValidation, updateProduct)
  .delete(idValidation, deleteProduct);

module.exports = router;
