const Discord = require('discord.js');
const dozal = new Discord.Client();
const user = require('./user.js');
const responses = require('./characteristics/responses.js');
const dotaFetcher = require('./dotafetcher/index.js');
const helpers = require('./helpers.js')
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');
const Music = require('./music/music.js');
dozal.music = new Music();
var url = 'mongodb://localhost:27017/dozal';

dozal.on('ready', () => {
  console.log('Geldim agam.');
  var allChannels = Array.from(dozal.channels.values());
  for (channel of allChannels) {
    if (channel.type == 'text')
    {
      //channel.send("ESSELÂMU ALEYKÜM VE RAHMETÜLLÂHU VE BEREKÂTUHU");
    }
  }


});

dozal.on('message', msg => {
  var channel = msg.channel


  var messageContent = msg.content.toLowerCase()
  if ((messageContent.startsWith('s.a.') || messageContent.startsWith('s.a') ||
  messageContent.startsWith('sa.') || messageContent.startsWith('s.a.')) && msg.author.username !== 'dozal')
  {
    channel.send('a.s. ' + msg.author.username)
  }
  else if (messageContent.startsWith('dozal'))
  {

    // komut simgesi dozalın kendisi olur (:
    var splittedContent = msg.content.split(' ').slice(1)
    var requestType = splittedContent[0];
    switch(requestType){
    // Dota 2 için komutlar
      case('dota'):

        break;

      case('çal'):

        dozal.music.flow(this,splittedContent.slice(1),msg);
        break;
      case('geç'):
        dozal.music.next();
        break;
      default:
        channel.send('Böyle bir emir yok.');
        break;

    }
  }

});

dozal.login(user.token);
