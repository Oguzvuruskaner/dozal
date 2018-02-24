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
    this.playing = null; // Belki kullanılacak geçişlerde.
    this.dispatcher = null;
    this.connection = null;
    this.queue = new Queue();
    this.url = null; //Yeniden başlatılacağı zaman gerekli
    this.eventEmitter.on('end',this.endEventHandler);
    this.eventEmitter.on('queueEnd',this.queueEventHandler);
  }
  endEventHandler(music)
  {
    Music.playMusic(music,music.url);
  }
  queueEventHandler(music)
  {
    Music.playMusic(music,music.queue.dequeue());
  }
  /*

  @params {string}
  @returns {number}
  */
  static seekTime(url){
    if(url == 0 || url == undefined || url == NaN)
    {
      return 0;
    }
    else if(url.includes('t='))
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
    Satır azaltmak için yazılmış bir fonskiyon
  */
  static playMusic(music,url)
  {
    music.getStream(url).then((stream) => {
      music.dispatcher = music.connection.playStream(stream,{seek : Music.seekTime(music.url),volume:1});
      music.playing = stream
      music.dispatcher.on('end',() => {
        if(!music.queue.isEmpty())
        {
          music.eventEmitter.emit('queueEnd',music);
        }
        else {
          music.eventEmitter.emit('end',music);
        }
      });
    }).catch((searchString) => {
      music.findQuery(searchString).then((arr) => {
        var chosenOne = Music.getRandom(arr).link;
        console.log(chosenOne);
        music.getStream(chosenOne).then((stream)=>{
          music.dispatcher = music.connection.playStream(stream,{seek:Music.seekTime(music.url),volume:1});
          music.playing = stream;
          music.dispatcher.on('end',() => {
            if(!music.queue.isEmpty())
            {
              music.eventEmitter.emit('queueEnd',music);
            }
            else {
              music.eventEmitter.emit('end',music);
            }
          });
        }).catch(console.err);
      }).catch(console.err);

    });
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
          reject(url);
        }
      });
  }

  /**

  *@param{string:url}*
  *@returns{string:youtubesearchQuery}
  */
  static searchQuery(url)
  {
    var length = url.length;
    for(var index = 0;index < length;index++ )
    {
      switch(url[index])
      {
        case(" "):
          url = url.slice(0,index) + "+" + url.slice(index+1);
          break;
        case("+"):
          url = url.slice(0,index) + "%2B" + url.slice(index+1);
          break;
        case("%"):
          url = url.slice(0,index) + "%25" + url.slice(index+1);
          break;
        default:
          continue;

      }
    }
    return url;
  }
  /*

    Diziden rasgele fonskiyon seçen fonksiyon

  */
  static getRandom(arr)
  {
    return arr[Math.floor(Math.random()*(arr.length))];
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

      }).catch((url) => {
        this.getQuery()
      });
    }else {
      var voiceChannel = msg.member.voiceChannel;
      if(!voiceChannel)
      {
        msg.channel.send("Kanala gir önce  amına koyduğum @"+msg.author.username);
        return ;
      }


      voiceChannel.join().then(  (connection) => {
        this.connection = connection;
        Music.playMusic(this,url);
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
  /*




  @params{searchString}
  @returns{list of elements}



  */
  findQuery(searchString)
  {
    return new Promise((resolve,reject)=>{
      var c = [];
      var url = Music.getQuery() + Music.searchQuery(searchString);
      request(url,(err,res,body)=>{
          var $ = cheerio.load(body);
          $('.yt-uix-sessionlink.spf-link').each((index,element)=>{
            let href = element.attribs.href;

            if(href.includes('watch?v='))
            {
              c[c.length] = {link:Music.getYoutubeLink()+href};

            }
          });
      });

      if(c != 0)
      {
        
        resolve(c);
        console.log(c);
      }else {
        reject(c);
      }
    });
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
          reject(url);
        }
        else
        {
          resolve(c);
        }
      });


    });
  }

  playList(url)
  {}
  exit(bot,msg)
  {

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
    /*

    Dozal kanalda değil.


    */
    else if(this.connection == null)
    {
      msg.channel.send("Kanalda bile değilim aqu @"+msg.author.username);

    }
    /*

    Dozal bir kanalda ama yazan elemanınn kanalında değil.


    */
    else if (this.connection.channel != voiceChannel) {
        msg.channel.send("Kanalıma gel öyle söyle.Senin kanalın " + voiceChannel.name + " benimkisi ise " + this.connection.channel.name + " @" + msg.author.username);
    }
    else {
      msg.channel.send('Çıkıyorum agam :tired_face::tired_face::tired_face:');
      this.playing = null; // Belki kullanılacak geçişlerde.
      this.dispatcher = null;
      this.connection = null;
      this.queue = new Queue();
      this.url = null; //Yeniden başlatılacağı zaman gerekli
      this.connection.channel.leave();
    }
  }



  next(msg)
  {
    if(this.dispatcher)
    {
      this.dispatcher.end();
    }
  }
  res(msg)
  {
    if(this.dispatcher)
    {
      this.queue.enqueue(this.url);
      while(!this.queue.peek() != this.url)
      {
        this.queue.enqueue(this.queue.dequeue());
      }
      this.dispatcher.end();
    }
  }
  neverEnd()
  {}
}


module.exports = Music;
