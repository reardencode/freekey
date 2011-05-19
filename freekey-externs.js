var sjcl = {
    "cipher": {
        "aes": function () {}
    },
    "hash": {
        "sha256": function () {},
        "sha1": function () {},
        "md5": function () {}
    },
    "keyexchange": function () {},
    "mode": {
        "ccm": {
            "name": {},
            "encrypt": function () {},
            "decrypt": function () {}
        }
    },
    "misc": {
        "hmac": function () {},
        "pbkdf2": function () {}
    },
    "codec": {
        "utf8String": {
            "fromBits": function () {},
            "toBits": function () {}
        },
        "hex": {
            "fromBits": function () {},
            "toBits": function () {}
        },
        "base64": {
            "fromBits": function () {},
            "toBits": function () {}
        }
    },
    "exception": {
        "corrupt": function () {},
        "invalid": function () {},
        "bug": function () {},
        "notReady": function () {}
    },
    "bitArray": {
        "bitSlice": function () {},
        "extract": function () {},
        "concat": function () {},
        "bitLength": function () {},
        "clamp": function () {},
        "partial": function () {},
        "getPartial": function () {},
        "equal": function () {}
    },
    "random": {
        "randomWords": function () {},
        "setDefaultParanoia": function () {},
        "addEntropy": function () {},
        "isReady": function () {},
        "getProgress": function () {},
        "startCollectors": function () {},
        "stopCollectors": function () {},
        "addEventListener": function () {},
        "removeEventListener": function () {}
    }
}

var jQuery = {
    "fn": {
        "constructor": function () {},
        "init": function () {},
        "selector": {},
        "jquery": {},
        "length": {},
        "size": function () {},
        "toArray": function () {},
        "get": function () {},
        "pushStack": function () {},
        "each": function () {},
        "ready": function () {},
        "eq": function () {},
        "first": function () {},
        "last": function () {},
        "slice": function () {},
        "map": function () {},
        "end": function () {},
        "push": function () {},
        "sort": function () {},
        "splice": function () {},
        "extend": function () {},
        "data": function () {},
        "removeData": function () {},
        "queue": function () {},
        "dequeue": function () {},
        "delay": function () {},
        "clearQueue": function () {},
        "promise": function () {},
        "attr": function () {},
        "removeAttr": function () {},
        "prop": function () {},
        "removeProp": function () {},
        "addClass": function () {},
        "removeClass": function () {},
        "toggleClass": function () {},
        "hasClass": function () {},
        "val": function () {},
        "bind": function () {},
        "one": function () {},
        "unbind": function () {},
        "delegate": function () {},
        "undelegate": function () {},
        "trigger": function () {},
        "triggerHandler": function () {},
        "toggle": function () {},
        "hover": function () {},
        "live": function () {},
        "die": function () {},
        "blur": function () {},
        "focus": function () {},
        "focusin": function () {},
        "focusout": function () {},
        "load": function () {},
        "resize": function () {},
        "scroll": function () {},
        "unload": function () {},
        "click": function () {},
        "dblclick": function () {},
        "mousedown": function () {},
        "mouseup": function () {},
        "mousemove": function () {},
        "mouseover": function () {},
        "mouseout": function () {},
        "mouseenter": function () {},
        "mouseleave": function () {},
        "change": function () {},
        "select": function () {},
        "submit": function () {},
        "keydown": function () {},
        "keypress": function () {},
        "keyup": function () {},
        "error": function () {},
        "find": function () {},
        "has": function () {},
        "not": function () {},
        "filter": function () {},
        "is": function () {},
        "closest": function () {},
        "index": function () {},
        "add": function () {},
        "andSelf": function () {},
        "parent": function () {},
        "parents": function () {},
        "parentsUntil": function () {},
        "next": function () {},
        "prev": function () {},
        "nextAll": function () {},
        "prevAll": function () {},
        "nextUntil": function () {},
        "prevUntil": function () {},
        "siblings": function () {},
        "children": function () {},
        "contents": function () {},
        "text": function () {},
        "wrapAll": function () {},
        "wrapInner": function () {},
        "wrap": function () {},
        "unwrap": function () {},
        "append": function () {},
        "prepend": function () {},
        "before": function () {},
        "after": function () {},
        "remove": function () {},
        "empty": function () {},
        "clone": function () {},
        "html": function () {},
        "replaceWith": function () {},
        "detach": function () {},
        "domManip": function () {},
        "appendTo": function () {},
        "prependTo": function () {},
        "insertBefore": function () {},
        "insertAfter": function () {},
        "replaceAll": function () {},
        "css": function () {},
        "serialize": function () {},
        "serializeArray": function () {},
        "ajaxStart": function () {},
        "ajaxStop": function () {},
        "ajaxComplete": function () {},
        "ajaxError": function () {},
        "ajaxSuccess": function () {},
        "ajaxSend": function () {},
        "show": function () {},
        "hide": function () {},
        "_toggle": function () {},
        "fadeTo": function () {},
        "animate": function () {},
        "stop": function () {},
        "slideDown": function () {},
        "slideUp": function () {},
        "slideToggle": function () {},
        "fadeIn": function () {},
        "fadeOut": function () {},
        "fadeToggle": function () {},
        "offset": function () {},
        "position": function () {},
        "offsetParent": function () {},
        "scrollLeft": function () {},
        "scrollTop": function () {},
        "innerHeight": function () {},
        "outerHeight": function () {},
        "height": function () {},
        "innerWidth": function () {},
        "outerWidth": function () {},
        "width": function () {},
        "fkclip": function() {}
    },
    "extend": function () {},
    "noConflict": function () {},
    "isReady": {},
    "readyWait": {},
    "holdReady": function () {},
    "ready": function () {},
    "bindReady": function () {},
    "isFunction": function () {},
    "isArray": function () {},
    "isWindow": function () {},
    "isNaN": function () {},
    "type": function () {},
    "isPlainObject": function () {},
    "isEmptyObject": function () {},
    "error": function () {},
    "parseJSON": function () {},
    "parseXML": function () {},
    "noop": function () {},
    "globalEval": function () {},
    "nodeName": function () {},
    "each": function () {},
    "trim": function () {},
    "makeArray": function () {},
    "inArray": function () {},
    "merge": function () {},
    "grep": function () {},
    "map": function () {},
    "guid": {},
    "proxy": function () {},
    "access": function () {},
    "now": function () {},
    "uaMatch": function () {},
    "sub": function () {},
    "browser": {
        "webkit": {},
        "version": {},
        "safari": {}
    },
    "_Deferred": function () {},
    "Deferred": function () {},
    "when": function () {},
    "support": {
        "leadingWhitespace": {},
        "tbody": {},
        "htmlSerialize": {},
        "style": {},
        "hrefNormalized": {},
        "opacity": {},
        "cssFloat": {},
        "checkOn": {},
        "optSelected": {},
        "getSetAttribute": {},
        "submitBubbles": {},
        "changeBubbles": {},
        "focusinBubbles": {},
        "deleteExpando": {},
        "noCloneEvent": {},
        "inlineBlockNeedsLayout": {},
        "shrinkWrapBlocks": {},
        "reliableMarginRight": {},
        "noCloneChecked": {},
        "optDisabled": {},
        "radioValue": {},
        "checkClone": {},
        "appendChecked": {},
        "boxModel": {},
        "reliableHiddenOffsets": {},
        "ajax": {},
        "cors": {}
    },
    "boxModel": {},
    "cache": function () {},
    "expando": {},
    "noData": {
        "embed": {},
        "object": {},
        "applet": {}
    },
    "hasData": function () {},
    "data": function () {},
    "removeData": function () {},
    "_data": function () {},
    "acceptData": function () {},
    "_mark": function () {},
    "_unmark": function () {},
    "queue": function () {},
    "dequeue": function () {},
    "valHooks": {
        "option": {
            "get": function () {}
        },
        "select": {
            "get": function () {},
            "set": function () {}
        },
        "radio": {
            "get": function () {},
            "set": function () {}
        },
        "checkbox": {
            "get": function () {},
            "set": function () {}
        }
    },
    "attrFn": {
        "val": {},
        "css": {},
        "html": {},
        "text": {},
        "data": {},
        "width": {},
        "height": {},
        "offset": {},
        "blur": {},
        "focus": {},
        "focusin": {},
        "focusout": {},
        "load": {},
        "resize": {},
        "scroll": {},
        "unload": {},
        "click": {},
        "dblclick": {},
        "mousedown": {},
        "mouseup": {},
        "mousemove": {},
        "mouseover": {},
        "mouseout": {},
        "mouseenter": {},
        "mouseleave": {},
        "change": {},
        "select": {},
        "submit": {},
        "keydown": {},
        "keypress": {},
        "keyup": {},
        "error": {}
    },
    "attrFix": {
        "tabindex": {},
        "readonly": {}
    },
    "attr": function () {},
    "removeAttr": function () {},
    "attrHooks": {
        "type": {
            "set": function () {}
        },
        "tabIndex": {
            "get": function () {}
        }
    },
    "propFix": function () {},
    "prop": function () {},
    "propHooks": function () {},
    "event": {
        "add": function () {},
        "global": function () {},
        "remove": function () {},
        "customEvent": {
            "getData": {},
            "setData": {},
            "changeData": {}
        },
        "trigger": function () {},
        "handle": function () {},
        "props": {
            "0": {},
            "1": {},
            "2": {},
            "3": {},
            "4": {},
            "5": {},
            "6": {},
            "7": {},
            "8": {},
            "9": {},
            "10": {},
            "11": {},
            "12": {},
            "13": {},
            "14": {},
            "15": {},
            "16": {},
            "17": {},
            "18": {},
            "19": {},
            "20": {},
            "21": {},
            "22": {},
            "23": {},
            "24": {},
            "25": {},
            "26": {},
            "27": {},
            "28": {},
            "29": {},
            "30": {},
            "31": {},
            "32": {},
            "33": {},
            "34": {},
            "35": {},
            "36": {}
        },
        "fix": function () {},
        "guid": {},
        "proxy": function () {},
        "special": {
            "ready": {
                "setup": function () {},
                "teardown": function () {}
            },
            "live": {
                "add": function () {},
                "remove": function () {}
            },
            "beforeunload": {
                "setup": function () {},
                "teardown": function () {}
            },
            "mouseenter": {
                "setup": function () {},
                "teardown": function () {}
            },
            "mouseleave": {
                "setup": function () {},
                "teardown": function () {}
            },
            "focusin": {
                "setup": function () {},
                "teardown": function () {}
            },
            "focusout": {
                "setup": function () {},
                "teardown": function () {}
            }
        },
        "triggered": {}
    },
    "removeEvent": function () {},
    "Event": function () {},
    "find": function () {},
    "expr": {
        "order": {
            "0": {},
            "1": {},
            "2": {},
            "3": {}
        },
        "match": {
            "ID": {},
            "CLASS": {},
            "NAME": {},
            "ATTR": {},
            "TAG": {},
            "CHILD": {},
            "POS": {},
            "PSEUDO": {}
        },
        "leftMatch": {
            "ID": {},
            "CLASS": {},
            "NAME": {},
            "ATTR": {},
            "TAG": {},
            "CHILD": {},
            "POS": {},
            "PSEUDO": {}
        },
        "attrMap": {
            "class": {},
            "for": {}
        },
        "attrHandle": {
            "href": function () {},
            "type": function () {}
        },
        "relative": {
            "+": function () {},
            ">": function () {},
            "": function () {},
            "~": function () {}
        },
        "find": {
            "ID": function () {},
            "NAME": function () {},
            "TAG": function () {},
            "CLASS": function () {}
        },
        "preFilter": {
            "CLASS": function () {},
            "ID": function () {},
            "TAG": function () {},
            "CHILD": function () {},
            "ATTR": function () {},
            "PSEUDO": function () {},
            "POS": function () {}
        },
        "filters": {
            "enabled": function () {},
            "disabled": function () {},
            "checked": function () {},
            "selected": function () {},
            "parent": function () {},
            "empty": function () {},
            "has": function () {},
            "header": function () {},
            "text": function () {},
            "radio": function () {},
            "checkbox": function () {},
            "file": function () {},
            "password": function () {},
            "submit": function () {},
            "image": function () {},
            "reset": function () {},
            "button": function () {},
            "input": function () {},
            "focus": function () {},
            "hidden": function () {},
            "visible": function () {},
            "animated": function () {}
        },
        "setFilters": {
            "first": function () {},
            "last": function () {},
            "even": function () {},
            "odd": function () {},
            "lt": function () {},
            "gt": function () {},
            "nth": function () {},
            "eq": function () {}
        },
        "filter": {
            "PSEUDO": function () {},
            "CHILD": function () {},
            "ID": function () {},
            "TAG": function () {},
            "CLASS": function () {},
            "ATTR": function () {},
            "POS": function () {}
        },
        ":": {
            "enabled": function () {},
            "disabled": function () {},
            "checked": function () {},
            "selected": function () {},
            "parent": function () {},
            "empty": function () {},
            "has": function () {},
            "header": function () {},
            "text": function () {},
            "radio": function () {},
            "checkbox": function () {},
            "file": function () {},
            "password": function () {},
            "submit": function () {},
            "image": function () {},
            "reset": function () {},
            "button": function () {},
            "input": function () {},
            "focus": function () {},
            "hidden": function () {},
            "visible": function () {},
            "animated": function () {}
        }
    },
    "unique": function () {},
    "text": function () {},
    "isXMLDoc": function () {},
    "contains": function () {},
    "filter": function () {},
    "dir": function () {},
    "nth": function () {},
    "sibling": function () {},
    "buildFragment": function () {},
    "fragments": function () {},
    "clone": function () {},
    "clean": function () {},
    "cleanData": function () {},
    "cssHooks": {
        "opacity": {
            "get": function () {}
        },
        "height": {
            "get": function () {},
            "set": function () {}
        },
        "width": {
            "get": function () {},
            "set": function () {}
        }
    },
    "cssNumber": {
        "zIndex": {},
        "fontWeight": {},
        "opacity": {},
        "zoom": {},
        "lineHeight": {},
        "widows": {},
        "orphans": {}
    },
    "cssProps": {
        "float": {}
    },
    "style": function () {},
    "css": function () {},
    "swap": function () {},
    "camelCase": function () {},
    "curCSS": function () {},
    "get": function () {},
    "post": function () {},
    "getScript": function () {},
    "getJSON": function () {},
    "ajaxSetup": function () {},
    "ajaxSettings": {
        "url": {},
        "isLocal": {},
        "global": {},
        "type": {},
        "contentType": {},
        "processData": {},
        "async": {},
        "accepts": {
            "xml": {},
            "html": {},
            "text": {},
            "json": {},
            "*": {},
            "script": {}
        },
        "contents": {
            "xml": {},
            "html": {},
            "json": {},
            "script": {}
        },
        "responseFields": {
            "xml": {},
            "text": {}
        },
        "converters": {
            "* text": function () {},
            "text html": {},
            "text json": function () {},
            "text xml": function () {},
            "text script": function () {}
        },
        "jsonp": {},
        "jsonpCallback": function () {},
        "xhr": function () {}
    },
    "ajaxPrefilter": function () {},
    "ajaxTransport": function () {},
    "ajax": function () {},
    "param": function () {},
    "active": {},
    "lastModified": function () {},
    "etag": function () {},
    "speed": function () {},
    "easing": {
        "linear": function () {},
        "swing": function () {}
    },
    "timers": function () {},
    "fx": function () {},
    "offset": {
        "initialize": function () {},
        "bodyOffset": function () {},
        "setOffset": function () {}
    },
    "postmsg": {
        "listen": function() {},
        "send": function() {}
    }
}
var $ = {};
