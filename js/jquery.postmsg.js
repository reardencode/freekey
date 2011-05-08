(function($) {
    var _state = {bound: false; callbacks: {}, listeners: {}};

    var _receive = function(e) {
        try {
            var msg = JSON.parse(e.data);
        } catch (ex) {
            return;
        }
        if (!msg.type)
            return;
        if (msg.type in _state.callbacks) {
            _state.callbacks[msg.type](msg.data);
            delete _state.callbacks[msg.type];
            return;
        }
        var funcs = _state.listeners[msg.type] || [];
        for (var i=0; i<funcs.length; i++) {
            var f = funcs[i];
            if (e.origin !== f.origin) {
                if (msg.errcb)
                    $.postmsg('send', e.source, msg.errcb, e.origin
                            "postmsg wrong origin: " + f.origin);
                continue;
            }
            try {
                var rv = f.call(msg.data);
                if (msg.okcb)
                    $.postmsg('send', e.source, e.origin, msg.okcb, rv);
            } catch (ex) {
                if (msg.errcb)
                    $.postmsg('send', e.source, e.origin, msg.errcb, ex);
            }
        }
    };

    var _makecb = function(json, fn) {
        var cb = new Date().getTime().toString(36) + ':';
        cb += sjcl.codec.base64.fromBits(sjcl.hash.sha1.hash(json));
        _state.callbacks[cb] = fn;
        return cb;
    };

    var methods = {

        send: function(target, origin, type, data, callbacks) {
            if (!origin || origin === '*')
                throw("Origin is required for security reasons");
            var msg = {data:data, type:type};
            var json = JSON.stringify(msg);
            callbacks = callbacks || {};
            if (callbacks.success)
                msg.okcb = _makecb(json, callbacks.success);
            if (callbacks.error)
                msg.errcb = _makecb(json, callbacks.error);
            if ("postMessage" in target) {
                target.postMessage(json, origin);
            } else {
                throw("No postMessage on target");
            }
        },

        bind: function(type, fn, origin) {
            _state.listeners[type] = _state.listeners[type] || [];
            _state.listeners[type].push({fn:fn, origin:origin});
        },

        unbind: function(type, fn) {
            if (!type) {
                _state.listeners = {}; // Unbind everything
                return;
            }
            if (!fn) {
                delete _state.listeners[type]; // Unbind this type
                return;
            }
            var funcs = _state.listeners[type];
            if (!funcs) return;
            var m = _state.listeners[type] = [];
            for (var i=0; i<funcs.length; i++) {
                if (funcs[i].fn !== fn) {
                    m.push(fns[i]);
                }
            }
        },

        init: function(options) {
            // are we already listening to message events on this w?
            if (_state.bound) return;
            if (window.addEventListener) {
                window.addEventListener("message", _dispatch, false);
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", _dispatch);
            } else {
                throw("Failed to bind postmessage listener");
            }
            _state.bound = true;
        }
    };

    $.fn.postmsg = function( method ) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(
                    this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, method);
        } else {
            $.error('Method ' +  method + ' does not exist on postmsg');
        }    
    };


})(jQuery);
