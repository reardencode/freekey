(function($) {
    var _callbacks = {};
    var _listeners = {};
    var _bound = false;

    var _receive = function(e) {
        try {
            var msg = JSON.parse(e.data);
        } catch (ex) {
            return;
        }
        if (!msg.type)
            return;
        if (msg.type in _callbacks) {
            _callbacks[msg.type](msg.data);
            delete _callbacks[msg.type];
            return;
        }
        var funcs = _listeners[msg.type] || [];
        for (var i=0; i<funcs.length; i++) {
            var f = funcs[i];
            if (e.origin !== f.origin) {
                if (msg.errcb)
                    $.postmsg.send(e.source, e.origin, e.errcb,
                            "postmsg wrong origin: " + f.origin);
                continue;
            }
            try {
                var rv = f.call(msg.data);
                if (msg.okcb)
                    $.postmsg.send(e.source, e.origin, msg.okcb, rv);
            } catch (ex) {
                if (msg.errcb)
                    $.postmsg.send(e.source, e.origin, msg.errcb, ex);
            }
        }
    };

    var _init = function() {
        if (_bound) return;
        console.log("Setting up event listener...");
        if (window.addEventListener) {
            window.addEventListener("message", _receive, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", _receive);
        } else {
            $.error("Failed to bind postmessage listener");
        }
        _bound = true;
    }

    var _makecb = function(json, fn) {
        var cb = new Date().getTime().toString(36) + ':';
        cb += sjcl.codec.base64.fromBits(sjcl.hash.sha1.hash(json));
        _callbacks[cb] = fn;
        return cb;
    };

    $.postmsg = {
        send: function(target, origin, type, data, callbacks) {
            if (!origin) $.error("Origin is required for security reasons");
//            if (origin === 'null') origin = '*';
            var msg = {data:data, type:type};
            var base = JSON.stringify(msg);
            callbacks = callbacks || {};
            if (callbacks.success)
                msg.okcb = _makecb(base, callbacks.success);
            if (callbacks.error)
                msg.errcb = _makecb(base, callbacks.error);
            if ("postMessage" in target) {
                target.postMessage(JSON.stringify(msg), origin);
            } else {
                $.error("No postMessage on target");
            }
        },

        listen: function(origin, type, fn) {
            _init();
            console.log("Adding listener");
            _listeners[type] = _listeners[type] || [];
            _listeners[type].push({call:fn, origin:origin});
        },

        cancel: function(type, fn) {
            if (!type) {
                _listeners = {}; // Unbind everything
                return;
            }
            if (!fn) {
                delete _listeners[type]; // Unbind this type
                return;
            }
            var funcs = _listeners[type];
            if (!funcs) return;
            var m = _listeners[type] = [];
            for (var i=0; i<funcs.length; i++) {
                if (funcs[i].fn !== fn) {
                    m.push(fns[i]);
                }
            }
        }
    };
})(jQuery);
