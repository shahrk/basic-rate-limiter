const express = require('express');
const app = express();
const http2 = require('http2');
const router = express.Router();
const port = 3000;
const rateLimiter = require('./rateLimiter');

rateLimiter.setOptions({
    window: 30000,
    message: "User is only allowed 5 requests per 30 seconds"
});

router.use(rateLimiter.limit);

router.get('/test', (req, res) => {
    res.send("HELLO WORLD");
});

app.use(logErrors);
app.use(clientErrorHandler);

app.use('/',router);

app.listen(port, () => console.log("Server running on port: " + port))

function logErrors (err, req, res, next) {
    console.error(err.stack)
    next(err)
}

function clientErrorHandler (err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}

function errorHandler (err, req, res, next) {
    res.status(500)
    res.render('error', { error: err })
}