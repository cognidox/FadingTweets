/*
---
description: Implements a widget to show the latests tweets of a twitter account or a hash tag

license: GNU Affero General Public License v3

authors:
 - Vittal Aithal

requires:
 - core/1.4.0: Core, Class, Element.Event, Element.Style, Fx.Tween, JSON, Request
 - more/1.4.0: Locale, Request.JSONP

provides:
 - FadingTweets

...
*/


// Define the text locales
// Translations taken from videolan
Locale.define('en-GB', 'FadingTweets', {
    pause: 'Pause', play: 'Play', previous: 'Previous', next: 'Next'
});
Locale.define('en-US', 'FadingTweets', {
    pause: 'Pause', play: 'Play', previous: 'Previous', next: 'Next'
});
Locale.define('fr-FR', 'FadingTweets', {
    pause: 'Pause', play: 'Lire', previous: 'Précédent', next:'Suivant'
});
Locale.define('de-DE', 'FadingTweets', {
    pause: 'Pause', play: 'Wiedergabe', previous: 'Vorheriges', next:'Nächstes'
});
Locale.define('es-ES', 'FadingTweets', {
    pause: 'Pausa', play: 'Reproducir', previous: 'Anterior', next:'Siguiente'
});
Locale.define('pt-PT', 'FadingTweets', {
    pause: 'Pausa', play: 'Reproduzir', previous: 'Anterior', next:'Seguinte'
});
Locale.define('pt-BR', 'FadingTweets', {
    pause: 'Pausar', play: 'Reproduzir', previous: 'Anterior', next:'Próximo'
});
Locale.define('zh-CN', 'FadingTweets', {
    pause: '暂停', play: '播放', previous: '上一个', next:'下一个'
});
Locale.define('zh-TW', 'FadingTweets', {
    pause: '暫停', play: '播放', previous: '上一項', next:'下一項'
});
        
var FadingTweets = new Class({
    Implements: [Options],
    options: {
        feed: '',                   // Name of feed of hash tag
        element: 'fading-tweets',   // Which element to use
        count: 10,                  // How many tweets to cycle through
        delay: 10000,               // How many milliseconds to pause each tweet for
        reloadCount: 30,            // How many times to loop through before getting new tweets
        windowName: '_blank',       // Window name to open tweet links in
        iconColor: 'cyan',          // Colour of the twitter logo - cyan, black, orange, light-blue, dark-blue
        showIcon: true,             // Whether to show the twitter logo
        showControls: true,         // Show the pause, previous and next buttons
        controlColor: 'black',      // Colours for the control buttons - light-grey, dark-grey, white or black
        locale: 'en-GB'             // Locale for control button text
    },
    initialize: function(options) {
        // Load up the widget options
        this.setOptions(options);
        
        // Set the control button colours
        if (this.options.controlColor.match(/^\s*white\s*/i)) {
            this.iconOffset = 2;
        } else if (this.options.controlColor.match(/^\s*dark[ -]*gr[ea]y\s*/i)) {
            this.iconOffset = 1;
        } else if (this.options.controlColor.match(/^\s*light[ -]*gr[ea]y\s*/i)) {
            this.iconOffset = 3;
        } else if (this.options.controlColor.match(/^\s*black\s*/i)) {
            this.iconOffset = 0;
        }
        
        // Load the locale
        Locale.use(this.options.locale);
        
        // Add the base elements
        new Element('span', {class:'fading-tweets-feed'}).inject(this.options.element,'top');
        if (this.options.showControls) {
            var _this = this;
            var controls =
                new Element('span', {class:'fading-tweets-controls'})
                    .setStyle('padding-right', '0.5em')
                    .inject(this.options.element,'top');
            new Element('a',
                {title: Locale.get('FadingTweets.next'),html:'&nbsp;',class:'fading-tweets-next-btn'})
                    .addEvent('click', function(){
                        _this.next();
                    })
                    .setStyle('display','inline-block')
                    .setStyle('width',16)
                    .setStyle('height',16)
                    .setStyle('background-image','url(data:image/png;base64,' + this.controlIcons[this.iconOffset][3] + ')')
                    .setStyle('border',0)
                    .setStyle('text-decoration','none')
                    .setStyle('cursor','pointer')
                    .inject(controls,'top');
            new Element('a',
                {title: Locale.get('FadingTweets.previous'),html:'&nbsp;',class:'fading-tweets-prev-btn'})
                    .addEvent('click', function(){
                        _this.previous();
                    })
                    .setStyle('display','inline-block')
                    .setStyle('width',16)
                    .setStyle('height',16)
                    .setStyle('background-image','url(data:image/png;base64,' + this.controlIcons[this.iconOffset][2] + ')')
                    .setStyle('border',0)
                    .setStyle('text-decoration','none')
                    .setStyle('cursor','pointer')
                    .inject(controls,'top');
            new Element('a',
                {title: Locale.get('FadingTweets.pause'),html:'&nbsp;',class:'fading-tweets-pause-btn'})
                    .addEvent('click', function(){
                        _this.togglePause();
                    })
                    .setStyle('display','inline-block')
                    .setStyle('width',16)
                    .setStyle('height',16)
                    .setStyle('background-image','url(data:image/png;base64,' + this.controlIcons[this.iconOffset][0] + ')')
                    .setStyle('border',0)
                    .setStyle('text-decoration','none')
                    .setStyle('cursor','pointer')
                    .inject(controls,'top');
        }
        if (this.options.showIcon) {
            logoIndex = 2;
            if (this.options.iconColor.match(/^\s*black\s*$/i)) {
                logoIndex = 1;
            } else if (this.options.iconColor.match(/^\s*cyan\s*$/i)) {
                logoIndex = 2;
            } else if (this.options.iconColor.match(/^\s*light[\- ]*blue\s*$/i)) {
                logoIndex = 3;
            } else if (this.options.iconColor.match(/^\s*dark[\- ]*blue\s*$/i)) {
                logoIndex = 4;
            } else if (this.options.iconColor.match(/^\s*orange\s*$/i)) {
                logoIndex = 5;
            }
            var link = 'http://twitter.com/#!/' + this.options.feed;
            if (this.options.feed.indexOf('#') == 0) {
                link = 'http://twitter.com/#!/search/' + escape(this.options.feed);
            }
            new Element('a',
                    {   class: 'fading-tweets-logo',
                        target: this.options.windowName,
                        href: link})
                .set('html','&nbsp;')
                .setStyle('width','16px').setStyle('height','16px')
                .setStyle('display','inline-block')
                .setStyle('border',0).setStyle('border',0)
                .setStyle('text-decoration','none')
                .setStyle('background-image','url(data:image/png;base64,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)')
                .setStyle('background-repeat','none')
                .setStyle('background-position', '-' + (16 * (logoIndex - 1)) + 'px 0px')
                .setStyle('margin-right','0.5em')
                .inject(this.options.element,'top');
        }
        $(this.options.element).addClass('fading-tweets');
        
        // Set up the fader transiion
        this.fadeFx =
            new Fx.Tween( $(this.options.element).getElement('span.fading-tweets-feed'),
                          { property:'opacity', duration:'long', });
        this.initTweets();
    },
    initTweets: function () {
        // Load the tweets from twitter
        this.tweetText = [];
        var _this = this;
        var url = 'http://twitter.com/';
        if (this.options.feed.indexOf('#') == 0) {
            url += 'search.json?show_user=true&q='+escape(this.options.feed);
        } else {
            url += 'status/user_timeline/'+this.options.feed+'.json';
        }
        var tweetJSON = new Request.JSONP({
            url: url,
            data: { count: this.options.count },
            onComplete: 
                function(data) {
                    _this.loadTweets(data);
                }
            }).send();
    },
    showTweet: function() {
        this.loadCount += 1;
        if (this.options.reloadCount > 0 && this.loadCount > this.options.reloadCount) {
            // Get brand new tweets
            this.loadCount = 0;
            this.initTweets();
        } else {
            var text = this.tweetText.shift();
            if (text) {
                this.tweetText.push(text);
                text = this.formatTweet(text);
                var _this = this;
                this.fadeFx.removeEvents('complete');
                this.fadeFx.addEvent('complete',
                    function(){
                        $(_this.options.element).getElement('span.fading-tweets-feed').set('html', text);
                        _this.fadeFx.removeEvents('complete');
                        if (_this.options.count > 1) {
                            _this.fadeFx.addEvent('complete', 
                                function(){
                                    _this.timer = setTimeout(function(){_this.showTweet();}, _this.options.delay);
                                });
                        } else if (_this.options.reloadCount > 0) {
                           _this.timer = setTimeout(function(){_this.loadCount=0;_this.showTweet();}, _this.options.delay * _this.options.reloadCount);
                        }
                        _this.fadeFx.start(0, 1);
                    });
                this.fadeFx.start(1, 0);
            }
        }
    },
    loadTweets: function(tweets) {
        var list = tweets;
        if (list.results) {
            list = list.results;
        }
        for (var t = 0; t < list.length; t++) {
            this.tweetText.push(list[t].text);
        }
        this.showTweet();
    },
    formatTweet: function(text)  {
        text = text
            .replace(/</, '&lt;')
            .replace(/>/, '&gt;')
            .replace(/"/, '&quot;')
            .replace(/http:\/\/[^ ]+/g, '<a href="$&" target="' + this.options.windowName + '">$&</a>')
            .replace(/\@([a-zA-Z0-9_]+)/g, '<a href="http://twitter.com/#!/$1" target="' + this.options.windowName + '">$&</a>')
            .replace(/#([a-zA-Z0-9]+)/g, '<a href="http://twitter.com/#!/search/%23$1" target="' + this.options.windowName + '">$&</a>');
            return text;
    },
    next: function(){
        // move to the next tweet
        // pause the feed if it's not already paused
        if (!this.paused) {
            this.togglePause();
        }
        // Take the first item from the tweet list and put it at the end
        if (this.tweetText.length) {
            this.tweetText.push(this.tweetText.shift());
            var text = this.formatTweet(this.tweetText[this.tweetText.length - 1]);
            $(this.options.element).getElement('span.fading-tweets-feed').set('html', text);
        }
    },
    previous: function(){
        // move to the previous tweet
        // pause the feed if it's not already paused
        if (!this.paused) {
            this.togglePause();
        }
        // Take the last item from the tweet list and put it at the start
        if (this.tweetText.length) {
            this.tweetText.unshift(this.tweetText.pop());
            var text = this.formatTweet(this.tweetText[this.tweetText.length - 1]);
            $(this.options.element).getElement('span.fading-tweets-feed').set('html', text);
        }
    },
    togglePause: function(){
        if (this.paused) {
            // unpause
            this.paused = false;
            $(this.options.element).getElement('span.fading-tweets-controls').getElement('a.fading-tweets-pause-btn')
                .setStyle('background-image','url(data:image/png;base64,' + this.controlIcons[this.iconOffset][0] + ')')
                .set('title', Locale.get('FadingTweets.pause'));
            this.showTweet();
        } else {
            // pause
            this.paused = true;
            this.fadeFx.cancel();
            // stop any timeout
            if (this.timer) {
                clearTimeout(this.timer);
            }
            // make the text visible
            $(this.options.element).getElement('span.fading-tweets-feed').setStyle('opacity',1);
            // change the pause text
            $(this.options.element).getElement('span.fading-tweets-controls').getElement('a.fading-tweets-pause-btn')
                .setStyle('background-image','url(data:image/png;base64,' + this.controlIcons[this.iconOffset][1] + ')')
                .set('title', Locale.get('FadingTweets.play'));
        }
    },
    controlIcons: [
                ['iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzgOwBShWAAAACRJREFUKM9jYCAAGBkYGBg0/kM4NxghNDKfiZAJowropoByAACXJAQaTlnmfgAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzc0gYBkJQAAAIlJREFUKM9jYCAOaFQTUvBf46FGFDYZRpgCBgYGBoZTDLk3TqEqYELhmTGc1FiqIYfbBAj4ztDH0HHjCzYTIICToZrhtkYybhNgYA1DxI2/TDi89Y4hlyH6xl8GBhYskt8ZpjM03fgI4WAqWMZQeeMRgouq4CBD8Y2zuELyhkYgvqDO1GBmoBEAAG1yJNlp4G1WAAAAAElFTkSuQmCC','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVEAUBLTkQOgAAALlJREFUKM+dkT0OAQEQhT8/EYXSahzAazQiKxEl1d7AARxArXQJlcQBtNtqtYSsRFyAQrKi2EhGJbF2/cR0M99kMu89+KdU0/ITHiiUPbr8C3SY4gHRY5KNYY8NHrCmmTxc0kQm001jFZLYVSCT6aBOnGQA1MMnB2xpBZf4Qg7gdCjv6VLEoVFenMJ0cVX5MpnO6r93YKirTKa5nNgPzx4ywwWOQSXFBwh2tBkR4XzOoq7Vt7gKPyd7B6bAL0Z1yqLTAAAAAElFTkSuQmCC','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzg5eKkEVwAAAL5JREFUKM+dkb8KQWEYxn/+ZDKeszgX4EnZZMANyB2cQVlcgNmtuAJlk+EsVkZSn8UFYCClKH0GOX0cSZ7p6X1+9T69L/wqzVT8Dlid1E3OUzFwIQeM6ZidC6RjV2EJtFip5QKZp9lvvQFp6uQJvYI33V8/N2loIysro+pbhxjJM6ME3GiayO3wiAOGlIAjbRMlF4Q6yMpqoiAZ+hrJyuqsnjvPxm6FD8xpm/XnO/hc6VN7jd0VC5W//yLHf7oDFx0wtb/7+HQAAAAASUVORK5CYII='],
                [ 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4iNLf36AYAAAAqSURBVDjLY2CgEDDCGAEBAf+RJTZs2MCIzMclz0SpC0YNGDVgmBgw8AAAnz4IGr0T/mQAAAAASUVORK5CYII=','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4hHzBmQoUAAAC/SURBVDjL1ZGrCkJBFEWXj+JPmM8X+B0nCjZtwk0msZlMVsGuSXD/gjYFk+WKzWgQBMEkWhSGi1xGsbjaYXPW7JmBX+LuvU93SuFgZksza5rZMU3TbYygkGlwD8Y1kEha5wmKOVkNWLn7xN2r3zQIuQJDYCDpEtsgpAL0gL27t75pkGUG1CXdih/+2glIgIakG0A5cvEKjIC+pHMYxAimQFfS4V2YJ1gAHUmbPPs7we554jzmbllBGxi/Hug/eADG+jvJLAEwLwAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4jBxE8uFEAAAD3SURBVDjLvdM/K4VhHMbxz0GirGfyAs6zGEhHmSl1ltsbMB5lNJtksPAKlDJY/TarwUImokeJF2AS0ylludXTiXOeOnKP3/t3XV39/vBfL6XUSild9fOxmuIubtDu/5sYImziGJ2MerUTpJQ6uK+I77DYX9f4QTiDA3Qz+sQ+diOiN9AgpdTGCVoZvWAjIi5/S9qoiFdxjvGMHrAUER+D+vRdrCzL56IonrCCKTSxUBTFRVmW70MTVJLM4ghrGb1hKyJOaxlUjLaxh+mMzrAZEa+1xhgRh5jHdUbreaz1NzEiHrGMnbxEzVFuYS6ldDvqQU3++ZV+AWzKQcpm7FFZAAAAAElFTkSuQmCC','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4hKxHStjAAAADqSURBVDjLvdM9SkNBFIbhxx9SCVaprKwEa7EQNyBpjq2CIIgbsLEILiGloKWtzWkEIStIsLukyAKsrARBFASbKW5xY25EnOrMy5xvXuaHvx4RMYqIrbbrlxvYLp4i4rxNwFKDwQc6ZfqA08x8WcRgB1Wpe5hERK+1QbHo4AqXWCn4FheZ+TY3oBa0jztsFjTFSWaOWwWUkDWMsF3QFw4yczjrDOrNG7ivNb8Wg+Fcg4g4wjXWC3rEWWY+z7vGLm5wWNA7+pk5aNpotYFN0C31uChPF3kHXXyij72fmmcZVDjOzOq3n6njP8c3NP5BS2iKRboAAAAASUVORK5CYII=' ],
                [ 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4iGmsh5ckAAAApSURBVDjLY2CgEDDCGP////+PIsHIyIjMxyXPRKkLRg0YNWCYGDDwAADg3gga/i5fMgAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4iDJ/1UJgAAABxSURBVDjLzdKhDcJgEIbhJk2qSLoBS5B0D2xtFQkbYLEdo4olsGyAraqqrX1Qv0PdEdJ3gEfcfVX1y3DLAjCjzwClF7oMUJpwzACw4Y5DFCgtGDJA6YE6Aqy4ooncYET71y88cYrs4I1zdImXr9fddR9t6EAOsDe/aAAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4iJkROmU4AAACfSURBVDjLvdO9CcJQFIZhQUiVNlUGsEprZWvlBhnAAWxtXcIlrARnsA0IVg6QKiAIAeGxSfBilRvFr3/fczg/k8m/ghnOY+E17hALZjh6p42BV6gDuEIxBEyxD8AndkiGwHNcA/iGxdCWl121PheksUMr0QSSE/JYSd6BfRqUY3a/wSMQHZCNur5AUo/pZIot2uhL/BAVqL59qOTnX/oCu7Xtl1v6HG0AAAAASUVORK5CYII=','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9wEFQ4hOJVs9+4AAACaSURBVDjLvdOxCcJAGIbhgJAqbaoMYJXWytbKDTKAA9jauoRLWAmZwTYgWDlAKkEQhMBjE/HKXCJ+/fvAwX9J8uvhjPkUAB7YjAVevjshjwVKNAHSYh2LpNijC6ADslhoiVuAXLGIRTJcAqTDamhcoA7iO6qhcdUHn9UohoQ5jkH4xDbmzW0Qx19lH76ww2zMJTYop/yFNPnn3oKE7ZcehYJoAAAAAElFTkSuQmCC'],
                ['iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzIBqkRUQwAAACRJREFUKM9jYCAAGBkYGBjq/kM4TYwQGpnPRMiEUQV0U0A5AACchAQaoQYbZAAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzEOEdYaEQAAAJZJREFUKM9jYCAO1FXjkmGGUPaH7JPsXx28jKmAEWrCfwYGBgaGUwy5TadQFTCh8MwYTtYtrZPDbQIEfGfoY+ho+oLNBAjgZKhmuF2XjNsEGFjDENH0lwmH794x5DJEN/1lYGDBIvmdYTpDU9NHCAdTwTKGyqZHCC6qgoMMxU1nUdUjFNxkqGxaj2kfTEEWw6ymvww0AQAEECg7VrLP+gAAAABJRU5ErkJggg==','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzIcyUI4mgAAAMtJREFUKM+d0TFLQnEUBfCfKVLQ+iY/gJNDEQYtLgXCm/oCjQqNzfEf/jS01CcIgobWxtYEF6WpMBAkP0BT1PRAcHpR9qzoTvfeczicew//qVAPg7xfKYA77jXzqbIAJi6lyAoVQmokxaOtfFf6ANed6WDmVIzZAiE0Xalj6iD2P6uWIOy5VcaT7fj+1VUZes+tiV2rEputu97bNwUINRfaeHUYrwsIEI6cWMONbnwpODOe2zDEvtGST8axHccyyc9ZNMLDb3FV/5zsHDRjLR55U4djAAAAAElFTkSuQmCC','iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAXNSR0IArs4c6QAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH3AQVDzMFtDKhGwAAAMhJREFUKM+dkS0LwmAUhR8/WBJMK5pMwrIYVFiWJeuEgSD+ivGG9wcYBYPFahaEFRc3bGNhP8CiySQOBIM65xwi3nS499xz7gf8GsITzbx8MUFtdmLySSgkChcUYM1IHvMVWgSAQSiMNKH0BO5BX1CkSwVTr+lbN85YPIx6LGkAEZb0cwggKnhowJW+dNIz3Mt1VmjACUs6HwrCZEYV2DCW++yaKnMGwBlbTl9N5QSFqICPJaP8O6jE2HTey2mFgKEMvj1L4b+4AaCJLqYyTlM2AAAAAElFTkSuQmCC']
            ],
    paused: false,
    timer: null,
    loadCount: 0,
    iconOffset: 0,
    fadeFx: null,
    tweetText: []
});

