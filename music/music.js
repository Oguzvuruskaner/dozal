const youtube = require('ytdl-core');
const cheerio = require('cheerio');
const request = require('request');
const events = require('events');
const fs = require('fs');
const Queue = require('queue-fifo');
class Music
{
  static getYoutubeLink()
  {
    return 'https://www.youtube.com';
  }
  static getQuery()
  {
    return 'https://www.youtube.com/results?search_query=';
  }
  constructor()
  {
    this.eventEmitter = new events.EventEmitter();
    this.playing = false; // Belki kullanılacak geçişlerde.
    this.dispatcher = null;
    this.connection = null;
    this.queue = new Queue();
    this.url = null; //Yeniden başlatılacağı zaman gerekli
    this.eventEmitter.on('end',this.endEventHandler);
    this.eventEmitter.on('queueEnd',this.queueEventHandler);
  }
  endEventHandler(music)
  {
    music.getNext(music.url).then((chosenOne) =>{
      const stream = youtube(chosenOne.link,{filter:'audioonly'});
      music.url = chosenOne.link;
      music.dispatcher = music.connection.playStream(stream,{seek:Music.seekTime(chosenOne.link),volume:1});
      music.dispatcher.on('end',() => {
        if(!music.queue.isEmpty())
        {
          music.eventEmitter.emit('queueEnd',music);
        }
        else {
          music.eventEmitter.emit('end',music);
        }
      });
    });
  }
  queueEventHandler(music)
  {

    const url = music.queue.dequeue();
    music.url = url;
    music.getStream(url).then((stream) => {
      music.dispatcher = music.connection.playStream(stream,{seek : Music.seekTime(music.url),volume:1});
      music.dispatcher.on('end',() => {
        if(!music.queue.isEmpty())
        {
          console.log("Girdi.");
          music.eventEmitter.emit('queueEnd',music);
        }
        else {
          music.eventEmitter.emit('end',music);
        }
      });
    });
  }





  /*

  @params {string}
  @returns {number}
  */
  static seekTime(url){
    if(url.includes('t='))
    {
      var piece  =  url.slice(url.indexOf('t=')+2);
      for(var index = 0 ; index < piece.length ; index++)
      {
        if(piece[index] == "m" || piece[index] == "h" || piece[index] == "s" )
        {
          piece = piece.slice(0,index) + " " + piece.slice(index+1);
        }
      }
      piece = piece.split(" ").slice(0,piece.length-3);
      if(piece.length <= 3)
      {
        var seekTime = 0;
        for(index in piece)
        {
          seekTime *= 60;
          seekTime += parseInt(piece[index]);
        }
        return (seekTime == NaN) ? 0 :seekTime;
      }
      else {
        return 0;
      }
    }

    return 0;
  }

  /*

    @params{string}
    @returns{stream}



  */
  getStream(url)
  {
      return new Promise( (resolve,reject) => {
        try{
          const stream = youtube(url,{filter:'audioonly',quality:'highestaudio'});
          resolve(stream);
        }
        catch(e)
        {
          console.error(e);
        }
      });
  }

  /**

  *@param{string:url}*
  *@returns{string:youtubesearchQuery}
  */
  static searchQuery(url)
  {
    for(index in url)
    {
      switch(url[index])
      {
        case(" "):
          url = url.slice(0,url) + "+" + url.slice(url+1);
          break;
        case("+"):
          url = url.slice(0,url) + "%2B" + url.slice(url+1);
          break;
        case("%"):
          url = url.slice(0,url) + "%25" + url.slice(url+1);
          break;
        default:
          continue;

      }
    }
    return url;
  }
  /*
    @params{Discord.Client,string,Message}

    dozal.çal komutuyla tetiklenir.
  */

  flow(bot,url,msg)
  {


    //DOZAL KANALDA
    if(this.connection && this.dispatcher)
    {
      // this.url = url;
      // this.dispatcher.end('user');
      // const stream = youtube(url,{filter:'audioonly',quality:'highestaudio'});
      // this.dispatcher = this.connection.playStream(stream,{volume:1});
      // this.dispatcher.on('end',() => {
      // this.eventEmitter.emit('end',this,url);
      this.getStream(url).then((stream) =>{
        //Eğer şarkı devam ediyorsa sıraya ekler.
        this.queue.enqueue(url);

      }).catch((err) => {
        console.error(err);
      });
    }else {
      var voiceChannel = msg.member.voiceChannel;
      if(!voiceChannel)
      {
        msg.channel.send("Kanala gir önce  amına koyduğum @"+msg.author.username);
        return ;
      }


      voiceChannel.join().then(  (connection) => {
        const stream = youtube(url,{filter:'audioonly',quality:'highestaudio'});
        this.connection = connection;
        this.url = url;
        this.dispatcher = this.connection.playStream(stream,{volume:1,seek:Music.seekTime(url)});
        this.dispatcher.on('end',() => {
          if(!this.queue.isEmpty())
          {
            this.eventEmitter.emit('queueEnd',this);
          }
          else {
            this.eventEmitter.emit('end',this);
          }
        });
      });
    }
  }


  /*
  @params {string}


  @return {Array{string/url,string/video name}}
*/

  go()
  {
    if(this.dispatcher.paused)
    {
    this.dispatcher.resume();
    }
  }
  stop()
  {
    if(!this.dispatcher.paused)
    {
    this.dispatcher.pause();
    }
  }
   getNext(url)
  {
    return new Promise( (resolve,reject) => {
      var c = [];
        request(url,function(err,res,body){

          var $ = cheerio.load(body);
          $('.content-wrapper a').each(function(index,element){

            c[index] = {link:'https://www.youtube.com'+element.attribs.href,name:element.attribs.title};

        });
        if(c == 0)
        {
          reject(c);
        }
        else
        {
          let randNumber = (nese) => {return Math.floor(Math.random()*nese)};
          resolve(c[randNumber(c.length)]);
          }
      });


    });
  }


  exit(bot,msg)
  {
      msg.channel.send('Çıkıyorum agam :tired_face::tired_face::tired_face:');
      this.kill(bot,msg);

  }
  kill(bot,msg)
  {
    var voiceChannel = msg.member.voiceChannel;
    if(!voiceChannel)
    {
      msg.channel.send("Kanalda mısın da kanaldan çıkmaktan bahsediyorsun @"+msg.author.username);
      return ;
    }
    this.dispatcher = null;
    this.connection = null;
    this.queue = new Queue();
    this.url = null; //Yeniden başlatılacağı zaman gerekli
  }



  next(msg)
  {
    if(this.dispatcher)
    {
      this.dispatcher.end();
    }
    else {
      msg.channel.send('Listede çalınacak şarkı yok @' + msg.author.username);
    }
  }
  res(msg)
  {
    this.queue.enqueue(this.url);
    console.log(this.queue.peek());
    this.dispatcher.end();
  }
  neverEnd()
  {}
}


module.exports = Music;
