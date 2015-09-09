var https = require('https');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var businessInitModels = {};

//Optionally pass startDate and endDate params
businessInitModels.getBusinessInits = function getBusinessInits(params, callback) {
    var qry = "SELECT   id, title, summary, start_date, end_date ";
    qry += "FROM        business_initiative ";
    qry += "WHERE       1 = 1 ";
    if (typeof params.startDate !== 'undefined') {
        qry += "AND         DATE(start_date) BETWEEN :start_date AND :end_date ";
    }
    if (typeof params.endDate !== 'undefined') {
        qry += "AND         DATE(end_date) BETWEEN :start_date AND :end_date ";
    }
    qry += "ORDER BY    start_date ASC;";
    sequelize.query(qry, {
        replacements: {
            start_date: params.startDate, end_date: params.endDate
        },
        type: Sequelize.QueryTypes.SELECT
    }).then(function (results) {
        callback(results);
    });
};

module.exports = businessInitModels;