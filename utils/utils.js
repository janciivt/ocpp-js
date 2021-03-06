const externalip = require('externalip');
const ip = require('ip');
const IPv6 = require('ip-address').Address6;

var Utils = {
    /**
     *  Log function
     *  @param {String} message to display
     *  @param
     */
    log: function(msg, type) {
        var d = new Date(),
            log = Utils.dateToString(d) + " ";

        if (type != undefined) {
            if (type == "cs")
                log += "cs: ";
            else if (type == "cp")
                log += "cp: ";
            else
                log += "cp#" + type + ": ";
        }

        console.log(log + msg);
    },

    getExternalIP: function(callback){
      externalip(callback);
    },

    getRemoteAddress: function(address){
      if(ip.isV6Format(address)){
        var IPv6Address = new IPv6(address);
        var teredo = IPv6Address.inspectTeredo();
        return teredo.client4;
      }else{
        return address;
      }
    },

    /**
     *  Convert a Date to String
     *  Format: [YY-mm-dd hh:mm:ss]
     *  @param {Date}
     *  @param {String}
     */
    dateToString: function(date) {
        var year = Utils.addZeroPadding(date.getFullYear()),
            month = Utils.addZeroPadding(date.getMonth() + 1),
            day = Utils.addZeroPadding(date.getDate()),
            hours = Utils.addZeroPadding(date.getHours()),
            minutes = Utils.addZeroPadding(date.getMinutes()),
            seconds = Utils.addZeroPadding(date.getSeconds());

        return "[" + year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" +
            seconds + "]";
    },

    /**
     *  Add zero-padding if needed
     *  @param {Number} Number of the day/month
     *  @param {String}
     */
    addZeroPadding: function(n) {
        return n < 10 ? '0' + n : '' + n;
    },

    /**
     *  Generate a random ID
     *  @return String
     */
    makeId: function() {
        var text = "",
            possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 32; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },

    /**
     * Retrieve OCPP version from string
     */
    retrieveVersion: function(str) {
        // if array, last occurence
        if (str instanceof Array) {
            str = str[str.length - 1];
        }

        var v = [];
        for (var i in str) {
            if (str[i] >= 0 && str[i] < 10) {
                v.push(str[i]);
            }
        }

        return v.join('.');
    },

    isEmpty: function(obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    },

    capitaliseFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    lowerFirstLetter: function(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    },

    getDateISOFormat: function() {
        return new Date().toISOString().split('.')[0] + 'Z';
    },

    validURL: function(str) {
        var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;-]*)/ig;

        return re.test(str); // TODO: test
    },

    clone: function(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr))
                if (typeof obj[attr] == "object")
                    copy[attr] = Utils.clone(obj[attr]);
                else
                    copy[attr] = obj[attr];
        }

        return copy;
    },

    // Get network interface IPs, from:
    // http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
    getNetworkIPs: function() {
        var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

        var exec = require('child_process').exec;
        var cached;
        var command;
        var filterRE;

        switch (process.platform) {
            case 'win32':
                //case 'win64': // TODO: test
                command = 'ipconfig';
                filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
                break;
            case 'darwin':
                command = 'ifconfig';
                filterRE = /\binet\s+([^\s]+)/g;
                // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
                break;
            default:
                command = 'ifconfig';
                filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
                // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
                break;
        }

        return function(callback, bypassCache) {
            if (cached && !bypassCache) {
                callback(null, cached);
                return;
            }
            // system call
            exec(command, function(error, stdout, sterr) {
                cached = [];
                var ip;
                var matches = stdout.match(filterRE) || [];
                //if (!error) {
                for (var i = 0; i < matches.length; i++) {
                    ip = matches[i].replace(filterRE, '$1')
                    if (!ignoreRE.test(ip)) {
                        cached.push(ip);
                    }
                }
                //}
                callback(error, cached);
            });
        };
    },

    generateTransactionId: function(){
      return Math.floor(Math.random() * 10);
    },

    toTitleCase: function (str){
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    },


    isPortUsed: function(port, fn) {
      var net = require('net')
      var tester = net.createServer().once('error', function (err) {
        if (err.code != 'EADDRINUSE') return fn(err)
        fn(null, true);
      }).once('listening', function() {
        tester.once('close', function() { fn(null, false) })
        .close();
      }).listen(port);
    },

    getPort: function(url) {
      url = url.match(/^(([a-z]+:)?(\/\/)?[^\/]+).*$/)[1] || url;
      var parts = url.split(':'),
          port = parseInt(parts[parts.length - 1], 10);
      if(parts[0] === 'http' && (isNaN(port) || parts.length < 3)) {
          return 80;
      }
      if(parts[0] === 'https' && (isNaN(port) || parts.length < 3)) {
          return 443;
      }
      if(parts.length === 1 || isNaN(port)) return 80;
      return port;
    },

    getEndpoint: function(uri, ip){
      var port = this.getPort(uri);
      if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
      }
      uri = uri.replace('http://', '');
      return ip + ':' + port + uri.substring(uri.indexOf('/'), uri.length);
    }
};

module.exports = Utils;
