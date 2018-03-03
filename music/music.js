const youtube = require('ytdl-core');
const cheerio = require('cheerio');
const request = require('request');
const events = require('events');
const fs = require('fs');
const google = require('../googleapis');
const googleAuth = require('../google-auth-library');
class Music
const Queue = require('queue-fifo');
{
  static getYoutubeLink(){
    return 'https://www.youtube.com';
  }

  constructor()
  {
    this.eventEmitter = new events.EventEmitter();
    this.playing = null; // Belki kullanılacak geçişlerde.
    this.dispatcher = null;
    this.connection = null;
    this.queue = new Queue();
    this.eventEmitter.on('end',this.endEventHandler );
    this.history = null; //Geçmiş özelliği ekleniek.
    this.msgChannel = null;
    this.loop = false;
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


  endEventHandler(music)
  {
    setTimeout(() => {
      track.dispatcher = null;
    }, 100);
    if(this.queue.isEmpty())
    {
      var chosenOne = Music.getRandom(this.getNext(this.playing)).link;
      music.play(url);
    }
    else {
      //Döngü varsa sıradaki bütün şarkılar çalınıp sıranın en arkasına atılacak.
      if(!loop)
      {
        var nextUrl = this.queue.dequeue();
        this.play(next);
      }
      else {
        var nextUrl = this.queue.dequeue();
        this.play(nextUrl);
        this.queue.enqueue(nextUrl);
      }
    }
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
  /*
  *@param{string:url}
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
    this.msgChannel = msg.channel;
    if(!this.connection)
    {
      var voiceChannel = msg.member.voiceChannel;
      if(!voiceChannel)
      {
        this.msgChannel.send("Kanala gir önce @"+msg.author.username);
        return;
      }
      voiceChannel.join().then((connection) => {
        this.connection = connection;
      });
      this.play(url);
    }
    else {
      this.queue.enqueue(url);
    }


  }
  /*



    Çaldıran dispatcherı hazırlayan fonskiyon


  */
  play(url)
  {
    //this.msgChannel MESAJ ATILCAK KANALI DÖNDÜRÜYOR.
    this.getStream(url).then((stream) =>
    {
      this.dispatcher = this.connection.playStream(stream,{seek:Music.seekTime(url),volume:1});
      this.playing = url;
      this.dispatcher.on('end',()=>{
        this.eventEmitter.emit('end',this);
      });
    }).catch((searchString) =>{
      this.findQuery(searchString).then((arr)=>{

        var chosenOne = Music.getRandom(arr).link;
        this.getStream(chosenOne).then((stream)=>{
          this.dispatcher = this.connection.playStream(stream,{seek:Music.seekTime(url),volume:1});
          this.playing = url;
          this.dispatcher.on('end',()=>{
            this.eventEmitter.emit('end',this);
          });
        });
      });
    });
  }
/*
  @params {string}
  @return {Array{string/url,string/video name}}
*/


  /*
  @params{searchString}
  @returns{list of elements}
  Youtube aramasından döndürür.
  */
  
  /*



  Sonraki videoları bulup döndürür.


  */
  getNext(url)
  {
    return new Promise( (resolve,reject) => {
      var c = [];
        request(url,function(err,res,body){

          var $ = cheerio.load(body);
          $('.content-wrapper a').each(function(index,element){
            c[index] = {link:'https://www.youtube.com'+element.attribs.href,name:element.attribs.title};
          });
        if(c == 0){
          reject(url);
        }else{
          resolve(c);
        }
      });
    });
  }



}


module.exports = Music;
