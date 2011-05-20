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
            for (var k in info) info[k] += parseInt(s.css('padding-'+k), 10);
            $.extend(info, {'width': s.width(), 'height': s.height()});
            for (var k in info) info[k] += 'px';
            $.extend(info, {
                'position': 'absolute',
                'zIndex': s.css('zIndex')?s.css('zIndex')+1:99
            });
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
            delete this.spot;
            delete this.div;
            delete this.ready;
            delete clients[this.id];
        },
        
        reposition: function() {
            if (!this.ready) return;
            this.div.css(this.bbox());
            $('#'+this.movieId)[0].redraw();
        },
        
        receiveEvent: function(eventName) {
            var fkc = this;
            eventName = eventName.toString().toLowerCase();
            switch (eventName) {
                case 'loaded':
                    fkc.ready = true;
                    fkc.reposition();
                    break;
                case 'click':
                    if (fkc.timer) clearTimeout(fkc.timer);
                    fkc.timer = setTimeout(
                            function() {$('#'+fkc.movieId)[0].clear();},
                            30000);
                    if (fkc.textfn) return fkc.textfn(fkc.spot);
                    return fkc.text;
                case 'over':
                    if (fkc.cssEffects) {
                        fkc.spot.addClass('fkclip_hover');
                        if (fkc.recoverActive)
                            fkc.spot.addClass('fkclip_active');
                    }
                    break;
                case 'out':
                    if (fkc.cssEffects) {
                        fkc.recoverActive = false;
                        if (fkc.spot.hasClass('fkclip_active')) {
                            fkc.spot.removeClass('fkclip_active');
                            fkc.recoverActive = true;
                        }
                        fkc.spot.removeClass('fkclip_hover');
                    }
                    break;
                case 'down':
                    if (fkc.cssEffects) fkc.spot.addClass('fkclip_active');
                    break;
                case 'up':
                    if (fkc.cssEffects) {
                        fkc.spot.removeClass('fkclip_active');
                        fkc.recoverActive = false;
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
