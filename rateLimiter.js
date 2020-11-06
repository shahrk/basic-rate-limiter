let rateLimiter = {};
let redis = require('redis');
let dayjs = require('dayjs');

options = {
    redisCredentials: {"port": 6379,"host": "0.0.0.0"},
    timeFormat: 'DD/MM/YY HH:mm:ss',
    limit: 5,
    window: 60000,
    statusCode: 429,
    message: 'Amount of requests beyond limit of user',
    keyFunction: function(req,res) {return req.ip}
};

rateLimiter.setOptions = function(clientOptions) {
    options = Object.assign(options, clientOptions);
    client = redis.createClient(options.redisCredentials);
};

rateLimiter.limit = function (req, res, next) {
    let id = options.keyFunction(req,res);
    let timerId = 'time-'+id;
    let counterId = 'count-'+id;
    client.get(timerId,function(err, value) {
        if (err) { 
            next(err);
        } else {
            console.log(dayjs(value).format(options.timeFormat));
            if (value == null || dayjs().valueOf() - value > options.window) {
                let arr = [];
                arr.push(timerId);
                arr.push(dayjs().valueOf());
                arr.push(counterId);
                arr.push(1);
                client.mset(arr, function(err) {
                    err = new Error("manually generated error");
                    if (err) {
                        next(err);
                    } else {
                        next();
                    }
                });
            } else {
                client.get(counterId, function(err, count) {
                    count = parseInt(count);
                    if (err) {
                        err = new Error("manually generated error");
                        next(err);
                    } else {
                        console.log("count " + count);
                        if (count == options.limit) {
                            res.status(options.statusCode).send(options.message);
                        } else {
                            client.set(counterId, count + 1, function(err) {
                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }
                            });
                        }
                    }
                })
            }
        }
    });
};

module.exports = rateLimiter;