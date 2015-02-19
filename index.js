'use strict';
var config = require('config'),
    Slack = require('slack-client'),
    handlers = require('./response_handlers')(),
    dbPool = require('./db_pool')(),
    db = require('./db_client')(dbPool),
    _ = require('lodash');

// Put some utils on the response handlers object
_.assign(handlers, {
  db: db
});

var slackConfig = config.get('slack');
var token = slackConfig.get('apiToken'),
    autoReconnect = slackConfig.get('autoReconnect'),
    autoMark = slackConfig.get('autoMark');

var slack = new Slack(token, autoReconnect, autoMark);

slack.on('open', function() {
  var channels = [],
      groups = [],
      unreads = slack.getUnreadCount(),
      key;

  for (key in slack.channels) {
    if (slack.channels[key].is_member) {
      channels.push('#' + slack.channels[key].name);
    }
  }

  for (key in slack.groups) {
    if (slack.groups[key].is_open && !slack.groups[key].is_archived) {
      groups.push(slack.groups[key].name);
    }
  }

  console.log('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
  console.log('You are in: %s', channels.join(', '));
  console.log('As well as: %s', groups.join(', '));
  console.log('You have %s unread ' + (unreads === 1 ? 'message' : 'messages'), unreads);
});

slack.on('message', function(message) {
  if (message.type === 'message') {
    var channel = slack.getChannelGroupOrDMByID(message.channel),
        user = slack.getUserByID(message.user);

    // This pulls all the functions from ResponseHandlers and calls them with parameters (channel, user, message)
    // Order of execution is not guaranteed.
    var results = _.chain(_.functions(handlers))
      .reduce(function(result, fnKey) {
        var handler = _.bindKey(handlers, fnKey, channel, user, message);
        result[fnKey] = _.attempt(handler);
        return result;
      }, {})
      .value();
  }
});

slack.on('error', function(error) {
  console.error('Error: %s', error);
});

slack.login();