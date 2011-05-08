/**
 The MIT License

 Copyright (c) 2010 Daniel Park (http://metaweb.com, http://postmessage.freebaseapps.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 **/
(function($) {
    var bound = false;

    var data = {};

    var _random = function(len) {
        return ((Math.random()*Math.pow(16,len||8))|0).toString(16);
    };

    var _bind = function() {
        // are we already listening to message events on this w?
        if (!bound) {
            if (window.addEventListener) {
                window.addEventListener("message", _dispatch, false);
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", _dispatch);
            }
            bound = true;
        }
    };

    var _dispatch = function(e) {
        //console.log("$.pm.dispatch", e, this);
        try {
            var msg = JSON.parse(e.data);
        } catch (ex) {
            console.warn("postmessage data invalid json: ", ex);
            return;
        }
        if (!msg.type) {
            console.warn("postmessage message type required");
            return;
        }
        var cbs = data.callbacks || {};
        cb = cbs[msg.type];
        if (cb) {
            cb(msg.data);
        } else {
            var l = data.listeners || {};
            var fns = l[msg.type] || [];
            for (var i=0; i<fns.length; i++) {
                var o = fns[i];
                if (o.origin && e.origin !== o.origin) {
                    console.warn("postmessage message origin mismatch",
                            e.origin, o.origin);
                    if (msg.errback) {
                        // notify post message errback
                        var error = {
                            message: "postmessage origin mismatch",
                            origin: [e.origin, o.origin]
                        };
                        $.postmsg('send', {
                                target:e.source, data:error, type:msg.errback
                        });
                    }
                    continue;
                }
                try {
                    var r = o.fn(msg.data);
                    if (msg.callback) {
                        $.postmsg('send', {
                                target:e.source, data:r, type:msg.callback
                        });
                    }
                } catch (ex) {
                    if (msg.errback) {
                        // notify post message errback
                        $.postmsg('send', {
                                target:e.source, data:ex, type:msg.errback
                        });
                    }
                }
            }
        }
    };

    var _callback = function(fn) {
        var cbs = data.callbacks = data.callbacks || {};
        var r = _random();
        cbs[r] = fn;
        return r;
    };

    var methods = {

        send: function(o) {
            var target = o.target;
            if (!o.target) {
                console.warn("postmessage target window required");
                return;
            }
            if (!o.type) {
                console.warn("postmessage type required");
                return;
            }
            var msg = {data:o.data, type:o.type};
            if (o.success) {
                msg.callback = _callback(o.success);
            }
            if (o.error) {
                msg.errback = _callback(o.error);
            }
            if ("postMessage" in target) {
                _bind();
                target.postMessage(JSON.stringify(msg), o.origin || '*');
            }
        },

        bind: function(type, fn, origin, hash) {
            if ("postMessage" in window) {
                _bind();
            }
            var l = data.listeners = data.listeners || {};;
            var fns = l[type] = l[type] || [];
            fns.push({fn:fn, origin:origin});
        },

        unbind: function(type, fn) {
            var l = data.listeners;
            if (!l) return;
            if (!type) {
                // unbind all listeners of all type
                data.listeners = {};
                return;
            }
            if (!fn) {
                // remove all listeners by type
                delete l[type];
                return;
            }
            // remove specific listener
            var fns = l[type];
            if (!fns) return;
            var m = l[type] = [];
            for (var i=0; i<fns.length; i++) {
                if (fns[i].fn !== fn) {
                    m.push(fns[i]);
                }
            }
        }

    };

    $.fn.postmsg = function( method ) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(
                    this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on postmsg');
        }    
    };

})(jQuery);
