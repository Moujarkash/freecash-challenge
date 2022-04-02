const mysql = require('mysql');
const util = require('util');

const config = require('./config');

const connection = mysql.createConnection(config.database);

const query = util.promisify(connection.query).bind(connection);

module.exports = query;