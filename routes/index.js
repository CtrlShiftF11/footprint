var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('index', { title: 'footprint' });
});

router.get('/index', function (req, res) {
    res.render('index', { title: 'footprint' });
});

router.get('/views/index', function (req, res) {
    res.render('index', { title: 'footprint' });
});

router.get('/views/projects', function (req, res) {
    res.render('projects', { title: 'footprint' });
});

router.get('/views/epics', function (req, res) {
    res.render('epics', { title: 'footprint' });
});

router.get('/views/issues', function (req, res) {
    res.render('issues', { title: 'footprint' });
});

module.exports = router;
