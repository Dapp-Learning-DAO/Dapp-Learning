const knex = require('./db')

// Retrieve all receipt
exports.receiptAll = async (req, res) => {
    // Get all receipt from database
    knex
        .select('*') // select all records
        .from('receipt') // from 'receipt' table
        .where('from', 'like', req.query.from)
        .then(userData => {
            // Send receipt extracted from database in response
            res.json(userData)
        })
        .catch(err => {
            // Send a error message in response
            res.json({ message: `There was an error retrieving receipt: ${err}` })
        })
}

// Create new book
exports.receiptCreate = async (req, res) => {
    // Add new book to database
    knex('receipt')
        .insert({ // insert new record, a book
            'from': req.body.from,
            'to': req.body.to,
            'transactionHash': req.body.transactionHash,
            'pubDate': Date.now(),
        })
        .then(() => {
            // Send a success message in response
            res.json({ message: `receipt \'${req.body.transactionHash}\' by ${req.body.from} created.` })
        })
        .catch(err => {
            // Send a error message in response
            res.json({ message: `There was an error creating ${req.body.token} book: ${err}` })
        })
}

// Remove specific book
exports.receiptDelete = async (req, res) => {
    // Find specific book in the database and remove it
    knex('receipt')
        .where('id', req.body.id) // find correct record based on id
        .del() // delete the record
        .then(() => {
            // Send a success message in response
            res.json({ message: `receipt ${req.body.id} deleted.` })
        })
        .catch(err => {
            // Send a error message in response
            res.json({ message: `There was an error deleting ${req.body.id} book: ${err}` })
        })
}

// Remove all receipt on the list
exports.receiptReset = async (req, res) => {
    // Remove all receipt from database
    knex
        .select('*') // select all records
        .from('receipt') // from 'receipt' table
        .truncate() // remove the selection
        .then(() => {
            // Send a success message in response
            res.json({ message: 'receipt list cleared.' })
        })
        .catch(err => {
            // Send a error message in response
            res.json({ message: `There was an error resetting book list: ${err}.` })
        })
}