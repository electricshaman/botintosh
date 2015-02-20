var config = require('config'),
		_ = require('lodash');

exports = module.exports = new SlackUtil();

function SlackUtil() {
	this.userIdRegex = /<@(.*?)>/g;
}

SlackUtil.prototype.getUserMentions = function(slack, msg) {
	var mentions = [];
	var match = this.userIdRegex.exec(msg.text);
	while (match != null) {
		for (var i = 1; i < match.length; i++) {
			var id = match[i];
			var mentioned = slack.getUserByID(id);
			mentions.push(mentioned);
		}
		match = this.userIdRegex.exec(msg.text);
	}
	return mentions;
};

SlackUtil.prototype.isBotMentioned = function(slack, msg) {
	var mentions = this.getUserMentions(slack, msg);
	var botName = config.get('bot.name');
	return _.any(mentions, 'name', botName);
};
