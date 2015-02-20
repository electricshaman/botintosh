var config = require('config');
var _ = require('lodash');

exports = module.exports = function() {
  return new ResponseHandlers();
};

function ResponseHandlers() {
	this.slackUtil = require('./slack_util');
}

ResponseHandlers.prototype.logMessageToConsole = function(slack, channel, user, msg) {
  if(config.get('bot.logging.userMessages') === true) {
    console.log('Received: %s %s @%s %s "%s"', msg.type, (channel.is_channel ? '#' : '') + channel.name, user.name, msg.ts, msg.text);
  }
  return true;
};

ResponseHandlers.prototype.sorryIWasEverBorn = function(slack, channel, user, msg) {
  if(/jeff|hefe/i.test(msg.text)) {
    channel.send("Sorry I was ever born.");
	}
  return true;
};

ResponseHandlers.prototype.doTheSongMeme = function(slack, channel, user, msg) {
  var rankThreshold = config.get('bot.songs.rankThreshold');
	var msgCleaned = msg.text.replace('\'', '');

  var query = "SELECT band, full_title, vector, query, ts_rank(vector, query, 32) AS rank " +
    "FROM songs, plainto_tsquery('english', $1) query " +
    "WHERE ts_rank(vector, query, 32) > $2 AND numnode(query) > 1 ORDER BY rank DESC LIMIT 1";

  this.db.executeQuery(query, [msgCleaned, rankThreshold], function(result) {
    if(result.rowCount == 1) {
      var song = result.rows[0];

      var response = ":two_hearts: " + song.band + " has a song called " + song.full_title;
      channel.send(response);

      console.log("Hit: Returned vector [%s] from query [%s] with rank threshold %s for song %s by %s",
				song.vector, song.query, song.rank, song.full_title, song.band);
    }
  });
  return true;
};

ResponseHandlers.prototype.thankYou = function(slack, channel, user, msg) {
	if(this.slackUtil.isBotMentioned(slack, msg)) {
		channel.send("Thank you, " + user.name + ".");
	}
	return true;
};
