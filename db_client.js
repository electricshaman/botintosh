var RSVP = require('rsvp');

exports = module.exports = function(pool) {
  return new DbClient(pool);
};

function DbClient(pool) {
  this.pool = pool;
}

DbClient.prototype.acquireClientFromPool = function() {
  var self = this;
  return new RSVP.Promise(function(resolve, reject) {
    self.pool.acquire(clientHandler);
    function clientHandler(err, client) {
      if(err) {
        reject(err);
      } else {
        resolve(client);
      }
    }
  });
};

DbClient.prototype.executeQueryUsingClient = function(client, sql, values) {
  var self = this;
  return new RSVP.Promise(function(resolve, reject) {
    client.query(sql, values, queryHandler);
    function queryHandler (err, result) {
      self.pool.release(client);
      if(err) {
        console.log("%j", err);
        reject(err)
      } else {
        resolve(result);
      }
    }
  });
};

DbClient.prototype.executeQuery = function (sql, values, selector) {
  var self = this;
  return self.acquireClientFromPool().then(function(client) {
    return self.executeQueryUsingClient(client, sql, values);
  }).then(function(result) {
    return selector(result);
 });
};

DbClient.prototype.firstRowSelector = function(result) {
  return result.rows.length > 0 ? result.rows[0] : null;
};

DbClient.prototype.allRowsSelector = function (result) {
  return result.rows;
};