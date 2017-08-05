var crypt = require('crypto');

const pepper = 'DP7/8yX~H!jm],KU';

var nacl = function (length) {
        return crypt.randomBytes(Math.ceil(length/2)).toString('hex').slice(0, length);
};

var hash256 = function (password, salt) {
        var hash = crypt.createHmac('sha256', salt);
        var season = password + pepper;
        hash.update(season);
        var result = hash.digest('hex');
        return result;
};

module.exports.sha256Crypt = function (password) {
        var salt = nacl(16);
        var hash = hash256(password, salt);
        return { hash: hash, salt: salt };
};

module.exports.verify = function (hashed, password, salt) {
        var hash = hash256(password, salt);
        return hashed == hash ? true : false;
};
