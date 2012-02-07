/* This helps compression without combining compilation with sjcl */
var chars = {
    punctuation: '`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789'
};
var fksjcl = {
    sha1: sjcl.hash.sha1,
    md5: sjcl.hash.md5,
    hmac: sjcl.misc.hmac,
    pbkdf2: function(pass, salt) {
        return sjcl.misc.pbkdf2(pass, salt, 1000, 256);
    },
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
};
function freekey_cookie(name, value, expires) {
    var e = encodeURIComponent;
    if (value !== undefined) {
        if (value === null) expires = -1;
        if(typeof expires === "number") {
            var d = expires;
            expires = new Date();
            expires.setDate(expires.getDate()+d);
        }
        expires = expires?"; expires="+expires.toUTCString():"";
        return document.cookie = e(name) + "=" + e(value) + expires;
    }
    var re = new RegExp("(?:^|; )"+e(name)+"=([^;]*)");
    var result = re.exec(document.cookie);
    return result?decodeURIComponent(result[1]):null;
}
function freekey_generate(length, charset, req) {
    var out = '';
    var tmp = 0;
    var bag = [];
    var special = {};
    for (var i=0; i<length; i++) bag[i] = i;
    for (var k in req) {
        if (tmp < bag.length)
            tmp = fksjcl.random.randomWords(1,0)[0] & 0x7fffffff;
        special[bag.splice(tmp % bag.length, 1)[0]] = k;
        tmp = (tmp / (bag.length+1))|0;
    }
    for (var i=0; i<length; i++) {
        var cs = charset;
        if (i in special) cs = req[special[i]];
        if (tmp < cs.length)
            tmp = fksjcl.random.randomWords(1,0)[0] & 0x7fffffff;
        out += cs[tmp % cs.length];
        tmp = (tmp / (cs.length+1))|0;
    }
    return out;
}
function freekey_ciph(pass, salt) {
    /* This duplicates the first two lines of freekey_decrypt, w/e for now */
    if (typeof salt === 'string') salt = fksjcl.base64.toBits(salt);
    return new fksjcl.aes(fksjcl.pbkdf2(pass, salt));
}
function freekey_decrypt(ciph, o, n) {
    for (var k in o)
        if (typeof o[k] === 'string') o[k] = fksjcl.base64.toBits(o[k]);
    var pt = fksjcl.ccm.decrypt(ciph, o[n], o['iv']);
    return JSON.parse(fksjcl.utf8String.fromBits(pt));
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
        /*console.log(arguments[0]);*/
        message = arguments[2] + ': ' + arguments[2];
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
    $('#status').text(message).fadeIn().delay(2000).fadeOut(400, function(){$(this).empty();});
}
function freekey_unload() {
    return "Are you sure you want to leave?  You will need to reenter your password to continue using FreeKey.";
}
function freekey_start(data) {
    $('#reencrypt_button').click(function() {
        $('#oldpass, #newpass1, #newpass2').val('');
        var button = $(this);
        var reencrypt = $('div.reencrypt').slideToggle(callback=function() {
            if ($(this).is(':visible')) {
                button.val('Cancel master pass phrase change');
            } else {
                button.val('Change master pass phrase');
            }
        });
    });
    $('#password_type input').click(function() {
        $('div.password_type').hide();
        $('#'+$(this).attr('value')).show();
    }).first().click();
    var puncdiv = $('#pwpunc').empty();
    for (var i=0; i<chars.punctuation.length; i++) {
        var c = chars.punctuation[i];
        $('<span class="rt checked"></span>\n').text(c).appendTo(puncdiv);
        puncdiv.append('\n');
    }
    $('<span class="xt">All</span>').appendTo(puncdiv).click(function() {
        $('#pwpunc span.rt').addClass('checked').removeClass('unchecked');
    });
    $('<span class="xt">None</span>').appendTo(puncdiv).click(function() {
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
        /* Allow backspace, delete and numbers */
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
    var rc_salt = data[2];
    var bucket = new S3Bucket(b.bucket, b.access_key, b.secret_key);
    window.freekey = new FK(pass, bucket, rc_salt);
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
    $('#do_reencrypt').click(function() {
        window.freekey.reencrypt();
    });
    $('#unlock_button').click(function() {
        if (confirm("You sure you want to force unlock?"))
            window.freekey.bucket.delPolicy();
    });
    $('#sync_button').click(function() {
        window.freekey.sync();
    });
}

/**
 * @constructor
 */
function FKPack(bucket, pass, pack, version) {
    this.bucket = bucket;
    if (version === undefined) {
        this.ver = 0;
    } else {
        this.ver = version;
    }
    this.modified = false;
    this.packformat = 2;
    if (pack === undefined) {
        this.salt = fksjcl.random.randomWords(2, 0);
        this.ciph = freekey_ciph(pass, salt);
        this.pwdb = {};
    } else {
        this.salt = pack['salt'];
        this.ciph = freekey_ciph(pass, this.salt);
        var contents = freekey_decrypt(this.ciph, pack, 'contents');
        if (pack['packformat'] === 1) {
            this.pwdb = {};
            for (var k in contents) {
                var iu = JSON.parse(k);
                this.pwdb[iu[0]] = this.pwdb[iu[0]] || {};
                this.pwdb[iu[0]][iu[1]] = contents[k];
            }
            this.set_modified(true);
        } else if (pack['packformat'] === 2) {
            this.pwdb = contents;
        }
        delete pack['packformat'];
    }
}

FKPack.prototype = {
    string_crypt: function() {
        var out = freekey_encrypt(this.ciph, this.salt, this.pwdb, 'contents');
        out['packformat'] = this.packformat;
        return out;
    },
    _make_entry: function(identifier, username) {
        var fkp = this;
        var outer = $('<div class="pwouter"></div>');

        var pi_div = $('<div class="pwinner"></div>').appendTo(outer);
        var id_div = $('<div class="identifier"></div>').appendTo(pi_div);
        var cb_div = $("<span class='fkcb'>copy</span>").appendTo(pi_div);
        cb_div.fkclip({
            'textfn': function(elem) {
                return fkp.get(identifier, username)[0] || '';
            },
            'container': pi_div,
            'moviePath': fkp.bucket.uri('fkclip.swf', 10)
        });
        var id_del = $('<span class="del">delete</span>').appendTo(pi_div);
        id_del.click(function() {
            fkp.del(identifier, username);
            outer.slideUp(400, function() {
                $(this).remove();
                fkp._move_fkclips();
            });
        });

        var pw_div = $('<div class="password"></div>').appendTo(outer);
        id_div.text(username+'@'+identifier).click(function() {
            pw_div.empty();
            var pwc = $('<div class="close">close</div>');
            pwc.appendTo(pw_div).click(function() {
                pw_div.slideUp(400, function() {$(this).empty();});
            });
            var pws = fkp.get(identifier, username);
            for (var i=0; i<pws.length; i++) {
                var idx = i;
                var d = $('<div class="onepw"></div>');
                d.text(pws[i]).appendTo(pw_div);
                var pw_del = $('<div class="del">delete</div>').appendTo(d);
                pw_del.click(function() {
                    fkp.del(identifier, username, idx);
                    d.remove();
                    if (pw_div.find('div').length == 1) id_del.click();
                });
            }
            pw_div.slideDown();
            setTimeout(function(){pwc.click();}, 30000);
        });
        return outer;
    },
    _sorted_keys: function(obj) {
        var keys = [];
        for (var k in obj) keys.push(k);
        keys.sort();
        return keys;
    },
    show_list: function() {
        var fkp = this;
        var pl = $('#password_list').empty();
        var ids = this._sorted_keys(this.pwdb);
        for (var i=0; i<ids.length; i++) {
            var uns = this._sorted_keys(this.pwdb[ids[i]]);
            for (var j=0; j<uns.length; j++) {
                pl.append(this._make_entry(ids[i], uns[j]));
            }
        }
        fkp._move_fkclips();
    },
    del: function(identifier, username, i) {
        if (username === undefined) {
            delete this.pwdb[identifier];
        } else if (i === undefined) {
            delete this.pwdb[identifier][username];
            if ($.isEmptyObject(this.pwdb[identifier]))
                this.del(identifier);
        } else {
            this.pwdb[identifier][username].splice(i, 1);
            if (this.pwdb[identifier][username].length == 0)
                this.del(identifier, username);
        }
        this.set_modified(true);
    },
    _pw_decrypt: function(data, ciph) {
        ciph = ciph || this.ciph;
        var v = fksjcl.base64.toBits(data);
        var iv = v.splice(0,4);
        return fksjcl.ccm.decrypt(ciph, v, iv);
    },
    get: function(identifier, username) {
        var pl = (this.pwdb[identifier] || {})[username] || [];
        var ret = [];
        for (var i=0; i<pl.length; i++) {
            ret.push(fksjcl.utf8String.fromBits(this._pw_decrypt(pl[i])));
        }
        return ret;
    },
    _pw_encrypt: function(password, iv) {
        var ct = iv.concat(fksjcl.ccm.encrypt(this.ciph, password, iv));
        return fksjcl.base64.fromBits(ct);
    },
    _add: function(identifier, username) {
        var n = this._make_entry(identifier, username).hide();
        var added = false;
        $('#password_list > div').each(function() {
            var i = $(this).find('div.identifier').text().split('@');
            if (i[1] > identifier || i[1] == identifier && i[0] > username) {
                n.insertBefore(this);
                added = true;
                return false; /* break */
            }
        });
        if (!added) $('#password_list').append(n);
        var fkp = this;
        n.slideDown(400, function() {fkp._move_fkclips(n);});
        fkp._move_fkclips();
    },
    _move_fkclips: function(outer) {
        var m = outer?outer.find:$;
        m('span.fkcb').each(function() {
            $(this).data('fkclip')['reposition']();
        });
    },
    _close: function(identifier, username) {
        $('div.pwouter:contains('+username+'@'+identifier+')').find('.close').click();
    },
    reencrypt: function(oldpass, newpass) {
        var saved_pwdb = this.pwdb;
        var saved_salt = this.salt;
        var saved_ciph = this.ciph;
        try {
            var old_ciph = freekey_ciph(oldpass, saved_salt);
            this.pwdb = {};
            this.salt = fksjcl.random.randomWords(2,0);
            this.ciph = freekey_ciph(newpass, this.salt);
            for (var identifier in saved_pwdb) {
                this.pwdb[identifier] = {};
                var uo = this.pwdb[identifier] = {};
                for (var username in saved_pwdb[identifier]) {
                    var pl = uo[username] = [];
                    var opl = saved_pwdb[identifier][username];
                    for (var i in opl) {
                        pl.push(this._pw_encrypt(this._pw_decrypt(opl[i], old_ciph), fksjcl.random.randomWords(4,0)));
                    }
                }
            }
            this.set_modified(true, true);
            return true;
        } catch (ex) {
            this.pwdb = saved_pwdb;
            this.salt = saved_salt;
            this.ciph = saved_ciph;
            if (ex.toString().indexOf('CORRUPT: ') === 0) {
                return false;
            }
            throw ex;
        }
    },
    add: function(identifier, username, password) {
        var pl;
        password = fksjcl.utf8String.toBits(password);
        var uo = this.pwdb[identifier] = this.pwdb[identifier] || {};
        if (username in uo) {
            pl = uo[username];
            for (var i=0; i<pl.length; i++) {
                var v = fksjcl.base64.toBits(pl[i]);
                if (this._pw_encrypt(password, v.slice(0,4)) == pl[i]) return;
            }
            this._close(identifier, username);
        } else {
            pl = uo[username] = [];
            this._add(identifier, username);
        }
        pl.push(this._pw_encrypt(password, fksjcl.random.randomWords(4,0)));
        this.set_modified(true);
    },
    merge: function(pack) {
        for (var identifier in pack.pwdb) {
            var uo = this.pwdb[identifier] = this.pwdb[identifier] || {};
            for (var username in pack.pwdb[identifier]) {
                var npl = pack.pwdb[identifier][username];
                if (username in uo) {
                    for (var i=0; i<npl.length; i++) {
                        if ($.inArray(npl[i], uo[username])) continue;
                        uo[username].push(npl[i]);
                        this._close(identifier, username);
                    }
                } else {
                    uo[username] = npl;
                    this._add(identifier, username);
                }
            }
        }
        this.ver = pack.ver;
    },
    set_modified: function(value, reencrypt) {
        this.modified = value;
        if (value) {
            $('.modified div').fadeIn();
            if (reencrypt) {
                this.reencrypted = true;
                window.freekey.sync();
            } else {
                window.freekey.set_sync(5);
            }
        } else {
            $('.modified div').fadeOut();
            delete this.reencrypted;
        }
    }
};

/**
 * @constructor
 */
function FK(pass, bucket, rc_salt) {
    this.pass = pass;
    this.bucket = bucket;
    this.rc_salt = rc_salt;
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
        freekey_status("Initializing...");
        function init_list(data) {
            /*console.log("init_list");*/
            var key = $(data).find('Contents Key').last().text();
            if (!key) {
                fk.pack = new FKPack(fk.bucket, fk.pass);
                fk.pack.show_list();
                fk.done();
                return;
            }
            var version = fk._version(key);
            function init_load(data) {
                /*console.log("init_load");*/
                if (data['packformat'] > 2) {
                    freekey_error("Found future pack format, upgrade?");
                    return;
                }
                try {
                    fk.pack = new FKPack(fk.bucket, fk.pass, data, version);
                    fk.pack.show_list();
                } catch (ex) {
                    if (ex.toString().indexOf('CORRUPT: ') === 0) {
                        freekey_error("Unable to load pack, probably reencrypted since this client was configured.  Reload FreeKey and reconfigure.");
                    } else {
                        throw ex;
                    }
                }
                fk.done();
            }
            fk.bucket.get(key, init_load, freekey_error);
        }
        function init(data) {
            /*console.log("init");*/
            fk.bucket.list('pack.', init_list, freekey_error);
        }
        fk.bucket.putBytes('fkclip.swf', fkclip, init, freekey_error);
    },
    sync: function() {
        var fk = this;
        /*console.log("sync");*/
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
        /*console.log("locking");*/
        fk.lock_tries++;
        if (fk.lock_tries > 15) {
            freekey_error('Retries exceeded, manual unlock needed?');
            return;
        } else if (fk.lock_tries > 0) {
            freekey_status("Retrying lock: " + fk.lock_tries);
        }
        function lockverify(data) {
            /*console.log('Mine', fk.uuid, 'got', data);*/
            if (data !== fk.uuid) { fk.lockretry(data); return; }
            freekey_status("Listing packs...");
            fk.sync_list(true);
        }
        function lockget(data) {
            /*console.log("getting lock to verify");*/
            fk.bucket.get('lock', lockverify, freekey_error);
        }
        function lockdown(data) {
            /*console.log("setting policy");*/
            fk.bucket.setPolicy(fk.bucket.make_policy(['pack.*','lock']), lockget, freekey_error);
        }
        function lockerr(data) {
            if (data.status === 403) {
                lockget(data);
            } else {
                fk.lockretry(data);
            }
        }
        setTimeout(function() {
            fk.bucket.putString('lock', fk.uuid, lockdown, lockerr);
        }, fk.lock_tries?2000:0);
    },
    sync_list: function(locked) {
        var fk = this;
        function process_list(data) {
            /*console.log("process sync list");*/
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
            if (fk.pack.reencrypted) {
                if (!locked) {
                    freekey_error("Should be impossible, tried to save reencrypted pack without lock");
                    fk.done();
                } else {
                    freekey_error("Another client saved a pack during reencryption, those changes are hidden, but could be recovered with help from Rearden Code");
                    fk.savepack();
                }
                return;
            }
            freekey_status("Merging newer pack...");
            function merge(data) {
                /*console.log("merge");*/
                if (data['packformat'] > 2) {
                    freekey_error("Found future pack format, upgrade?");
                    return;
                }
                try {
                    pack = new FKPack(fk.bucket, fk.pass, data, version);
                } catch (ex) {
                    if (ex.toString().indexOf('CORRUPT: ') === 0) {
                        freekey_error("Another client reencrypted the datastore, you will need to reload FreeKey and reconfigure");
                        return;
                    }
                    throw ex;
                }
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
    reencrypt: function() {
        var fk = this;
        $('#do_reencrypt').attr('disabled', true);
        if (fk.syncing) {
            setTimeout(fk.reencrypt, 500);
            return;
        }
        try {
            var oldpass = $('#oldpass').val()
            var newpass = $('#newpass1').val()
            if (newpass != $('#newpass2').val()) {
                freekey_error("New pass phrases do not match");
                return;
            }
            if (!fk.pack.reencrypt(oldpass, newpass)) {
                freekey_error("Old password incorrect");
                return;
            }
            var old_rc_key = fksjcl.pbkdf2(oldpass, this.rc_salt);
            var new_salt = fksjcl.random.randomWords(2,0);
            var new_rc_key = fksjcl.pbkdf2(newpass, new_salt);
            $.postmsg.send(window.top, '*', 'reencrypt', [old_rc_key, new_rc_key, new_salt]);
            $('#reencrypt_button').click();
            freekey_error();
        } finally {
            $('#do_reencrypt').attr('disabled', false);
        }
    },
    savepack: function() {
        var fk = this;
        /*console.log("savepack");*/
        var names = ['lock'];
        fk.pack_tries = -1;
        if (fk.lastlist) {
            fk.lastlist.find('Contents Key').each(function() {names.push($(this).text());});
        }
        function savedone(data) {
            fk.pack.ver++;
            fk.pack.set_modified(false);
            fk.unlock(data);
        }
        function saveretry(data) {
            /*console.log("saveretry");*/
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
            fk.bucket.putJson(fk._key(fk.pack.ver+1), out, savedone, saveretry, false);
        }
        freekey_status("Saving pack...");
        fk.bucket.setPolicy(fk.bucket.make_policy(names), saveretry, freekey_error);
    },
    unlock: function(data) {
        var fk = this;
        /*console.log("unlock");*/
        function cleanup(data) {
            /*console.log("cleanup");*/
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
        /*console.log("done");*/
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
        var params = { "AWSAccessKeyId": this.access_key, "Expires": ds, "Signature": code };
        return this.origin() + '/' + resource + '?' + $.param(params);
    },
    sign: function(data) {
        var hm = new fksjcl.hmac(fksjcl.utf8String.toBits(this.secret_key), fksjcl.sha1);
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
    authString: function(resource, dateString, verb, md5, type, amzheaders) {
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
        var hm = new fksjcl.hmac(fksjcl.utf8String.toBits(this.secret_key), fksjcl.sha1);
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
    post: function(key, data, contentType, success) {
        var origin = this.origin();
        var expires = new Date();
        expires.setTime(expires.getTime() + 5000);
        var policy = {
            "expiration": expires,
            "conditions": [
                {'bucket': this.bucket },
                {'key': key},
                {'Content-Type': contentType},
                {'redirect': origin}
            ]
        };
        policy = fksjcl.base64.fromBits(fksjcl.utf8String.toBits(JSON.stringify(policy)));
        document['awsform']['key'].value = key;
        document['awsform']['policy'].value = policy;
        document['awsform']['file'].value = data;
        document['awsform']['AWSAccessKeyId'].value = this.access_key;
        document['awsform']['signature'].value = this.sign(policy);
        document['awsform']['redirect'].value = origin;
        document['awsform']['Content-Type'].value = contentType;
        var tid = new Date().getTime().toString(36);
        var target = $('<iframe></iframe>').attr('name', tid).attr('id', tid).addClass('postable');
        target.appendTo($('body')).load(function(){success($(this).unbind('load'));});
        $('#awsform').attr('target', tid).attr('action',origin).attr('method','post').submit();
        document['awsform']['file'].value = '';
    },
    _put: function(key, data, success, error, ct, md5, async, binary) {
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
            'async': async===undefined?true:async,
            'binaryData': binary
        });
    },
    putBytes: function(key, b64data, success, error, ct) {
        var ct = ct || 'application/octet-stream';
        var data = atob(b64data);
        var md5 = fksjcl.base64.fromBits(fksjcl.md5.hash(fksjcl.base64.toBits(b64data)));
        this._put(key, data, success, error, ct, md5, false, true);
    },
    putString: function(key, data, success, error, ct, async) {
        ct = ct || 'text/plain';
        var md5 = fksjcl.base64.fromBits(fksjcl.md5.hash(data));
        this._put(key, data, success, error, ct, md5, async);
    },
    putJson: function(key, data, success, error, async) {
        this.putString(key, JSON.stringify(data),
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
        var qs = prefix?$.param({'prefix': prefix}):'';
        $.ajax(this.origin() + '?' + qs, {
            'headers': headers,
            'success': success,
            'error': error
        });
    }
};

$(document).ready(function() {
    var useCookie = false;
    if ($.browser['mozilla'] || $.browser['webkit'] && $.browser['version'] == 532.2) {
        useCookie = true;
    }
    function show_init(id, error) {
        $('.init').slideUp();
        if (error) {
            $('#init_error').text(error).slideDown();
        } else {
            $('#init_error').empty().slideUp();
        }
        $('#'+id).slideDown();
    }
    function load_erc() {
        var erc;
        if (useCookie) {
            erc = freekey_cookie('freekey-rc');
            freekey_cookie('freekey-rc', erc, 360); /* refresh */
        } else {
            erc = localStorage.getItem('freekey-rc')
        }
        return JSON.parse(erc);
    }
    function save_erc(erc) {
        erc = JSON.stringify(erc);
        if (useCookie) {
            freekey_cookie('freekey-rc', erc, 360);
        } else {
            localStorage.setItem('freekey-rc', erc);
        }
    }
    function reencrypt(data) { /* Parameters: from key, to key, to salt */
        var from_ciph = new fksjcl.aes(data[0]);
        var to_ciph = new fksjcl.aes(data[1]);
        var rc = freekey_decrypt(from_ciph, load_erc(), 'value');
        save_erc(freekey_encrypt(to_ciph, data[2], rc, 'value'));
    }
    function iframe(pass, rc, rc_salt) {
        var bucket = new S3Bucket(rc['s3_bucket'], rc['aws_access'], rc['aws_secret']);
        var key = 'index.html';
        function success(elem) {
            $.postmsg.listen(bucket.origin(), 'loaded', function() {
                $('body').css('padding',0).css('margin',0);
                elem.css('width','100%').css('height','100%').fadeIn();
                $('#init, .main, script').remove();
                $.postmsg.listen(bucket.origin(), 'reencrypt', reencrypt);
                return [pass, bucket, rc_salt];
            });
            window.onbeforeunload = freekey_unload;
            elem.attr('src',bucket.uri(key, 5));
        }
        var html = '<html>' + $('html').html() + '</html>';
        bucket.post(key, html, 'text/html', success);
    }
    function auth() {
        try {
            show_init('loading');
            var erc = load_erc();
            var pass = document['auth_form']['authpass'].value;
            var rc = freekey_decrypt(freekey_ciph(pass, erc['salt']), erc, 'value');
            iframe(pass, rc, erc['salt']);
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
            save_erc(freekey_encrypt(freekey_ciph(pass, salt), salt, rc, 'value'));
            iframe(pass, rc, salt);
        } catch (ex) {
            show_init('conf', ex.toString());
        }
    }
    $('#loading').show();
    if (window == window.top) {
        $(document['auth_form']['reconfigure']).click(function() {
            show_init('conf');
        });
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
        var erc;
        try { erc = load_erc(); } catch (ex) {}
        if (erc) {
            show_init('auth');
        } else {
            show_init('conf');
        }
    } else {
        $('#init').hide();
        $('.main').show();
        $.postmsg.send(window.top, '*', 'loaded', undefined, {'success': freekey_start});
    }
});
