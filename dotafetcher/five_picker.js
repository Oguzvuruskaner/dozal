const request = require("request");
const heroes = require("./heroes.js");
var fivepicker = function(fiveArray)
{
  var requestString = "http://dotapicker.com/counterpick#!";
  var throwArray = [];
  for (let hero of fiveArray) {

    if( hero != undefined )
    {


      requestString = requestString.concat("/"+hero);
    }
    else
    {
      //Bu array eğer bir sıkıntı olursa dışarı gönderilicek ve dozalı nerelerde sıkıntı olduğu konusunda
      //bilgilendirecek.
      //Eğer array boşsa o zaman hiçbir sıkıntı olmamış demektir.

    }

  }
  if (throwArray == 0)
  {
    return requestString;
  }

};
var parse = function()
{
  return null;
};
module.exports = fivepicker;
