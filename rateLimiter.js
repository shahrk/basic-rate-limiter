let rateLimiter = {};
let redis = require('redis');
let dayjs = require('dayjs');
let now = dayjs();
const redisCredentials = require('./redisCredentials.json');
const timeFormat = 'DD/MM/YY HH:mm:ss';
const maxHits = 5;
const window = 60000;
client = redis.createClient(redisCredentials);
// multi = client.multi();

rateLimiter.limit = function (id) {
    let timerId = 'time-'+id;
    let counterId = 'count-'+id;
    client.get(timerId,function(err, value) {
        if (err) { 
            throw err;
        } else {
            console.log(dayjs(value).format(timeFormat));
            if (value == null || dayjs().valueOf() - value > window) {
                client.set(timerId, dayjs().valueOf(),function(err) {
                    if (err) {
                        throw err;
                    }
                });
                client.set(counterId, 1, function(err) {
                    if (err) {
                        throw err;
                    }
                });
            } else {
                client.get(counterId, function(err, count) {
                    count = parseInt(count);
                    if (err) {
                        throw err;
                    } else {
                        console.log("count " + count);
                        if (count == maxHits) {
                            console.log("throttling client");
                        } else {
                            client.set(counterId, count + 1, function(err) {
                                if (err) {
                                    throw err;
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