'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;

var cors = require('cors');

var app = express();
var bodyParser = require('body-parser');
const dns = require('dns');

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 

var url= "mongodb://" + process.env.USER + ":" + process.env.PASSWORD + "@ds161312.mlab.com:61312/shorturl";
var urlCount = 0;


/**
*/
app.use(cors());


/** this project needs to parse POST bodies **/

// you should mount the body-parser here


app.use(bodyParser());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

function isUrlValid(testUrl){
  const regex =  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z‌​]{2,6}\b([-a-zA-Z0-9‌​@:%_\+.~#?&=]*)/g;
  return testUrl.match(regex);
}

function urlToDomain(testUrl){
  const res = testUrl.split('://');
  
  return dns.lookup(res[res.length-1], function (err, address, family) {
    return address;
  })
}

app.post('/api/shorturl/new', function (req, res){
  //store input url
  var inputUrl = req.body.url;
  // Connect to the db
  mongo.connect(url, function(err, db) {

    if(!err) {
      //check if valid domain name either with/ without http(s) prefix
      if (isUrlValid(inputUrl) !== null && urlToDomain(inputUrl) !== null){        
        console.log('url is valid');
        var shortUrlDB = db.collection('shortUrls');
        
        var dBLength;
        
        var collectionArray = shortUrlDB.find().toArray(function(err, docs) {
          dBLength = docs.length;
          var docFound;
          if (err) {
        // Reject the Promise with an error
            console.log(err);
          }
      // Resolve (or fulfill) the promise with data
      
        else{
          console.log('database length: ' + dBLength);
       
          var docFound = docs.find(function(element){
            console.log('element.shortUrl.split.. : ' + element.original_url.substring(element.original_url.indexOf('.')+1) + ' inputURl.substring... ' + inputUrl.substring(inputUrl.indexOf('.')+1));
            if (element.original_url.substring(element.original_url.indexOf('.')+1) == inputUrl.substring(inputUrl.indexOf('.')+1)){
              return element;
            }
          });
        
        //add document to collection if website not already present
        console.log('doc found status: ' + docFound);
      if (docFound === undefined){
        console.log('document inserted');
        shortUrlDB.insertOne({original_url:  inputUrl, short_url: dBLength + 1});
        //response
        var sendString = JSON.stringify({original_url:  inputUrl, short_url: dBLength + 1});
        console.log('send string: ' + sendString);
        res.send(sendString);
      }
        else {
          var sendString = JSON.stringify({original_url: docFound.original_url, short_url: docFound.short_url});
          res.send(sendString);
        }
      }
    });
        //db.close();
       
      }
}
    else{
      console.log('url is invalid');
      res.send('Url is invalid.Please submit a working url in the following format: (http(s))://www.example.com');
      db.close();
    }
  });
});

app.get('/api/shorturl/:shorturl', function (req, res){
  var shortUrlReq = req.params.shorturl;
  mongo.connect(url, function(err, db) {
    if (!err){
      var shortUrlDB = db.collection('shortUrls');
          var collectionArray = shortUrlDB.find().toArray(function(err, docs) {
            var dBLength = docs.length;
            if (err){
              console.log(err);
            }
            else{
              console.log('typeof shorturlreq ' + typeof(parseInt(shortUrlReq)));
              var docFound;
              console.log('dBlength ' + dBLength);
              if (parseInt(shortUrlReq) <= dBLength){
                //return shorturl match
                console.log('line 128');
                docFound = docs.find(function(element){
                  console.log('docFound array method');
                  if (element.short_url == shortUrlReq){
                    return element.original_url;
                  }                   
                });
                console.log('docFound: ' + docFound.original_url);
                if (docFound){
                  console.log('waiting on res.redirect');
                  res.redirect(docFound.original_url);
                }
              }
              else{
                res.send('Invalid short url');
              }
            }
          });
        }    
  });
  
});


// your first API endpoint... 
app.post("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});