/**
 * jQuery plugin to talk to a clipboard
 * Author: Brandon Smith <freedom@reardencode.com>
 * Adapted from ZeroClipboard by Joseph Huckaby
 */


(function($) {
    var clients = {};
    var nextId = 1;
    var bound = false;
    
    /**
     * @constructor
     */
    function fkclip(elem, options) {
        $.extend(this, options);

        this.spot = elem;
        this.ready = false;
        this.movie = null;
        this.id = nextId++;
        this.movieId = 'fkclip_movie_' + this.id;
        clients[this.id] = this;

        // find X/Y position of spot
        var box = this.bbox();
        
        // create floating DIV above element
        this.div = $('<div></div>').css(box);

        if (this.container) {
            this.container.append(this.div);
        } else {
            $('body').append(this.div);
        }
        
        this.div.html(this.getEmbed(this.spot.width(), this.spot.height()));
    }

    fkclip.prototype = {
        text: '',
        textfn: null,
        handCursor: true,
        cssEffects: true,
        container: null,
        moviePath: 'fkclip.swf',
        
        bbox: function() {
            var s = this.spot;
            var info;
            if (this.container) {
                info = {'top': 0, 'left': 0};
                var cur = s;
                do {
                    info['top'] += cur.position()['top'];
                    info['left'] += cur.position()['left'];
                    cur = cur.offsetParent();
                } while (cur[0] && cur[0] != this.container[0]);
            } else {
                info = s.offset();
            }
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
            var flashvars = 'id=' + this.id + 
                '&width=' + width + 
                '&height=' + height;
            var uri = this.moviePath;

            var attrs = {
                "id": this.movieId,
                "align": "middle",
                "width": width + 'px',
                "height": height + 'px'
            };

            var params = {
                "flashvars": flashvars,
                "allowFullScreen": "false",
                "allowScriptAccess": "always",
                "loop": "false",
                "menu": "false",
                "quality": "best",
                "bgcolor": "#ffffff",
                "wmode": "transparent"
            };
                
            var embed;
            if (navigator.userAgent.match(/MSIE/)) {
                // IE gets an OBJECT tag
                var cb = location.href.match(/^https/i)?'https://':'http://';
                cb += 'download.macromedia.com';
                cb += '/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0';
                var classid = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
                $.extend(attrs, {"classid": classid, "codebase": cb});
                $.extend(params, {"movie": uri});
                embed = $('<object></object>');
            } else {
                // all other browsers get an EMBED tag
                var embed_attrs = {
                    'src': uri,
                    'name': this.movieId,
                    'type': 'application/x-shockwave-flash',
                    'pluginspage': "http://www.macromedia.com/go/getflashplayer"
                };
                $.extend(attrs, params, embed_attrs);
                params = {};
                embed = $('<embed></embed>');
            }
            embed.attr(attrs);
            var p = '<param></param>';
            for (var k in params)
                embed.append($(p).attr({'name': k, 'value': params[k]}));
            return embed;
        },
        
        destroy: function() {
            // destroy control and floater
            if (this.spot && this.div) {
                this.div.css('left', '-2000px');
                this.div.html('').remove();
                this.spot.removeData('fkclip');
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
            console.log(eventName, args);
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
     * @example $('#name').fkclip({'textfn':function(client){client.setText($('#name').text());}});
     *          Attach a fkclip instance to #name and set its text as the
     *          text to be copied before it's clicked
     * @example $(window).resize(function() {$('#name').data('fkclip').reposition();});
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
    $.fn.fkclip = function(options) {
        if (!bound) {
            window['fkclip'] = {};
            window['fkclip']['dispatch'] = function(id, eventName, args) {
                /* ZeroClipboard.swf touchpoint -- send events to specific clients */
                if (id in clients) clients[id].receiveEvent(eventName, args);
            }
            bound = true;
        }
    
        this.each(function() {
            var elem = $(this);
            elem.data('fkclip', new fkclip(elem, options));
        });
    }
})(jQuery);
