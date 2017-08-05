var express = require('express');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var compression = require('compression');
var helmet = require('helmet');

var router = require('./route');

var app = express();

const port = 80;

app.set('view engine', 'ejs');

app.use(compression());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(expressSession({ secret: 'K0Ur98j/3yX R~XHH!jmN]LWX/,?DP', saveUninitialized: false, resave: false }));

app.use('/style', express.static(path.join(__dirname, 'css')));
app.use('/script', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/', router);

app.listen(port, function () {
	console.log('Listening on port: ', port);
});
