var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

//  DO I NEED MORGAN?????
var logger = require('morgan');

// Require the two files in the models folder:
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

mongoose.Promise = Promise;

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false;
}));

// Making public static
app.use(express.static('public'));

// Mongoose connection
mongoose.connect('mongodb://localhost/mongoscrape');
var db = mongoose.connection;

db.on('error', function(error) {
    console.log('Mongoose Error: ', error);
});

db.once('open', function() {
    console.log('Mongoose connection successful.');
});

// Routes:

app.get('/scrape', function(req, res) {
    request('http://us.battle.net/heroes/en/blog/', function(error, response, html) {
        var $ = cheerio.load(html);

        $('article h2').each(function(i, element) {
            var result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            var entry = new Article(result);

            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
    });
    res.send('Scrape Complete');
});

