var express = require('express');
var router = express.Router();
var rapidBoard = require('../models/rapidboard');

//Gets Rapid Boards from JIRA's API, INSERTS them into database if they don't exist and then returns the list of Rapid Boards
router.get('/', function (req, res, next) {
    rapidBoard.getJiraRapidBoards(function (rapidBoardList) {
        rapidBoard.insertRapidBoards(rapidBoardList, function (success) {
            if (success) {
                rapidBoard.getRapidBoards(function (rapidBoards) {
                    res.json(rapidBoards);
                });
            }
        });
    });
});

module.exports = router;