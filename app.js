var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lodash = require('lodash');
var moment = require('moment');

var routes = require('./routes/index');
var projects = require('./routes/projects');
var epics = require('./routes/epics');
var issues = require('./routes/issues');
var rapidBoards = require('./routes/rapidboards');
var sprints = require('./routes/sprints');
var synchronizer = require('./routes/synchronizer');
//var ngenUserLogins = require('./routes/modules/ngen/ngenuserlogins');
var ngenUserLogins = require('./routes/ngenuserlogins');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/images/favicons/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

////Mustache Template files...
////app.use(express.static('views/templates'));
//app.use(express.static(path.join(__dirname, 'views/templates')));
//app.use(express.static(path.join(__dirname, 'templates')));

//Routing...
app.use('/', routes);

//Page Routes...
app.use('/views/projects', projects);
app.use('/views/epics', epics);
app.use('/views/modules/ngen/ngenuserlogins', ngenUserLogins);

//API Routes...
app.use('/projects', projects);
app.use('/epics', epics);
app.use('/issues', issues);
app.use('/rapidboards', rapidBoards);
app.use('/sprints', sprints);
app.use('/synchronizer', synchronizer);
app.use('/ngenuserlogins', ngenUserLogins);

//app.use('/views/projects', projects);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;