var express = require('express');
var router = express.Router();
var rapidBoard = require('../models/rapidboard');

router.get('/', function (req, res, next) {
    rapidBoard.getJiraRapidBoards(function (success) {
        if (success) {
            rapidBoard.getRapidBoards(function (rapidBoardList) {
                res.json(rapidBoardList);
            });
        }
    });
});

module.exports = router;