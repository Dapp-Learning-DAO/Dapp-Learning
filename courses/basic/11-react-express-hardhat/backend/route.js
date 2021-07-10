// bookshelf-app/server/routes/books-route.js

// Import express
const express = require('express')

// Import books-controller
const Routes = require('./controller.js')

// Create router
const router = express.Router()

// Add route for GET request to retrieve all book
// In server.js, books route is specified as '/books'
// this means that '/all' translates to '/books/all'
router.get('/receipt/all', Routes.receiptAll)

// Add route for POST request to create new book
// In server.js, books route is specified as '/books'
// this means that '/create' translates to '/books/create'
router.post('/receipt/create', Routes.receiptCreate)

// Add route for PUT request to delete specific book
// In server.js, books route is specified as '/books'
// this means that '/delete' translates to '/books/delete'
router.put('/receipt/delete', Routes.receiptDelete)

// Add route for PUT request to reset bookshelf list
// In server.js, books route is specified as '/books'
// this means that '/reset' translates to '/books/reset'
router.put('/receipt/reset', Routes.receiptReset)

// Export router
module.exports = router