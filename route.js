'use strict';

var express = require('express');
var mysql = require('mysql');

var crypt = require('./phash');

var router = express.Router();

var pool = mysql.createPool({
        connectionLimit:        '10',
        host:                   'recamoviedb.ckpibjxnazn6.us-west-2.rds.amazonaws.com',
        user:                   'recamovieaws',
        password:               'rmawsdb!',
        database:               'masterdb'
});

var loggedIn = function (request, response) {
        if (request.session.login) {
                response.redirect('/home');

                return 1;
        }

        return 0;
};
var loggedOut = function (request, response) {
        if (!request.session.login) {
                response.redirect('/?msg=You+need+to+login+first%21');

                return 1;
        }

        return 0;
};

router.get('/', function (request, response) {
        if (loggedIn(request, response)) return;

	response.render('login', { msg: request.query.msg });
});

router.post('/', function (request, response) {
        if (loggedIn(request, response)) return;

        request.check('email', 'Email is invalid.').isEmail();
        request.check('password', 'Password field is empty.').notEmpty();

        request.getValidationResult().then(function (result) {
                if (!result.isEmpty()) {
                        response.render('login', { errs: result.array() });
                        return;
                }

                pool.getConnection(function (err, con) {
                        if (err) {
                                console.log('Connection error: ', err);
                                response.render('login', { msg: 'Connection to the server failed!' });
                                return;
                        }

                        var sql = 'SELECT password, nacl, firstname FROM users WHERE email = ?';
                        var value = request.body.email;
                        con.query(sql, [value], function (err, result) {
                                con.release();
                                if (err) {
                                        console.log('Connection error: ', err);
                                        response.render('login', { msg: 'Request to the server failed!' });
                                        return;
                                }

                                console.log(result);
                                if (result.length <= 0) {
                                        response.render('login', { msg: 'Email or password is invalid. Try again.' });
                                        return;
                                }

                                var res = result[0];
                                if (!crypt.verify(res.password, request.body.password, res.nacl)) {
                                        response.render('login', { msg: 'Email or password is invalid. Try again.' });
                                        return;
                                }

                                request.session.login = true;
                                request.session.email = request.body.email;
                                request.session.firstname = res.firstname;
                                response.redirect('/home?msg=Logged+in+successfully%21');
                        });

                        con.on('error', function (err) {
                                console.log('Connection error: ', err);
                                response.render('login', { msg: 'Server request failed!' });
                                return;
                        });
                });
        });
});

router.get('/register', function (request, response) {
        if (loggedIn(request, response)) return;

        response.render('register');
});

router.post('/register', function (request, response) {
        if (loggedIn(request, response)) return;

        request.check('email', 'Email is invalid.').isEmail();
        request.check('email', 'Email length must be within 6 to 50 characters long.').len(6, 50);
        request.check('password', 'Password length must be within 8 to 100 characters long.').len(8, 100);
        request.check('confirm', 'Passwords do not match.').equals(request.body.password);
        request.check('firstname', 'First name must have a maximum length of 20.').isLength({ max: 20 });
        request.check('lastname', 'Last name must have a maximum length of 20.').isLength({ max: 20 });

        request.getValidationResult().then(function (result) {
                if (!result.isEmpty()) {
                        response.render('register', { errs: result.array() });
                        return;
                }

                pool.getConnection(function (err, con) {
                        if (err) {
                                console.log('Connection error: ', err);
                                response.render('register', { msg: 'Connection to the server failed!' });
                                return;
                        }

                        var sql = 'SELECT email FROM users WHERE email = ?';
                        var value = request.body.email;
                        con.query(sql, [value], function (err, result) {
                                if (err) {
                                        con.release();
                                        console.log('Connection error: ', err);
                                        response.render('register', { msg: 'Request to the server failed!' });
                                        return;
                                }

                                console.log(result);
                                if (result.length > 0) {
                                        con.release();
                                        response.render('register', { msg: 'That email is taken. Try another.' });
                                        return;
                                }

                                var email = request.body.email;
                                var firstname = request.body.firstname;
                                var lastname = request.body.lastname;
                                if (!firstname || firstname == '') firstname = 'John';
                                if (!lastname || lastname == '') lastname = 'Doe';
                                var password = crypt.sha256Crypt(request.body.password);

                                var sql = 'INSERT INTO users (email, password, nacl, firstname, lastname) VALUES ?';
                                var values = [[email, password.hash, password.salt, firstname, lastname]];
                                con.query(sql, [values], function (err, result) {
                                        con.release();
                                        if (err) {
                                                console.log('Connection error: ', err);
                                                response.render('register', { msg: 'Request to the server failed!' });
                                                return;
                                        }

                                        response.redirect('/?msg=Registration+successful%21');
                                });
                        });

                        con.on('error', function (err) {
                                console.log('Connection error: ', err);
                                response.render('register', { msg: 'Server request failed!' });
                                return;
                        });
                });
        });
});

router.post('/ajax-api-session', function (request, response) {
        pool.getConnection(function (err, con) {
                if (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                }

                var sql = 'SELECT email FROM users WHERE email = ?';
                var value = request.body.email;
                con.query(sql, [value], function (err, result) {
                        if (err) {
                                con.release();
                                console.log('Connection error: ', err);
                                response.send(JSON.stringify({ status: 0 }));
                                return;
                        }

                        console.log(result);
                        if (result.length > 0) {
                                con.release();
                                request.session.login = true;
                                request.session.email = request.body.email;
                                request.session.firstname = request.body.firstname;
                                response.send(JSON.stringify({ status: 1 }));
                                return;
                        }

                        var email = request.body.email;
                        var firstname = request.body.firstname;
                        var lastname = request.body.lastname;
                        if (!firstname || firstname == '') firstname = 'John';
                        if (!lastname || lastname == '') lastname = 'Doe';
                        var password = crypt.sha256Crypt(request.body.id);

                        var sql = 'INSERT INTO users (email, password, nacl, firstname, lastname) VALUES ?';
                        var values = [[email, password.hash, password.salt, firstname, lastname]];
                        con.query(sql, [values], function (err, result) {
                                con.release();
                                if (err) {
                                        console.log('Connection error: ', err);
                                        response.send(JSON.stringify({ status: 0 }));
                                        return;
                                }

                                request.session.login = true;
                                request.session.email = email;
                                request.session.firstname = firstname;
                                response.send(JSON.stringify({ status: 1 }));
                                return;
                        });
                });

                con.on('error', function (err) {
                        console.log('Connection error: ', err);
                        response.send(JSON.stringify({ status: 0 }));
                        return;
                });
        });
});

router.get('/logout', function (request, response) {
        if (loggedOut(request, response)) return;

        request.session.destroy();
        response.redirect('/?msg=Logged+out+successfully%21');
});

router.get('/home', function (request, response) {
        if (loggedOut(request, response)) return;

	response.render('home', { msg: request.query.msg, fn: request.session.firstname });
});

router.get('/privacy-policy', function (request, response) {
	response.render('privacy');
});

router.get('/terms-of-service', function (request, response) {
	response.render('terms');
});

router.use(function (request, response) {
        response.status(404).render('404', { url: request.url });
});

router.use(function (request, response) {
        response.status(500).render('500');
});

module.exports = router;
