var config = require('config');

exports = module.exports = function() {
  return new ResponseHandlers();
};

function ResponseHandlers() {
}

ResponseHandlers.prototype.logMessageToConsole = function(channel, user, msg) {
  if(config.get('bot.logging.userMessages') === true) {
    console.log('Received: %s %s @%s %s "%s"', msg.type, (channel.is_channel ? '#' : '') + channel.name, user.name, msg.ts, msg.text);
  }
  return true;
};

ResponseHandlers.prototype.sorryIWasEverBorn = function(channel, user, msg) {
  if(/jeff|hefe/i.test(msg.text)) {
    channel.send("Sorry I was ever born.");
  }
  return true;
};

ResponseHandlers.prototype.doTheSongMeme = function(channel, user, msg) {
  var rankThreshold = config.get('bot.songs.rankThreshold');

  var query = "SELECT band, full_title, vector, query, ts_rank(vector, query) AS rank " +
    "FROM songs, plainto_tsquery('english', $1) query " +
    "WHERE ts_rank(vector, query) > $2 ORDER BY rank DESC LIMIT 1";

  this.db.executeQuery(query, [msg.text, rankThreshold], function(result) {
    if(result.rowCount == 1) {
      var song = result.rows[0];
      console.log("Hit: Returned vector [%s] from query [%s] with rank threshold %s for song %s by %s", song.vector, song.query, song.rank, song.full_title, song.band);
      var response = ":two_hearts: " + song.band + " has a song called " + song.full_title;
      channel.send(response);
    }
  });

  return true;
};