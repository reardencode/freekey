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
        this.id = nextId++;
        this.movieId = 'fkclip_movie_' + this.id;
        clients[this.id] = this;

        var box = this.bbox();
        
        // create floating DIV above element
        this.div = $('<div></div>').css(box);
        if (this.container) {
            this.container.append(this.div);
        } else {
            $('body').append(this.div);
        }
        
        this.div.html(this.getEmbed());//this.spot.width(), this.spot.height()));
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
                    if (cur[0] == cur.offsetParent()[0]) break;
                    cur = cur.offsetParent();
                } while (cur[0] != this.container[0] && cur[0] != $('body')[0]);
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
        
        getEmbed: function() {//width, height) {
            // return HTML for movie
            var flashvars = 'id=' + this.id + 
                '&handCursor=' + (this.handCursor?1:0);
            var uri = this.moviePath;

            var attrs = {
                "id": this.movieId,
                "align": "middle",
                "width": '100%',//width + 'px',
                "height": '100%'//height + 'px'
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
                $.extend(attrs, {"classid": uri, "codebase": cb});
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
            this.div.css('left', '-2000px').html('').remove();
            this.spot.removeData('fkclip');
            this.spot = null;
            this.div = null;
            delete clients[this.id];
        },
        
        reposition: function() {
            this.div.css(this.bbox());
        },
        
        receiveEvent: function(eventName) {
            eventName = eventName.toString().toLowerCase();
            switch (eventName) {
                case 'click':
                    if (this.textfn) return this.textfn(this.spot);
                    return this.text;
                case 'over':
                    if (this.cssEffects) {
                        this.spot.addClass('fkclip_hover');
                        if (this.recoverActive)
                            this.spot.addClass('fkclip_active');
                    }
                    break;
                case 'out':
                    if (this.cssEffects) {
                        this.recoverActive = false;
                        if (this.spot.hasClass('fkclip_active')) {
                            this.spot.removeClass('fkclip_active');
                            this.recoverActive = true;
                        }
                        this.spot.removeClass('fkclip_hover');
                    }
                    break;
                case 'down':
                    if (this.cssEffects) this.spot.addClass('fkclip_active');
                    break;
                case 'up':
                    if (this.cssEffects) {
                        this.spot.removeClass('fkclip_active');
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
            window['fkclip_dispatch'] = function(id, eventName) {
                /* fkclip.swf touchpoint -- send events to specific clients */
                if (id in clients) return clients[id].receiveEvent(eventName);
            }
            bound = true;
        }
    
        this.each(function() {
            var elem = $(this);
            elem.data('fkclip', new fkclip(elem, options));
        });
    }
})(jQuery);
