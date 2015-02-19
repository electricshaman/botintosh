var poolModule = require('generic-pool');
var config = require('config');

exports = module.exports = function () {
  var poolConfig = config.get('dbPool');
  var clientConfig = config.get('db');
  return poolModule.Pool({
    name: poolConfig.name,
    min: poolConfig.min,
    max: poolConfig.max,
    idleTimeoutMillis: poolConfig.idleTimeoutMs,
    log: poolConfig.logging,
    create: function(callback) {
      var Client = require('pg').Client;
      var client = new Client(clientConfig);
      client.connect();
      callback(null, client);
    },
    destroy: function(client) {
      client.end();
    }
  });
};
