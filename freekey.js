/* This helps compression without combining compilation with sjcl */
var chars = {
    punctuation: '`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789'
}
var fksjcl = {
    sha1: sjcl.hash.sha1,
    hmac: sjcl.misc.hmac,
    base64: {
        toBits: sjcl.codec.base64.toBits,
        fromBits: sjcl.codec.base64.fromBits
    },
    hex: {
        toBits: sjcl.codec.hex.toBits,
        fromBits: sjcl.codec.hex.fromBits
    },
    utf8String: {
        toBits: sjcl.codec.utf8String.toBits,
        fromBits: sjcl.codec.utf8String.fromBits
    },
    ccm: {
        decrypt: sjcl.mode.ccm.decrypt,
        encrypt: sjcl.mode.ccm.encrypt
    },
    aes: sjcl.cipher.aes,
    random: sjcl.random
}
function freekey_generate(length, charset, req) {
    var out = '';
    var tmp = 0;
    var bag = [];
    var special = {};
    for (var i=0; i<length; i++) bag[i] = i;
    for (var k in req) {
        if (tmp < bag.length)
            tmp = sjcl.random.randomWords(1,0)[0] & 0x7fffffff;
        special[bag.splice(tmp % bag.length, 1)[0]] = k;
        tmp = (tmp / (bag.length+1))|0;
    }
    for (var i=0; i<length; i++) {
        var cs = charset;
        if (i in special) cs = req[special[i]];
        if (tmp < cs.length)
            tmp = sjcl.random.randomWords(1,0)[0] & 0x7fffffff;
        out += cs[tmp % cs.length];
        tmp = (tmp / (cs.length+1))|0;
    }
    return out;
}
function freekey_ciph(pass, salt) {
    return new fksjcl.aes(sjcl.misc.pbkdf2(pass, salt, 1000, 256));
}
function freekey_decrypt(pass, o, n, out) {
    for (var k in o)
        if (typeof o[k] === 'string') o[k] = fksjcl.base64.toBits(o[k]);
    var ciph = freekey_ciph(pass, o['salt']);
    var pt = fksjcl.ccm.decrypt(ciph, o[n], o['iv']);
    var ret = JSON.parse(fksjcl.utf8String.fromBits(pt));
    if (out) {
        out.ciph = ciph;
        out.salt = o['salt'];
    }
    return ret;
}
function freekey_encrypt(ciph, salt, data, n) {
    var out = {
        'salt': salt,
        'iv': fksjcl.random.randomWords(4,0)
    };
    var pt = fksjcl.utf8String.toBits(JSON.stringify(data));
    out[n] = fksjcl.ccm.encrypt(ciph, pt, out['iv']);
    for (var k in out) out[k] = fksjcl.base64.fromBits(out[k]);
    return out;
}
function freekey_error(message) {
    if (arguments.length > 1) {
        console.log(arguments[0]);
        message = arguments[1] + ': ' + arguments[2];
    }
    if (message) {
        $('#error').append($('<div></div>').text(message)).slideDown();
    } else {
        $('#error').slideUp(400, function(){$(this).empty();});
    }
}
function freekey_status(message) {
    if (message) {
        $('#status').text(message).fadeIn();
    } else {
        $('#status').fadeOut(400, function(){$(this).empty();});
    }
}
function freekey_status_done(message) {
    $('#status').text(message).fadeIn().
        delay(2000).fadeOut(400, function(){$(this).empty();});
}
function freekey_unload() {
    return "Are you sure you want to leave?  You will need to" +
        " reenter your password to continue using FreeKey.";
};
function freekey_start(data) {
    $(document['add_form']).submit(function(e) {
        e.preventDefault();

        $(this).find('.error').remove();
        var errors = $();

        var identifier = $('#identifier').val();
        if (identifier.length == 0) errors = errors.add($('#identifier'));

        var username = $('#username').val();
        if (username.length == 0) errors = errors.add($('#username'));

        var password;
        var type = $('input:radio[name="pwtype"]:checked').val();
        if (type == 'manual_password') {
            password = $('#manpass').val();
            if (password.length == 0) errors = errors.add($('#manpass'));
        } else {
            password = $('#password').text();
            if (password.length == 0) errors = errors.add($('#password'));
        }

        if (errors.length > 0) {
            errors.each(function() {
                $(this).after('<span class="error">Required</span>');
            });
            return;
        }

        $('#identifier, #username, #manpass').val('');
        $('#password').text('');
        window.freekey.pack.add(identifier, username, password);
    });
    $('#unlock_button').click(function() {
        if (confirm("You sure you want to force unlock?"))
            window.freekey.bucket.delPolicy();
    });
    $('#sync_button').click(function() {
        window.freekey.sync();
    });
    $('#password_type input').click(function() {
        $('div.password_type').hide();
        $('#'+$(this).attr('value')).show();
    }).first().click();
    var puncdiv = $('#pwpunc').empty();
    for (var i=0; i<chars.punctuation.length; i++) {
        var c = chars.punctuation[i];
        $('<span class="rt checked"></span>').text(c).appendTo(puncdiv);
    }
    $('<span>All</span>').appendTo(puncdiv).click(function() {
        $('#pwpunc span.rt').addClass('checked').removeClass('unchecked');
    });
    puncdiv.append(' | ');
    $('<span>None</span>').appendTo(puncdiv).click(function() {
        $('#pwpunc span.rt').addClass('unchecked').removeClass('checked');
    });
    $('#random_password').find('span.rt').click(function() {
        var tl = $(this);
        if (tl.hasClass('checked')) {
            tl.removeClass('checked');
            tl.addClass('unchecked');
        } else {
            tl.removeClass('unchecked');
            tl.addClass('checked');
        }
    });
    $('#pwlength').keydown(function(e) {
        // Allow backspace, delete and numbers
        if (e.keyCode != 46 && e.keyCode != 8 &&
            (e.keyCode < 48 || e.keyCode > 57 ))
            e.preventDefault(); 
    });
    var pwtimer;
    $('#generate').click(function() {
        var length = $('#pwlength').val();
        var punc = $('#pwpunc span.checked').text(); 
        var charset = punc;
        if ($('#pwcharup').hasClass('checked')) charset += chars.upper;
        if ($('#pwcharlow').hasClass('checked')) charset += chars.lower;
        if ($('#pwchardig').hasClass('checked')) charset += chars.digits;
        var req = {};
        if ($('#pwrequp').hasClass('checked')) req.upper = chars.upper;
        if ($('#pwreqlow').hasClass('checked')) req.lower = chars.lower;
        if ($('#pwreqdig').hasClass('checked')) req.digits = chars.digits;
        if ($('#pwreqpunc').hasClass('checked')) req.punctuation = punc;
        if (pwtimer) clearTimeout(pwtimer);
        $('#password').text(freekey_generate(length, charset, req));
        pwtimer = setTimeout(function() { $('#password').empty(); }, 30000);
    });

    freekey_status("Loading...");
    var pass = data[0];
    var b = data[1];
    var bucket = new S3Bucket(b.bucket, b.access_key, b.secret_key);
    window.freekey = new FK(pass, bucket);
}

/**
 * @constructor
 */
function FKPack(pass, pack, version) {
    if (version === undefined) {
        this.ver = 0;
    } else {
        this.ver = version;
    }
    if (pack === undefined) {
        this.packformat = 1;
        this.salt = fksjcl.random.randomWords(2, 0);
        this.ciph = freekey_ciph(pass, salt);
        this.pwdb = {};
    } else {
        this.packformat = pack['packformat'];
        delete pack['packformat'];
        this.pwdb = freekey_decrypt(pass, pack, 'contents', this);
    }
    this.modified = false;
}

FKPack.prototype = {
    string_crypt: function() {
        var out = freekey_encrypt(
                this.ciph, this.salt, this.pwdb, 'contents');
        out['packformat'] = this.packformat;
        return out;
    },
    _make_entry: function(k) {
        var fkp = this;
        var outer = $('<div></div>');
        var del = '<span class="del">delete</span>';
        var key = '<span class="key"></span>';

        var kd = JSON.parse(k);
        kd = kd[1] + '@' + kd[0];
        var id_div = $('<div class="identifier"></div>');
        id_div.appendTo(outer).text(kd);
        var id_key = $(key).appendTo(id_div).text(k);
        var id_del = $(del).appendTo(id_div).click(function() {
            fkp.del(k);
            outer.slideUp(400, function() {$(this).remove();});
        });

        var pw_div = $('<div class="password"></div>').appendTo(outer);
        id_div.click(function() {
            pw_div.empty();
            var pwc = $('<div class="password_close">close</div>');
            pwc.appendTo(pw_div).click(function() {
                pw_div.slideUp(400, function() {$(this).empty();});
            });
            var pws = fkp._get(k);
            for (var i=0; i<pws.length; i++) {
                var d = $('<div></div>').appendTo(pw_div).text(pws[i]);
                var pw_key = $(key).appendTo(d).text(i);
                var pw_del = $(del).appendTo(d).click(function() {
                    fkp.del(k, i);
                    d.remove();
                    if (pw_div.find('div').length == 1) id_del.click();
                });
            }
            pw_div.slideDown();
            setTimeout(function(){pwc.click();}, 30000);
        });
        return outer;
    },
    show_list: function() {
        var pl = $('#password_list').empty();
        var keys = [];
        for (var k in this.pwdb) { keys.push(k); }
        keys.sort();
        for (var i=0; i<keys.length; i++) {
            pl.append(this._make_entry(keys[i]));
        }
    },
    del: function(k, i) {
        if (!(k in this.pwdb)) return;
        if (i === undefined) {
            delete this.pwdb[k];
        } else {
            this.pwdb[k].splice(i, 1);
        }
        this.set_modified(true);
    },
    _get: function(k) {
        var pl = this.pwdb[k] || [];
        var ret = [];
        for (var i=0; i<pl.length; i++) {
            var v = fksjcl.base64.toBits(pl[i]);
            var iv = v.splice(0,4);
            var password = fksjcl.ccm.decrypt(this.ciph, v, iv);
            ret.push(fksjcl.utf8String.fromBits(password));
        }
        return ret;
    },
    get: function(identifier, username) {
        return this._get(JSON.stringify([identifier, username]));
    },
    _pw_encrypt: function(password, iv) {
        var ct = iv.concat(fksjcl.ccm.encrypt(this.ciph, password, iv));
        return fksjcl.base64.fromBits(ct);
    },
    _add: function(k) {
        var n = this._make_entry(k).hide();
        var added = false
        $('#password_list > div').each(function() {
            var e = $(this);
            if (e.find('.key').text() > k) {
                e.before(n);
                added = true;
                return false;
            }
        });
        if (!added) $('#password_list').append(n);
        n.slideDown();
    },
    add: function(identifier, username, password) {
        var pl, k = JSON.stringify([identifier, username]);
        password = fksjcl.utf8String.toBits(password);
        if (k in this.pwdb) {
            pl = this.pwdb[k];
            for (var i=0; i<pl.length; i++) {
                var v = fksjcl.base64.toBits(pl[i]);
                if (this._pw_encrypt(password, v.slice(0,4)) == pl[i]) return;
            }
            $('div.identifier:contains('+k+')').parent().
                    find('.password_close').click();
        } else {
            pl = this.pwdb[k] = [];
            this._add(k);
        }
        pl.push(this._pw_encrypt(password, fksjcl.random.randomWords(4,0)));
        this.set_modified(true);
    },
    merge: function(pack) {
        for (var k in pack.pwdb) {
            if (k in this.pwdb) {
                for (var i=0; i<pack.pwdb[k].length; i++) {
                    var v = pack.pwdb[k][i];
                    if ($.inArray(v, this.pwdb[k])) continue;
                    this.pwdb[k].push(v);
                    $('div.identifier:contains('+k+')').parent().
                            find('.password_close').click();
                }
            } else {
                this.pwdb[k] = pack.pwdb[k];
                this._add(k);
            }
        }
        this.ver = pack.ver;
    },
    set_modified: function(value) {
        this.modified = value;
        if (value) {
            $('.modified').fadeIn();
            window.freekey.set_sync(5);
        } else {
            $('.modified').fadeOut();
        }
    }
};

/**
 * @constructor
 */
function FK(pass, bucket) {
    this.pass = pass;
    this.bucket = bucket;
    this.syncing = false;
    this.sync_count = 0;
    this.init();
}

FK.prototype = {
    _version: function(key) {
        return key?fksjcl.hex.toBits(key.split('.')[1])[0]:0;
    },
    _key: function(version) {
        return 'pack.' + fksjcl.hex.fromBits([version]);
    },
    init: function() {
        var fk = this;
        console.log("init");
        freekey_status("Initializing...");
        function init_list(data) {
            console.log("init_list");
            var key = $(data).find('Contents Key').last().text();
            if (!key) {
                fk.pack = new FKPack(fk.pass);
                fk.pack.show_list();
                fk.done();
                return;
            }
            var version = fk._version(key);
            function init_load(data) {
                console.log("init_load");
                if (data['packformat'] !== 1) {
                    freekey_error("Found future pack format, upgrade?");
                    return;
                }
                fk.pack = new FKPack(fk.pass, data, version);
                fk.pack.show_list();
                fk.done();
            }
            fk.bucket.get(key, init_load, freekey_error);
        }
        fk.bucket.list('pack.', init_list, freekey_error);
    },
    sync: function(f) {
        var fk = this;
        console.log("sync");
        if (fk.syncing) {
            fk.done(false);
            return;
        }
        fk.syncing = true;
        freekey_status("Starting sync...");
        if (!fk.pack.modified) {
            fk.sync_list(false);
            return;
        }
        /* Generate UUID for each sync to ensure we are actually acquiring */
        fk.uuid = fksjcl.base64.fromBits(fksjcl.random.randomWords(4,0));
        fk.lock_tries = -1;
        fk.lockretry();
    },
    lockretry: function(data) {
        var fk = this;
        console.log("locking");
        fk.lock_tries++;
        if (fk.lock_tries > 15) {
            freekey_error('Retries exceeded, manual unlock needed?');
            return;
        } else if (fk.lock_tries > 0) {
            freekey_status("Retrying lock: " + fk.lock_tries);
        }
        function lockverify(data) {
            console.log('Mine', fk.uuid, 'got', data);
            if (data !== fk.uuid) { fk.lockretry(data); return; }
            freekey_status("Listing packs...");
            fk.sync_list(true);
        }
        function lockget(data) {
            console.log("getting lock to verify");
            fk.bucket.get('lock', lockverify, freekey_error);
        }
        function lockdown(data) {
            console.log("setting policy");
            fk.bucket.setPolicy(fk.bucket.make_policy(['pack.*','lock']),
                    lockget, freekey_error);
        }
        function lockerr(data) {
            if (data.status === 403) {
                lockget(data);
            } else {
                fk.lockretry(data);
            }
        }
        setTimeout(function() {
            fk.bucket.put('lock', fk.uuid, lockdown, lockerr);
        }, fk.lock_tries?2000:0);
    },
    sync_list: function(locked) {
        var fk = this;
        function process_list(data) {
            console.log("process sync list");
            var list = $(data);
            fk.lastlist = list;
            var lastkey = list.find('Contents Key').last().text();
            var version = lastkey==''?-1:fk._version(lastkey);
            if (fk.pack.ver >= version) {
                if (!locked) {
                    fk.done();
                } else if (fk.pack.ver > version || fk.pack.modified) {
                    fk.savepack();
                } else {
                    fk.unlock();
                }
                return;
            }
            freekey_status("Merging newer pack...");
            function merge(data) {
                console.log("merge");
                if (data['packformat'] !== 1) {
                    freekey_error("Found future pack format, upgrade?");
                    return;
                }
                pack = new FKPack(fk.pass, data, version);
                if (!fk.pack.modified) {
                    fk.pack = pack;
                    fk.pack.show_list();
                    fk.unlock();
                    return;
                }
                if (!locked) fk.done();
                fk.pack.merge(pack);
                fk.savepack();
            }
            fk.bucket.get(lastkey, merge, freekey_error);
        }
        fk.bucket.list('pack.', process_list, freekey_error);
    },
    savepack: function() {
        var fk = this;
        console.log("savepack");
        var names = ['lock'];
        fk.pack_tries = -1;
        if (fk.lastlist) {
            fk.lastlist.find('Contents Key').each(
                    function() {names.push($(this).text());});
        }
        function savedone(data) {
            fk.pack.ver++;
            fk.pack.set_modified(false);
            fk.unlock(data);
        }
        function saveretry(data) {
            console.log("saveretry");
            fk.pack_tries++;
            if (fk.pack_tries > 2) {
                freekey_error('Retries exceeded, will try again shortly');
                freekey_status();
                fk.done(false);
                return;
            } else if (fk.pack_tries > 0) {
                freekey_status("Retrying save: " + fk.pack_tries);
            }
            var out = fk.pack.string_crypt();
            fk.bucket.putJson(fk._key(fk.pack.ver+1), out,
                    savedone, saveretry, false);
        }
        freekey_status("Saving pack...");
        fk.bucket.setPolicy(fk.bucket.make_policy(names),
                saveretry, freekey_error);
    },
    unlock: function(data) {
        var fk = this;
        console.log("unlock");
        function cleanup(data) {
            console.log("cleanup");
            if (fk.lastlist) {
                var list = fk.lastlist.find('Contents');
                delete fk.lastlist;
                if (list.length > 100) {
                    var threshold = new Date();
                    threshold.setMonth(threshold.getMonth()-1);
                    list.slice(0, list.length-100).each(function() {
                        var entry = $(this);
                        var key = entry.find('Key').text();
                        var lmt = new Date(entry.find('LastModified').text());
                        if (lmt < threshold) fk.bucket.del(key);
                    });
                }
            }
            fk.done();
        }
        fk.bucket.delPolicy(cleanup, freekey_error);
    },
    done: function(show) {
        var fk = this;
        console.log("done");
        fk.syncing = false;
        if (show === undefined || show) freekey_status_done("Done...");
        $('#password_entry').fadeIn();
        if (!fk.sync_timer) fk.set_sync(300);
    },
    set_sync: function(seconds) {
        var fk = this;
        if (fk.sync_timer) clearTimeout(fk.sync_timer);
        fk.sync_timer = setTimeout(function(){
            delete fk.sync_timer;
            fk.sync();
        }, seconds * 1000);
    }
};

/**
 * @constructor
 */
function S3Bucket(bucket, access_key, secret_key) {
    this.bucket = bucket;
    this.access_key = access_key;
    this.secret_key = secret_key;
}

S3Bucket.prototype = {
    _make_arns: function(names) {
        var ret = [];
        for (var i=0; i<names.length; i++) {
            ret.push('arn:aws:s3:::' + this.bucket + '/' + names[i]);
        }
        return ret;
    },
    make_policy: function(lock) {
        return {
            "Statement":[{
                "Sid":"DenyUpdateDelete",
                "Effect":"Deny",
                "Principal":{"AWS":"*"},
                "Action":["s3:DeleteObject","s3:PutObject"],
                "Resource":this._make_arns(lock)
            }]
        };
    },
    origin: function() {
        return 'https://' + this.bucket + '.s3.amazonaws.com';
    },
    uri: function(resource, expires) {
        var ds = Math.round(new Date().getTime()/1000) + (expires || 0);
        var code = this.authString(resource, ds);
        return this.origin() + '/' + resource +
            '?AWSAccessKeyId=' + encodeURIComponent(this.access_key) +
            '&Expires=' + ds + '&Signature=' + encodeURIComponent(code);
    },
    sign: function(data) {
        var hm = new fksjcl.hmac(
                fksjcl.utf8String.toBits(this.secret_key), fksjcl.sha1);
        return fksjcl.base64.fromBits(hm.encrypt(data));
    },
    authHeaders: function(resource, verb, md5, type, amzheaders) {
        resource = resource || '';
        amzheaders = amzheaders || {};
        amzheaders['X-Amz-Date'] = new Date().toUTCString();
        var code = this.authString(resource, '', verb, md5, type, amzheaders);
        amzheaders['Authorization'] = 'AWS ' + this.access_key + ':' + code;
        return amzheaders;
    },
    authString: function(
            resource, dateString, verb, md5, type, amzheaders) {
        var key;
        var parts = [];
        parts.push(verb || 'GET');
        parts.push(md5 || '');
        parts.push(type || '');
        parts.push(dateString);
        amzheaders = amzheaders || {};
        var lc_amzheaders = {};
        for (key in amzheaders) {
            lc_amzheaders[key.toLowerCase()] = amzheaders[key];
        }
        var keys = [];
        for (key in lc_amzheaders) keys.push(key);
        keys.sort();
        for (var i=0; i<keys.length; i++) {
            key = keys[i];
            parts.push(key+':'+lc_amzheaders[key]);
        }
        parts.push('/' + this.bucket + '/' + resource);
        var hm = new fksjcl.hmac(
                fksjcl.utf8String.toBits(this.secret_key), fksjcl.sha1);
        return fksjcl.base64.fromBits(hm.encrypt(parts.join('\n')));
    },
    del: function(key, success, error) {
        var verb = 'DELETE';
        $.ajax(this.origin() + '/' + key, {
            'type': verb,
            'headers': this.authHeaders(key, verb, ''),
            'success': success,
            'error': error
        });
    },
    put: function(key, data, success, error, ct, async) {
        ct = ct || 'application/octet-stream';
        var md5 = fksjcl.base64.fromBits(sjcl.hash.md5.hash(data));
        var verb = 'PUT';
        var headers = this.authHeaders(key, verb, md5, ct);
        headers['Content-MD5'] = md5;
        headers['Cache-Control'] = 'no-cache';
        $.ajax(this.origin() + '/' + key, {
            'type': verb,
            'contentType': ct,
            'headers': headers,
            'data': data,
            'success': success,
            'error': error,
            'async': async===undefined?true:async
        });
    },
    putJson: function(key, data, success, error, async) {
        this.put(key, JSON.stringify(data),
                success, error, 'application/json', async);
    },
    setPolicy: function(policy, success, error) {
        this.putJson('?policy', policy, success, error);
    },
    delPolicy: function(success, error) {
        this.putJson('?policy', this.make_policy(['nothing']), success, error);
    },
    get: function(key, success, error) {
        $.ajax(this.origin() + '/' + key, {
            'headers': this.authHeaders(key),
            'success': success,
            'error': error
        });
    },
    list: function(prefix, success, error) {
        var headers = this.authHeaders();
        var qs = prefix?'?prefix=' + encodeURIComponent(prefix):'';
        $.ajax(this.origin() + qs, {
            'headers': headers,
            'success': success,
            'error': error
        });
    }
};

$(document).ready(function() {
    function show_init(id, error) {
        $('.init').slideUp();
        if (error) {
            $('#init_error').text(error).slideDown();
        } else {
            $('#init_error').empty().slideUp();
        }
        $('#'+id).slideDown();
    }
    function iframe(pass, rc) {
        var bucket = new S3Bucket(
            rc['s3_bucket'], rc['aws_access'], rc['aws_secret']);
        var origin = bucket.origin();
        var key = 'index.html';
        $('#main').load(function() {
            $(this).unbind('load');
            $.postmsg.listen(origin, 'loaded', function() {
                $('body').css('padding',0).css('margin',0);
                $('#main').css('width','100%').css('height','100%').fadeIn();
                $('#init, .main, script').remove();
                return [pass, bucket];
            });
            window.onbeforeunload = freekey_unload;
            this.contentWindow.location = bucket.uri(key, 5);
        });
        var html = '<html>' + $('html').html() + '</html>';
        var expires = new Date();
        expires.setTime(expires.getTime() + 5000);
        var policy = {
            "expiration": expires,
            "conditions": [
                {'bucket': bucket.bucket },
                {'key': key},
                {'Content-Type': 'text/html'},
                {'redirect': origin}
            ]
        };
        policy = fksjcl.base64.fromBits(
                fksjcl.utf8String.toBits(JSON.stringify(policy)));
        document['awsform']['key'].value = key;
        document['awsform']['policy'].value = policy;
        document['awsform']['file'].value = html;
        document['awsform']['AWSAccessKeyId'].value = bucket.access_key;
        document['awsform']['signature'].value = bucket.sign(policy);
        document['awsform']['redirect'].value = origin;
        $('#awsform').attr('action',origin).attr('method','post').submit();
        document['awsform']['file'].value = '';
    }
    function auth() {
        try {
            show_init('loading');
            var erc = JSON.parse(localStorage.getItem('freekey-rc'));
            var pass = document['auth_form']['authpass'].value;
            var rc = freekey_decrypt(pass, erc, 'value');
            iframe(pass, rc);
        } catch (ex) {
            if (ex.toString().indexOf('CORRUPT: ') === 0) {
                show_init('auth', 'Incorrect password');
            } else {
                show_init('auth', ex.toString());
            }
        }
    }
    function conf() {
        try {
            show_init('loading');
            var pass = document['conf_form']['passphrase'].value;
            if (pass !== document['conf_form']['passphrase2'].value) {
                show_init('conf', 'Passwords do not match');
                return;
            }
            var rc = {
                's3_bucket': document['conf_form']['s3_bucket'].value,
                'aws_access': document['conf_form']['aws_access'].value,
                'aws_secret': document['conf_form']['aws_secret'].value
            };
            var salt = fksjcl.random.randomWords(2,0);
            var erc = freekey_encrypt(ciph, salt, rc, 'value');
            localStorage.setItem('freekey-rc', JSON.stringify(erc));
            iframe(pass, rc);
        } catch (ex) {
            show_init('conf', ex.toString());
        }
    }
    $('#loading').show();
    if (window == window.top) {
        $(document['auth_form']).submit(function(e) {
            $(this).submit(function(e) { return false; });
            e.preventDefault();
            auth();
            return false;
        });
        $(document['conf_form']).submit(function(e) {
            $(this).submit(function(e) { return false; });
            e.preventDefault();
            conf();
            return false;
        });
        var json = localStorage.getItem('freekey-rc');
        if (json) {
            JSON.parse(json);
            show_init('auth');
        } else {
            show_init('conf');
        }
    } else {
        $('#init').hide();
        $('.main').show();
        var origin = window.location.origin;
        if (origin === 'file://') origin = '*'; /* Hate this a bit */
        $.postmsg.send(window.top, '*', 'loaded', undefined,
                {'success': freekey_start});
    }
});
