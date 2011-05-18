/**
 * jQuery plugin to talk to ZeroClipboard.swf
 * Author: Brandon Smith <freedom@reardencode.com>
 * Adapted from ZeroClipboard.js by Joseph Huckaby
 * Connects to ZeroClipboard.swf by Joseph Huckaby
 */


(function($) {
    var clients = {};
    var nextId = 1;

    window['ZeroClipboard'] = {};
    window['ZeroClipboard']['dispatch'] = function(id, eventName, args) {
        /* ZeroClipboard.swf touchpoint -- send events to specific clients */
        if (id in clients) clients[id].receiveEvent(eventName, args);
    }
    
    /**
     * @constructor
     */
    function zeroclip(elem, options) {
        console.log(elem, options);
        $.extend(this, options);

        this.spot = elem;
        this.ready = false;
        this.movie = null;
        this.id = nextId++;
        this.movieId = 'ZeroClipboardMovie_' + this.id;
        clients[this.id] = this;

        // find X/Y position of spot
        var box = this.bbox();
        
        // create floating DIV above element
        this.div = $('<div></div>').css(box);

        $('body').append(this.div);
        
        this.div.append(this.getEmbed(box['width'], box['height']));
    }

    zeroclip.prototype = {
        text: '',
        textfn: null,
        handCursor: true,
        cssEffects: true,
        container: null,
        moviePath: 'ZeroClipboard.swf',
        
        bbox: function() {
            var s = this.spot;
            var info;
            if (this.container) {
                console.log('getting offset from container');
                info = {'top': 0, 'left': 0};
                var cur = s;
                do {
                    info['top'] += cur.position()['top'];
                    info['left'] += cur.position()['left'];
                    cur = cur.offsetParent();
                } while (cur != this.container);
            } else {
                console.log('getting offset from ', s);
                info = s.offset();
            }
            console.log(info);
            info['top'] = info['top'] + 'px';
            info['left'] = info['left'] + 'px';
            info['width'] = s.width() + 'px';
            info['height'] = s.height() + 'px';
            info['position'] = 'absolute';
            info['zIndex'] = s.css('zIndex')?s.css('zIndex')+1:99;
            return info;
        },
        
        getEmbed: function(width, height) {
            // return HTML for movie
            var embed;
            var flashvars = 'id=' + this.id + 
                '&width=' + width + 
                '&height=' + height;
            var uri = this.moviePath;
                
            if (navigator.userAgent.match(/MSIE/)) {
                // IE gets an OBJECT tag
                var cb = location.href.match(/^https/i)?'https://':'http://';
                cb += 'download.macromedia.com';
                cb += '/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0';
                var classid = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
                var flashvars =
                    $('<param name="flashvars"/>').attr('value',flashvars);
                embed = $('<object align="middle"></object>').
                    attr('classid', classid).attr('id', this.movieId).
                    attr('width', width).attr('height', height).
                    attr('codebase', cb).append(movie).append(flashvars).
                    append($('<param name="movie"/>').attr('value', uri));
                    append('<param name="allowFullScreen" value="false" />').
                    append('<param name="allowScriptAccess" value="always" />').
                    append('<param name="loop" value="false" />').
                    append('<param name="menu" value="false" />').
                    append('<param name="quality" value="best" />').
                    append('<param name="bgcolor" value="#ffffff" />').
                    append('<param name="wmode" value="transparent"/>');
            } else {
                // all other browsers get an EMBED tag
                embed = $('<embed></embed>').attr('id', this.movieId).
                    attr('src', uri).attr('loop', 'false').
                    attr('quality', 'best').attr('wmode', 'transparent').
                    attr('bgcolor', '#ffffff').attr('name', this.movieId).
                    attr('width', width).attr('height', height).
                    attr('aligh', 'middle').attr('allowFullScreen', 'false').
                    attr('allowScriptAccess', 'always').attr('menu', 'false').
                    attr('flashvars', flashvars).
                    attr('type', 'application/x-shockwave-flash').
                    attr('pluginspage',
                            "http://www.macromedia.com/go/getflashplayer");
            }
            return embed;
        },
        
        hide: function() {
            // temporarily hide floater offscreen
            if (this.div) {
                this.div.css('left', '-2000px');
            }
        },
        
        show: function() {
            // show ourselves after a call to hide()
            this.reposition();
        },
        
        destroy: function() {
            // destroy control and floater
            if (this.spot && this.div) {
                this.hide();
                this.div.html('').remove();
                this.spot.removeData('zeroclip');
                this.spot = null;
                this.div = null;
                this.ready = false;
            }
        },
        
        reposition: function() {
            if (this.spot && this.div) {
                this.div.css(this.bbox(this.spot));
            }
        },
        
        receiveEvent: function(eventName, args) {
            eventName = eventName.toString().toLowerCase().replace(/^on/, '');
            switch (eventName) {
                case 'load':
                    var zc = this;
                    /* movie claims it is ready, but in IE this isn't always
                       the case...  bug fix: Cannot extend EMBED DOM elements
                       in Firefox, must use traditional function */
                    this.movie = document.getElementById(this.movieId);
                    if (!this.movie) {
                        setTimeout(
                                function(){zc.receiveEvent('load',null);},1);
                        return;
                    }
                    /* firefox on pc needs a "kick" in order to set these in
                       certain cases */
                    if (!this.ready && navigator.userAgent.match(/Firefox/) &&
                            navigator.userAgent.match(/Windows/)) {
                        setTimeout(
                                function(){zc.receiveEvent('load',null);},100);
                        this.ready = true;
                        return;
                    }
                    this.ready = true;
                    this.movie.setText(this.text);
                    this.movie.setHandCursor(this.handCursor);
                    break;
                case 'mouseover':
                    if (this.spot && this.cssEffects) {
                        this.spot.addClass('hover');
                        if (this.recoverActive) this.spot.addClass('active');
                    }
                    if (this.textfn) {
                        this.movie = document.getElementById(this.movieId);
                        this.movie.setText(this.textfn(this.spot));
                    }
                    break;
                case 'mouseout':
                    if (this.spot && this.cssEffects) {
                        this.recoverActive = false;
                        if (this.spot.hasClass('active')) {
                            this.spot.removeClass('active');
                            this.recoverActive = true;
                        }
                        this.spot.removeClass('hover');
                    }
                    break;
                case 'mousedown':
                    if (this.spot && this.cssEffects) {
                        this.spot.addClass('active');
                    }
                    break;
                case 'mouseup':
                    if (this.spot && this.cssEffects) {
                        this.spot.removeClass('active');
                        this.recoverActive = false;
                    }
                    break;
            }
        }
    };

    /**
     * @example $('#name').zeroclip({'textfn':function(client){client.setText($('#name').text());}});
     *          Attach a zeroclip instance to #name and set its text as the
     *          text to be copied before it's clicked
     * @example $(window).resize(function() {$('#name').data('zeroclip').reposition();});
     *          Reposition the clipboard flash on window resize
     *
     * @option container a jQuery element for relative flash movie positioning
     * @option text static text to be copied
     * @option textfn a function taking the jQuery element and returning the
     *                text to be copied
     * @option moviePath String URL/Path for the flash movie
     * @option handCursor boolean whether to use the hand/pointer cursor
     * @option cssEffects boolean whether or not to add 'active' and 'hover'
     *                    css classes in appropriate cases
     */
    $.fn.zeroclip = function(options) {
        this.each(function() {
            var elem = $(this);
            elem.data('zeroclip', new zeroclip(elem, options));
        });
    }
})(jQuery);
