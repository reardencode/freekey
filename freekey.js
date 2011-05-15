/* This helps compression without combining compilation with sjcl */
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
        $('#error').append('<div>'+message+'</div>').slideDown();
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
    freekey_status("Loading...");
    $('#unlock_button').click(function() {
        if (confirm("You sure you want to force unlock?"))
            freekey.bucket.delPolicy();
    });
    var pass = data[0];
    var b = data[1];
    var bucket = new S3Bucket(b.bucket, b.access_key, b.secret_key);
    window.freekey = new FK(pass, bucket);
    $(document['add_form']).submit(function(e) {
        e.preventDefault();
        var identifier = document['add_form']['identifier'].value;
        var username = document['add_form']['username'].value;
        var password = document['add_form']['password'].value;
        document['add_form'].reset();
        window.freekey.pack.add(identifier, username, password);
    });
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
        console.log("init");
        freekey_status("Initializing...");
        var fk = this;
        this.bucket.list('pack.',
                function(data){fk.init_list(data);}, freekey_error);
    },
    sync: function() {
        console.log("sync");
        this.sync_count++;
        if (this.syncing || !this.pack.modified && this.sync_count % 6 !== 5) {
            this.done(false);
            return;
        }
        this.syncing = true;
        freekey_status("Starting sync...");
        if (!this.pack.modified) {
            this.start_sync_list(false);
            return;
        }
        /* Generate UUID for each sync to ensure we are actually acquiring */
        this.uuid = fksjcl.base64.fromBits(fksjcl.random.randomWords(4,0));
        this.lock_tries = -1;
        this.lockretry();
    },
    lockretry: function(data) {
        console.log("lockretry");
        this.lock_tries++;
        if (this.lock_tries > 15) {
            freekey_error('Retries exceeded, manual unlock needed?');
            return;
        } else if (this.lock_tries > 0) {
            freekey_status("Retrying lock: " + this.lock_tries);
        }
        var fk = this;
        setTimeout(function() {
            fk.bucket.put('lock', fk.uuid,
                    function(data){fk.lockdown(data);},
                    function(data){
                        if (data.status === 403) {
                            fk.lockget(data);
                        } else {
                            fk.lockretry(data);
                        }
                    });
        }, this.lock_tries?2000:0);
    },
    lockdown: function(data) {
        console.log("lockdown");
        var fk = this;
        this.bucket.setPolicy(this.bucket.make_policy(['pack.*','lock']),
                function(data){fk.lockget(data);}, freekey_error);
    },
    lockget: function(data) {
        console.log("lockget");
        var fk = this;
        this.bucket.get('lock',
                function(data){fk.locked(data);}, freekey_error);
    },
    locked: function(data) {
        console.log('Mine', this.uuid, 'got', data);
        if (data !== this.uuid) {
            this.lockretry(data);
            return;
        }
        freekey_status("Listing packs...");
        this.start_sync_list(true);
    },
    start_sync_list: function(locked) {
        var fk = this;
        this.bucket.list('pack.',
                function(data){fk.sync_list(data, locked);}, freekey_error);
    },
    sync_list: function(data, locked) {
        console.log("sync_list");
        var list = $(data);
        this.lastlist = list;
        var lastkey = list.find('Contents Key').last().text();
        var version = lastkey==''?-1:this._version(lastkey);
        if (this.pack.ver >= version) {
            if (!locked) {
                this.done();
            } else if (this.pack.modified) {
                this.start_savepack();
            } else {
                this.unlock();
            }
            return;
        }
        freekey_status("Merging newer pack...");
        var fk = this;
        this.bucket.get(lastkey,
                function(data){fk.merge(version, data, locked);},
                freekey_error);
    },
    merge: function(version, pack, locked) {
        console.log("merge");
        if (pack['packformat'] !== 1) {
            freekey_error("Newer FreeKey used on repo, upgrade first.");
            return;
        }
        pack = new FKPack(this.pass, pack, version);
        if (!this.pack.modified) {
            this.pack = pack;
            this.pack.show_list();
            this.unlock();
            return;
        }
        if (!locked) this.done();
        this.pack.merge(pack);
        this.start_savepack();
    },
    start_savepack: function() {
        console.log("start_savepack");
        var names = ['lock'];
        this.pack_tries = -1;
        if (this.lastlist) {
            this.lastlist.find('Contents Key').each(
                    function() {names.push($(this).text());});
        }
        var fk = this;
        freekey_status("Saving pack...");
        this.bucket.setPolicy(this.bucket.make_policy(names),
                function(data){fk.savepack();}, freekey_error);
    },
    savepack: function(data) {
        console.log("savepack");
        this.pack_tries++;
        if (this.pack_tries > 2) {
            freekey_error('Retries exceeded, will try again shortly');
            freekey_status();
            this.done(false);
            return;
        } else if (this.pack_tries > 0) {
            freekey_status("Retrying save: " + this.pack_tries);
        }
        var out = this.pack.string_crypt();
        var fk = this;
        this.bucket.putJson(this._key(this.pack.ver+1), out,
                function(data){
                    fk.pack.ver++;
                    fk.pack.set_modified(false);
                    fk.unlock(data);
                },
                function(data){fk.savepack(data);}, false);
    },
    unlock: function(data) {
        console.log("unlock");
        var fk = this;
        this.bucket.delPolicy(function(data){fk.cleanup();}, freekey_error);
    },
    cleanup: function() {
        console.log("cleanup");
        if (this.lastlist) {
            var list = this.lastlist.find('Contents');
            delete this.lastlist;
            if (list.length > 100) {
                var fk = this;
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
        this.done();
    },
    done: function(show) {
        console.log("done");
        this.syncing = false;
        if (show === undefined || show) freekey_status_done("Done...");
        $('#password_entry').fadeIn();
        if (this.sync_timer) clearTimeout(this.sync_timer);
        var fk = this;
        this.sync_timer = setTimeout(function(){fk.sync();}, 5000);
    },
    init_list: function(data) {
        console.log("init_list");
        var key = $(data).find('Contents Key').last().text();
        if (key) {
            var version = this._version(key);
            var fk = this;
            this.bucket.get(key,
                    function(data){fk.init_load(version, data);},
                    freekey_error);
            return;
        }
        this.pack = new FKPack(this.pass);
        this.pack.show_list();
        this.done();
    },
    init_load: function(version, data) {
        console.log("init_load");
        if (data['packformat'] !== 1) {
            freekey_error("Newer FreeKey used on repo, upgrade first.");
            return;
        }
        this.pack = new FKPack(this.pass, data, version);
        this.pack.show_list();
        this.done();
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
                $('#init').hide();
                $('body').css('padding',0).css('margin',0);
                $('#main').css('width','100%').css('height','100%').fadeIn();
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
