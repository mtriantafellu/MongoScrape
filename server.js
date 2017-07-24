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

//var port = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Making public static
app.use(express.static('public'));

// Connect to mongoose db
// //heroku_52pz09nl:3fvshftcihrkcs2johhcfa2crq@ds115583.mlab.com:15583/heroku_52pz09nl
//

const dbConnectionString = process.env.MONGODB_URI || "mongodb://localhost/secondtestmongoose";

mongoose.connect(dbConnectionString);
var db = mongoose.connection;

db.on('error', function(error) {
    console.log('Mongoose Error: ', error);
});

db.once('open', function() {
    console.log('Mongoose connection successful.');
});

// Routes:
app.get("/scrape", function(req, res) {

    request("http://www.npr.org/", function(error, response, html) {

        var $ = cheerio.load(html);

        $("article h2").each(function(i, element) {

            // Save an empty result object
            var result = {};

            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");


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
    res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
    Article.find({})
        .populate("note")
        .exec(function(error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.json(doc);
            }
        });
});

app.get("/articles/:id", function(req, res) {
    Article.findOne({ "_id": req.params.id })
        .populate("note")
        .exec(function(error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.json(doc);
            }
        });
});


app.post("/articles/:id", function(req, res) {
    var newNote = new Note(req.body);

    newNote.save(function(error, doc) {
        if (error) {
            console.log(error);
        } else {
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.send(doc);
                    }
                });
        }
    });
});

// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
