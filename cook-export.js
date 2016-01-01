#!/usr/bin/env node

// Copyright (c) 2016 Thomas Pritchard

var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var request = require('request');

var arguments = process.argv.slice(2);
var urls = [];
var json = {};
var output_file = 'output.json';
var completed = 0;

if (arguments.length > 0 && arguments.length < 3) {
    if (arguments.length == 2) {
        output_file = arguments[1];
    }
    try {
        stats = fs.statSync(arguments[0]);

        // Create Interface
        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(__dirname + '/' + arguments[0])
        });

        // Read lines with a worldscookbook.com URL in them
        lineReader.on('line', function (line) {
            if (line.indexOf('www.worldscookbook.com') > -1) {
                urls.push(line.trim());
            }
        });

        // Export the recipes from the URLs discovered
        lineReader.on('close', function() {
            exportRecipes();
        });
    }
    catch (e) {
        console.log('🆘    Couldn\'t load file: ' + arguments[0]);
    }
} else {
	help();
}

function help() {
    console.log('Usage:');
    console.log('  cook-export <url-file> <output-file.json>');
    console.log('  cook-export help');
    console.log('Explanation:');
    console.log('  help                 # Shows a list of commands');
    console.log('  <url-file>           # A file containing a list of URLS separated by linebreaks');
    console.log('  <output-file.json>   # The location to save the recipes in JSON');
}

function exportRecipes() {
    json.created_at = Date.now();
    json.recipes = [];

    async.forEach(urls, function (url, callback){
        getAndParseRecipeAtURL(url, callback);
    }, function(err) {
        if (err) {
            return next(err);
        } else {
            writeJSONToFile(output_file);
        }
    });
}

function getAndParseRecipeAtURL(url, callback) {
    request(url, function(error, response, html) {
        if (!error && response.statusCode == 200) {

            var $ = cheerio.load(html);

            var recipe_json = {};
            recipe_json.url = url;

            // Title
            recipe_json.title = null;
            $('h1').filter(function(){
                recipe_json.title = $(this).text().trim().toTitleCase();
            });

            // Summary
            recipe_json.summary = null;
            $('.summary').filter(function(){
                recipe_json.summary = $(this).children().last().text().trim();
            });

            // User's Name
            recipe_json.author = null;
            $('p.profile-name').filter(function(){
                recipe_json.author = $(this).text().trim().toTitleCase();
            });

            // Ingredients
            recipe_json.ingredients = [];
            $('.ingredients li').each(function(i, element) {
                var ingredient = {};
                ingredient.amount = element.children[0].children[0].data.trim();
                if (ingredient.amount == '') {
                    ingredient.amount = null;
                }
                ingredient.item = element.children[1].data.trim();
                recipe_json.ingredients.push(ingredient);
            });

            // Instructions
            recipe_json.instructions = [];
            $('.method li').each(function(i, element) {
                if (element.children[0] != null) {
                    if (element.children[0].data != ' ') {
                        recipe_json.instructions.push(element.children[0].data.trim());
                    }
                }
            });

            // Preperation Time
            recipe_json.prep_minutes = null;
            $('.data.prep').each(function(i, element) {
                var prep_minutes = 0;
                if (element.children[0].next.children[1].children[0].data.indexOf('h') > -1) {
                    prep_minutes += parseInt(element.children[0].next.children[0].data.trim()) * 60;
                    prep_minutes += parseInt(element.children[0].next.children[2].data.trim());
                } else {
                    prep_minutes += parseInt(element.children[0].next.children[0].data.trim());
                }
                if (prep_minutes > 0) {
                    recipe_json.prep_minutes = prep_minutes;
                }
            });

            // Cook Time
            recipe_json.cook_minutes = null;
            $('.data.cook').each(function(i, element) {
                var cook_minutes = 0;
                if (element.children[0].next.children[1].children[0].data.indexOf('h') > -1) {
                    cook_minutes += parseInt(element.children[0].next.children[0].data.trim()) * 60;
                    cook_minutes += parseInt(element.children[0].next.children[2].data.trim());
                } else {
                    cook_minutes += parseInt(element.children[0].next.children[0].data.trim());
                }
                if (cook_minutes > 0) {
                    recipe_json.cook_minutes = cook_minutes;
                }
            });

            // Serving Size
            recipe_json.serving_size = null;
            $('.count').each(function(i, element) {
                if (i == 0) {
                    recipe_json.serving_size = parseInt(element.children[0].data.trim());
                }
            });

            json.recipes.push(recipe_json);
            completed++;
            callback();
        } else {
            // Error!
            console.log('🆘    Couldn\'t load URL: ' + url);
            console.log('     This URL will be skipped. You can usually re-run and it\'ll work.');
            callback();
        }
    });
}

function writeJSONToFile(outputURL) {
    fs.writeFile(outputURL, JSON.stringify(json, null, 4), function(err){
        console.log('🌮    ' + completed + '/' + urls.length + ' recipes exported to JSON.');
        console.log('     Output File: ' + outputURL);
    });
}

String.prototype.toTitleCase = function() {
  var i, j, str, lowers, uppers;
  str = this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  // Certain minor words should be left lowercase unless
  // they are the first or last words in the string
  lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
  'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
  for (i = 0, j = lowers.length; i < j; i++)
    str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
      function(txt) {
        return txt.toLowerCase();
      });

  // Certain words such as initialisms or acronyms should be left uppercase
  uppers = ['Id', 'Tv'];
  for (i = 0, j = uppers.length; i < j; i++)
    str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
      uppers[i].toUpperCase());

  return str;
}
