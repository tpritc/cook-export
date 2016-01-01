# Cook Export

Cook Export is a command line tool by [Thomas Pritchard](http://tpritc.com) to export your recipes from the recipe app, [Cook](http://thecookapp.com). My mother uses this app to store all of her recipes, but since it hasn't received updates in a while, we were a little worried about being locked-in. After emailing the team at Cook asking for an official export tool, and receiving no reply, I decided to make my own.

## Installing

You can install this command line tool using the command: `npm install cook-export`.

Alternatively, you can use `git clone https://github.com/tpritc/cook-export.git`, and run `./cook-export.js` instead of `cook-export`.

## Usage

You'll need a file with a list of URLs separated by line-breaks, such as this:

```
http://www.worldscookbook.com/nyzQ9IUYZU
http://www.worldscookbook.com/O4OaNBdr1C
```

Then, on the command line use the format `cook-export <url-file> <output-file.json>`. For example, I typically use `cook-export recipe-urls.txt 20160214-recipe-backup.json`.

If you want help, try `cook-export help`.

## Contribute

If something doesn't look right, or you want to add a feature, it's also pretty easy to contribute.

1. Fork this repo
2. Hack the shit out of it
3. Submit a pull request [here](https://github.com/tpritc/cook-export/pulls)
4. I'll approve it if it's not awful
5. ???
6. Profit
