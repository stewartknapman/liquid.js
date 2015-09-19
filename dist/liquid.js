(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//
// strftime
// github.com/samsonjs/strftime
// @_sjs
//
// Copyright 2010 - 2015 Sami Samhuri <sami@samhuri.net>
//
// MIT License
// http://sjs.mit-license.org
//

;(function() {

    var DefaultLocale = {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            AM: 'AM',
            PM: 'PM',
            am: 'am',
            pm: 'pm',
            formats: {
                D: '%m/%d/%y',
                F: '%Y-%m-%d',
                R: '%H:%M',
                T: '%H:%M:%S',
                X: '%T',
                c: '%a %b %d %X %Y',
                r: '%I:%M:%S %p',
                v: '%e-%b-%Y',
                x: '%D'
            }
        },
        defaultStrftime = new Strftime(DefaultLocale, 0, false),
        isCommonJS = typeof module !== 'undefined',
        namespace;

    // CommonJS / Node module
    if (isCommonJS) {
        namespace = module.exports = adaptedStrftime;
        namespace.strftime = deprecatedStrftime;
    }
    // Browsers and other environments
    else {
        // Get the global object. Works in ES3, ES5, and ES5 strict mode.
        namespace = (function() { return this || (1,eval)('this'); }());
        namespace.strftime = adaptedStrftime;
    }

    // Deprecated API, to be removed in v1.0
    var _require = isCommonJS ? "require('strftime')" : "strftime";
    var _deprecationWarnings = {};
    function deprecationWarning(name, instead) {
        if (!_deprecationWarnings[name]) {
            if (typeof console !== 'undefined' && typeof console.warn == 'function') {
                console.warn("[WARNING] " + name + " is deprecated and will be removed in version 1.0. Instead, use `" + instead + "`.");
            }
            _deprecationWarnings[name] = true;
        }
    }

    namespace.strftimeTZ = deprecatedStrftimeTZ;
    namespace.strftimeUTC = deprecatedStrftimeUTC;
    namespace.localizedStrftime = deprecatedStrftimeLocalized;

    // Adapt the old API while preserving the new API.
    function adaptForwards(fn) {
        fn.localize = defaultStrftime.localize.bind(defaultStrftime);
        fn.timezone = defaultStrftime.timezone.bind(defaultStrftime);
        fn.utc = defaultStrftime.utc.bind(defaultStrftime);
    }

    adaptForwards(adaptedStrftime);
    function adaptedStrftime(fmt, d, locale) {
        // d and locale are optional, check if this is (format, locale)
        if (d && d.days) {
            locale = d;
            d = undefined;
        }
        if (locale) {
            deprecationWarning("`" + _require + "(format, [date], [locale])`", "var s = " + _require + ".localize(locale); s(format, [date])");
        }
        var strftime = locale ? defaultStrftime.localize(locale) : defaultStrftime;
        return strftime(fmt, d);
    }

    adaptForwards(deprecatedStrftime);
    function deprecatedStrftime(fmt, d, locale) {
        if (locale) {
            deprecationWarning("`" + _require + ".strftime(format, [date], [locale])`", "var s = " + _require + ".localize(locale); s(format, [date])");
        }
        else {
            deprecationWarning("`" + _require + ".strftime(format, [date])`", _require + "(format, [date])");
        }
        var strftime = locale ? defaultStrftime.localize(locale) : defaultStrftime;
        return strftime(fmt, d);
    }

    function deprecatedStrftimeTZ(fmt, d, locale, timezone) {
        // locale is optional, check if this is (format, date, timezone)
        if ((typeof locale == 'number' || typeof locale == 'string') && timezone == null) {
            timezone = locale;
            locale = undefined;
        }

        if (locale) {
            deprecationWarning("`" + _require + ".strftimeTZ(format, date, locale, tz)`", "var s = " + _require + ".localize(locale).timezone(tz); s(format, [date])` or `var s = " + _require + ".localize(locale); s.timezone(tz)(format, [date])");
        }
        else {
            deprecationWarning("`" + _require + ".strftimeTZ(format, date, tz)`", "var s = " + _require + ".timezone(tz); s(format, [date])` or `" + _require + ".timezone(tz)(format, [date])");
        }

        var strftime = (locale ? defaultStrftime.localize(locale) : defaultStrftime).timezone(timezone);
        return strftime(fmt, d);
    }

    var utcStrftime = defaultStrftime.utc();
    function deprecatedStrftimeUTC(fmt, d, locale) {
        if (locale) {
            deprecationWarning("`" + _require + ".strftimeUTC(format, date, locale)`", "var s = " + _require + ".localize(locale).utc(); s(format, [date])");
        }
        else {
            deprecationWarning("`" + _require + ".strftimeUTC(format, [date])`", "var s = " + _require + ".utc(); s(format, [date])");
        }
        var strftime = locale ? utcStrftime.localize(locale) : utcStrftime;
        return strftime(fmt, d);
    }

    function deprecatedStrftimeLocalized(locale) {
        deprecationWarning("`" + _require + ".localizedStrftime(locale)`", _require + ".localize(locale)");
        return defaultStrftime.localize(locale);
    }
    // End of deprecated API

    // Polyfill Date.now for old browsers.
    if (typeof Date.now !== 'function') {
        Date.now = function() {
          return +new Date();
        };
    }

    function Strftime(locale, customTimezoneOffset, useUtcTimezone) {
        var _locale = locale || DefaultLocale,
            _customTimezoneOffset = customTimezoneOffset || 0,
            _useUtcBasedDate = useUtcTimezone || false,

            // we store unix timestamp value here to not create new Date() each iteration (each millisecond)
            // Date.now() is 2 times faster than new Date()
            // while millisecond precise is enough here
            // this could be very helpful when strftime triggered a lot of times one by one
            _cachedDateTimestamp = 0,
            _cachedDate;

        function _strftime(format, date) {
            var timestamp;

            if (!date) {
                var currentTimestamp = Date.now();
                if (currentTimestamp > _cachedDateTimestamp) {
                    _cachedDateTimestamp = currentTimestamp;
                    _cachedDate = new Date(_cachedDateTimestamp);

                    timestamp = _cachedDateTimestamp;

                    if (_useUtcBasedDate) {
                        // how to avoid duplication of date instantiation for utc here?
                        // we tied to getTimezoneOffset of the current date
                        _cachedDate = new Date(_cachedDateTimestamp + getTimestampToUtcOffsetFor(_cachedDate) + _customTimezoneOffset);
                    }
                }
                else {
                  timestamp = _cachedDateTimestamp;
                }
                date = _cachedDate;
            }
            else {
                timestamp = date.getTime();

                if (_useUtcBasedDate) {
                    date = new Date(date.getTime() + getTimestampToUtcOffsetFor(date) + _customTimezoneOffset);
                }
            }

            return _processFormat(format, date, _locale, timestamp);
        }

        function _processFormat(format, date, locale, timestamp) {
            var resultString = '',
                padding = null,
                isInScope = false,
                length = format.length,
                extendedTZ = false;

            for (var i = 0; i < length; i++) {

                var currentCharCode = format.charCodeAt(i);

                if (isInScope === true) {
                    // '-'
                    if (currentCharCode === 45) {
                        padding = '';
                        continue;
                    }
                    // '_'
                    else if (currentCharCode === 95) {
                        padding = ' ';
                        continue;
                    }
                    // '0'
                    else if (currentCharCode === 48) {
                        padding = '0';
                        continue;
                    }
                    // ':'
                    else if (currentCharCode === 58) {
                      if (extendedTZ) {
                        if (typeof console !== 'undefined' && typeof console.warn == 'function') {
                          console.warn("[WARNING] detected use of unsupported %:: or %::: modifiers to strftime");
                        }
                      }
                      extendedTZ = true;
                      continue;
                    }

                    switch (currentCharCode) {

                        // Examples for new Date(0) in GMT

                        // 'Thursday'
                        // case 'A':
                        case 65:
                            resultString += locale.days[date.getDay()];
                            break;

                        // 'January'
                        // case 'B':
                        case 66:
                            resultString += locale.months[date.getMonth()];
                            break;

                        // '19'
                        // case 'C':
                        case 67:
                            resultString += padTill2(Math.floor(date.getFullYear() / 100), padding);
                            break;

                        // '01/01/70'
                        // case 'D':
                        case 68:
                            resultString += _processFormat(locale.formats.D, date, locale, timestamp);
                            break;

                        // '1970-01-01'
                        // case 'F':
                        case 70:
                            resultString += _processFormat(locale.formats.F, date, locale, timestamp);
                            break;

                        // '00'
                        // case 'H':
                        case 72:
                            resultString += padTill2(date.getHours(), padding);
                            break;

                        // '12'
                        // case 'I':
                        case 73:
                            resultString += padTill2(hours12(date.getHours()), padding);
                            break;

                        // '000'
                        // case 'L':
                        case 76:
                            resultString += padTill3(Math.floor(timestamp % 1000));
                            break;

                        // '00'
                        // case 'M':
                        case 77:
                            resultString += padTill2(date.getMinutes(), padding);
                            break;

                        // 'am'
                        // case 'P':
                        case 80:
                            resultString += date.getHours() < 12 ? locale.am : locale.pm;
                            break;

                        // '00:00'
                        // case 'R':
                        case 82:
                            resultString += _processFormat(locale.formats.R, date, locale, timestamp);
                            break;

                        // '00'
                        // case 'S':
                        case 83:
                            resultString += padTill2(date.getSeconds(), padding);
                            break;

                        // '00:00:00'
                        // case 'T':
                        case 84:
                            resultString += _processFormat(locale.formats.T, date, locale, timestamp);
                            break;

                        // '00'
                        // case 'U':
                        case 85:
                            resultString += padTill2(weekNumber(date, 'sunday'), padding);
                            break;

                        // '00'
                        // case 'W':
                        case 87:
                            resultString += padTill2(weekNumber(date, 'monday'), padding);
                            break;

                        // '16:00:00'
                        // case 'X':
                        case 88:
                            resultString += _processFormat(locale.formats.X, date, locale, timestamp);
                            break;

                        // '1970'
                        // case 'Y':
                        case 89:
                            resultString += date.getFullYear();
                            break;

                        // 'GMT'
                        // case 'Z':
                        case 90:
                            if (_useUtcBasedDate && _customTimezoneOffset === 0) {
                                resultString += "GMT";
                            }
                            else {
                                // fixme optimize
                                var tzString = date.toString().match(/\(([\w\s]+)\)/);
                                resultString += tzString && tzString[1] || '';
                            }
                            break;

                        // 'Thu'
                        // case 'a':
                        case 97:
                            resultString += locale.shortDays[date.getDay()];
                            break;

                        // 'Jan'
                        // case 'b':
                        case 98:
                            resultString += locale.shortMonths[date.getMonth()];
                            break;

                        // ''
                        // case 'c':
                        case 99:
                            resultString += _processFormat(locale.formats.c, date, locale, timestamp);
                            break;

                        // '01'
                        // case 'd':
                        case 100:
                            resultString += padTill2(date.getDate(), padding);
                            break;

                        // ' 1'
                        // case 'e':
                        case 101:
                            resultString += padTill2(date.getDate(), padding == null ? ' ' : padding);
                            break;

                        // 'Jan'
                        // case 'h':
                        case 104:
                            resultString += locale.shortMonths[date.getMonth()];
                            break;

                        // '000'
                        // case 'j':
                        case 106:
                            var y = new Date(date.getFullYear(), 0, 1);
                            var day = Math.ceil((date.getTime() - y.getTime()) / (1000 * 60 * 60 * 24));
                            resultString += padTill3(day);
                            break;

                        // ' 0'
                        // case 'k':
                        case 107:
                            resultString += padTill2(date.getHours(), padding == null ? ' ' : padding);
                            break;

                        // '12'
                        // case 'l':
                        case 108:
                            resultString += padTill2(hours12(date.getHours()), padding == null ? ' ' : padding);
                            break;

                        // '01'
                        // case 'm':
                        case 109:
                            resultString += padTill2(date.getMonth() + 1, padding);
                            break;

                        // '\n'
                        // case 'n':
                        case 110:
                            resultString += '\n';
                            break;

                        // '1st'
                        // case 'o':
                        case 111:
                            resultString += String(date.getDate()) + ordinal(date.getDate());
                            break;

                        // 'AM'
                        // case 'p':
                        case 112:
                            resultString += date.getHours() < 12 ? locale.AM : locale.PM;
                            break;

                        // '12:00:00 AM'
                        // case 'r':
                        case 114:
                            resultString += _processFormat(locale.formats.r, date, locale, timestamp);
                            break;

                        // '0'
                        // case 's':
                        case 115:
                            resultString += Math.floor(timestamp / 1000);
                            break;

                        // '\t'
                        // case 't':
                        case 116:
                            resultString += '\t';
                            break;

                        // '4'
                        // case 'u':
                        case 117:
                            var day = date.getDay();
                            resultString += day === 0 ? 7 : day;
                            break; // 1 - 7, Monday is first day of the week

                        // ' 1-Jan-1970'
                        // case 'v':
                        case 118:
                            resultString += _processFormat(locale.formats.v, date, locale, timestamp);
                            break;

                        // '4'
                        // case 'w':
                        case 119:
                            resultString += date.getDay();
                            break; // 0 - 6, Sunday is first day of the week

                        // '12/31/69'
                        // case 'x':
                        case 120:
                            resultString += _processFormat(locale.formats.x, date, locale, timestamp);
                            break;

                        // '70'
                        // case 'y':
                        case 121:
                            resultString += ('' + date.getFullYear()).slice(2);
                            break;

                        // '+0000'
                        // case 'z':
                        case 122:
                            if (_useUtcBasedDate && _customTimezoneOffset === 0) {
                                resultString += extendedTZ ? "+00:00" : "+0000";
                            }
                            else {
                                var off;
                                if (_customTimezoneOffset !== 0) {
                                    off = _customTimezoneOffset / (60 * 1000);
                                }
                                else {
                                    off = -date.getTimezoneOffset();
                                }
                                var sign = off < 0 ? '-' : '+';
                                var sep = extendedTZ ? ':' : '';
                                var hours = Math.floor(Math.abs(off / 60));
                                var mins = Math.abs(off % 60);
                                resultString += sign + padTill2(hours) + sep + padTill2(mins);
                            }
                            break;

                        default:
                            resultString += format[i];
                            break;
                    }

                    padding = null;
                    isInScope = false;
                    continue;
                }

                // '%'
                if (currentCharCode === 37) {
                    isInScope = true;
                    continue;
                }

                resultString += format[i];
            }

            return resultString;
        }

        var strftime = _strftime;

        strftime.localize = function(locale) {
            return new Strftime(locale || _locale, _customTimezoneOffset, _useUtcBasedDate);
        };

        strftime.timezone = function(timezone) {
            var customTimezoneOffset = _customTimezoneOffset;
            var useUtcBasedDate = _useUtcBasedDate;

            var timezoneType = typeof timezone;
            if (timezoneType === 'number' || timezoneType === 'string') {
                useUtcBasedDate = true;

                // ISO 8601 format timezone string, [-+]HHMM
                if (timezoneType === 'string') {
                    var sign = timezone[0] === '-' ? -1 : 1,
                        hours = parseInt(timezone.slice(1, 3), 10),
                        minutes = parseInt(timezone.slice(3, 5), 10);

                    customTimezoneOffset = sign * ((60 * hours) + minutes) * 60 * 1000;
                    // in minutes: 420
                }
                else if (timezoneType === 'number') {
                    customTimezoneOffset = timezone * 60 * 1000;
                }
            }

            return new Strftime(_locale, customTimezoneOffset, useUtcBasedDate);
        };

        strftime.utc = function() {
            return new Strftime(_locale, _customTimezoneOffset, true);
        };

        return strftime;
    }

    function padTill2(numberToPad, paddingChar) {
        if (paddingChar === '' || numberToPad > 9) {
            return numberToPad;
        }
        if (paddingChar == null) {
            paddingChar = '0';
        }
        return paddingChar + numberToPad;
    }

    function padTill3(numberToPad) {
        if (numberToPad > 99) {
            return numberToPad;
        }
        if (numberToPad > 9) {
            return '0' + numberToPad;
        }
        return '00' + numberToPad;
    }

    function hours12(hour) {
        if (hour === 0) {
            return 12;
        }
        else if (hour > 12) {
            return hour - 12;
        }
        return hour;
    }

    // firstWeekday: 'sunday' or 'monday', default is 'sunday'
    //
    // Pilfered & ported from Ruby's strftime implementation.
    function weekNumber(date, firstWeekday) {
        firstWeekday = firstWeekday || 'sunday';

        // This works by shifting the weekday back by one day if we
        // are treating Monday as the first day of the week.
        var weekday = date.getDay();
        if (firstWeekday === 'monday') {
            if (weekday === 0) // Sunday
                weekday = 6;
            else
                weekday--;
        }

        var firstDayOfYearUtc = Date.UTC(date.getFullYear(), 0, 1),
            dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
            yday = Math.floor((dateUtc - firstDayOfYearUtc) / 86400000),
            weekNum = (yday + 7 - weekday) / 7;

        return Math.floor(weekNum);
    }

    // Get the ordinal suffix for a number: st, nd, rd, or th
    function ordinal(number) {
        var i = number % 10;
        var ii = number % 100;

        if ((ii >= 11 && ii <= 13) || i === 0 || i >= 4) {
            return 'th';
        }
        switch (i) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
        }
    }

    function getTimestampToUtcOffsetFor(date) {
        return (date.getTimezoneOffset() || 0) * 60000;
    }

}());

},{}],2:[function(require,module,exports){
module.exports = {
  
  init: function(tagName, markup, tokens){
    this.blockName = tagName;
    this.blockDelimiter = "end"+ this.blockName;
    this._super(tagName, markup, tokens);
  },
  
  parse: function(tokens) {
    // NOTE Don't just blindly re-initialize nodelist; inherited classes may 
    // share this through pointers; specifically If points _nodelist at the 
    // blocks attachment, so we need to leave that pointer to pickup stuff.
    if (!this.nodelist) this.nodelist = [];
    this.nodelist.clear();
    
    var token = tokens.shift();
    tokens.push(''); // To ensure we don't lose the last token passed in...
    while(tokens.length) { 

      if( /^\{\%/.test(token) ) { // It's a tag...
        var tagParts = token.match(/^\{\%\s*(\w+)\s*(.*)?\%\}$/);
        
        if(tagParts) {
          // if we found the proper block delimitor just end parsing here and let the outer block proceed
          if( this.blockDelimiter == tagParts[1] ) {
            this.endTag();
            return;
          }
          if( tagParts[1] in Liquid.Template.tags ) {
            this.nodelist.push( new Liquid.Template.tags[tagParts[1]]( tagParts[1], tagParts[2], tokens ) );
          } else {
            this.unknownTag( tagParts[1], tagParts[2], tokens );
          }
        } else {
          throw ( "Tag '"+ token +"' was not properly terminated with: %}");
        }
      } else if(/^\{\{/.test(token)) { // It's a variable...
        this.nodelist.push( this.createVariable(token) );
      } else { //if(token != '') {
        this.nodelist.push( token );
      } // Ignores tokens that are empty
      token = tokens.shift(); // Assign the next token to loop again...
    }
    
    // Effectively this method will throw and exception unless the current block is of type Document 
    this.assertMissingDelimitation();
  },
  
  endTag: function() {},
  
  unknownTag: function(tag, params, tokens) {
    switch(tag) {
      case 'else': throw (this.blockName +" tag does not expect else tag"); break;
      case 'end':  throw ("'end' is not a valid delimiter for "+ this.blockName +" tags. use "+ this.blockDelimiter); break;
      default:     throw ("Unknown tag: "+ tag);
    }
  },
  
  createVariable: function(token) {
    var match = token.match(/^\{\{(.*)\}\}$/);
    if(match) { return new Liquid.Variable(match[1]); }
    else { throw ("Variable '"+ token +"' was not properly terminated with: }}"); }
  },
  
  render: function(context) {
    return this.renderAll(this.nodelist, context);
  },
  
  renderAll: function(list, context) {
    return (list || []).map(function(token, i){
      var output = '';
      try { // hmmm... feels a little heavy
        output = ( token['render'] ) ? token.render(context) : token;
      } catch(e) {
        output = context.handleError(e);
      }
      return output;
    });
  },
  
  assertMissingDelimitation: function(){
    throw (this.blockName +" tag was never closed");
  }
};

},{}],3:[function(require,module,exports){
module.exports.init_class = function (obj) {
  
  /* Simple JavaScript Inheritance
   * By John Resig http://ejohn.org/
   * MIT Licensed.
   */
  // Inspired by base2 and Prototype
  (function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  
    // The base Class implementation (does nothing)
    this.Class = function(){};
   
    // Create a new Class that inherits from this class
    this.Class.extend = function(prop) {
      var _super = this.prototype;
     
      // Instantiate a base class (but only create the instance,
      // don't run the init constructor)
      initializing = true;
      var prototype = new this();
      initializing = false;
     
      // Copy the properties over onto the new prototype
      for (var name in prop) {
        // Check if we're overwriting an existing function
        prototype[name] = typeof prop[name] == "function" &&
          typeof _super[name] == "function" && fnTest.test(prop[name]) ?
          (function(name, fn){
            return function() {
              var tmp = this._super;
             
              // Add a new ._super() method that is the same method
              // but on the super-class
              this._super = _super[name];
             
              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              var ret = fn.apply(this, arguments);       
              this._super = tmp;
             
              return ret;
            };
          })(name, prop[name]) :
          prop[name];
      }
     
      // The dummy class constructor
      function Class() {
        // All construction is actually done in the init method
        if ( !initializing && this.init )
          this.init.apply(this, arguments);
      }
     
      // Populate our constructed prototype object
      Class.prototype = prototype;
     
      // Enforce the constructor to be what we expect
      Class.prototype.constructor = Class;
  
      // And make this class extendable
      Class.extend = arguments.callee;
     
      return Class;
    };
  }).call(obj);
  
};
},{}],4:[function(require,module,exports){
module.exports = {

  init: function(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    this.childRelation = null;
    this.childCondition = null;
    this.attachment = null;
  },

  evaluate: function(context) {
    context = context || new Liquid.Context();
    var result = this.interpretCondition(this.left, this.right, this.operator, context);
    switch(this.childRelation) {
      case 'or':
        return (result || this.childCondition.evaluate(context));
      case 'and':
        return (result && this.childCondition.evaluate(context));
      default:
        return result;
    }
  },

  or: function(condition) {
    this.childRelation = 'or';
    this.childCondition = condition;
  },

  and: function(condition) {
    this.childRelation = 'and';
    this.childCondition = condition;
  },

  attach: function(attachment) {
    this.attachment = attachment;
    return this.attachment;
  },

  isElse: false,

  interpretCondition: function(left, right, op, context) {
    // If the operator is empty this means that the decision statement is just
    // a single variable. We can just pull this variable from the context and
    // return this as the result.
    if(!op)
      { return context.get(left); }

    left = context.get(left);
    right = context.get(right);
    op = Liquid.Condition.operators[op];
    if(!op)
      { throw ("Unknown operator "+ op); }

    var results = op(left, right);
    return results;
  },

  toString: function() {
    return "<Condition "+ this.left +" "+ this.operator +" "+ this.right +">";
  }

};


module.exports.applyMethods = function (Liquid) {
  Liquid.Condition.operators = {
    '==': function(l,r) {  return (l == r); },
    '=':  function(l,r) { return (l == r); },
    '!=': function(l,r) { return (l != r); },
    '<>': function(l,r) { return (l != r); },
    '<':  function(l,r) { return (l < r); },
    '>':  function(l,r) { return (l > r); },
    '<=': function(l,r) { return (l <= r); },
    '>=': function(l,r) { return (l >= r); },
  
    'contains': function(l,r) {
      if ( Object.prototype.toString.call(l) === '[object Array]' ) {
        return l.indexOf(r) >= 0;
      } else {
        return l.match(r);
      }
    },
    // HACK Apply from Liquid.extensions.object; extending Object sad.
    //'hasKey': function(l,r) { return l.hasKey(r); }
    'hasKey':   function(l,r) { return Liquid.extensions.object.hasKey.call(l, r); },
    //'hasValue': function(l,r) { return l.hasValue(r); }
    'hasValue': function(l,r) { return Liquid.extensions.object.hasValue.call(l, r); }
  }
};

module.exports.ElseCondition = {

  isElse: true,

  evaluate: function(context) {
    return true;
  },

  toString: function() {
    return "<ElseCondition>";
  }

};

},{}],5:[function(require,module,exports){
module.exports = {

  init: function(assigns, registers, rethrowErrors) {
    this.scopes = [ assigns ? assigns : {} ];
    this.registers = registers ? registers : {};
    this.errors = [];
    this.rethrowErrors = rethrowErrors;
    this.strainer = Liquid.Strainer.create(this);
  },
  
  get: function(varname) {
    return this.resolve(varname);
  },
  
  set: function(varname, value) {
    this.scopes[0][varname] = value;
  },
  
  hasKey: function(key) {
    return (this.resolve(key)) ? true : false;
  },
  
  push: function() {
    var scpObj = {};
    this.scopes.unshift(scpObj);
    return scpObj // Is this right?
  },
  
  merge: function(newScope) {
    // HACK Apply from Liquid.extensions.object; extending Object sad. 
    //return this.scopes[0].update(newScope);
    return Liquid.extensions.object.update.call(this.scopes[0], newScope);
  },
  
  pop: function() {
    if(this.scopes.length == 1){ throw "Context stack error"; }
    return this.scopes.shift();
  },
  
  stack: function(lambda, bind) {
    var result = null;
    this.push();
    try {
      result = lambda.apply(bind ? bind : this.strainer);
    } finally {
      this.pop();
    }
    return result;
  },
  
  invoke: function(method, args) {
    if( this.strainer.respondTo(method) ) {
      // console.log('found method '+ method);
      // console.log("INVOKE: "+ method);
      // console.log('args', args);
      var result = this.strainer[method].apply(this.strainer, args);
      // console.log("result: "+ result);
      return result;
    } else {
      return (args.length == 0) ? null : args[0]; // was: $pick
    }
  },
  
  resolve: function(key) {
    switch(key) {
      case null:
      case 'nil':
      case 'null':
      case '':
        return null;
      
      case 'true':
        return true;
        
      case 'false':
        return false;
      
      // Not sure what to do with (what would be) Symbols
      case 'blank':
      case 'empty':
        return '';
      
      default:
        if((/^'(.*)'$/).test(key))      // Single quoted strings
          { return key.replace(/^'(.*)'$/, '$1'); }
          
        else if((/^"(.*)"$/).test(key)) // Double quoted strings
          { return key.replace(/^"(.*)"$/, '$1'); }
          
        else if((/^(\d+)$/).test(key)) // Integer...
          { return parseInt( key.replace(/^(\d+)$/ , '$1') ); }
          
        else if((/^(\d[\d\.]+)$/).test(key)) // Float...
          { return parseFloat( key.replace(/^(\d[\d\.]+)$/, '$1') ); }
          
        else if((/^\((\S+)\.\.(\S+)\)$/).test(key)) {// Ranges 
          // JavaScript doesn't have native support for those, so I turn 'em 
          // into an array of integers...
          var range = key.match(/^\((\S+)\.\.(\S+)\)$/),
              left  = parseInt(range[1]),
              right = parseInt(range[2]),
              arr   = [];
          // Check if left and right are NaN, if so try as characters
          if (isNaN(left) || isNaN(right)) {
            // TODO Add in error checking to make sure ranges are single 
            // character, A-Z or a-z, etc.
            left = range[1].charCodeAt(0);
            right = range[2].charCodeAt(0);

            var limit = right-left+1;
            for (var i=0; i<limit; i++) arr.push(String.fromCharCode(i+left)); 
          } else { // okay to make array
            var limit = right-left+1;
            for (var i=0; i<limit; i++) arr.push(i+left); 
          }
          return arr;
        } else {
          var result = this.variable(key);
          // console.log("Finding variable: "+ key)
          // console.log(Object.inspect(result))
          return result; 
        }
    }
  },
  
  findVariable: function(key) {
    for (var i=0; i < this.scopes.length; i++) {
      var scope = this.scopes[i];
      if( scope && typeof(scope[key]) !== 'undefined' ) {
        var variable = scope[key];
        if(typeof(variable) == 'function'){
          variable = variable.apply(this); 
          scope[key] = variable;
        }
        if(variable && this._isObject(variable) && ('toLiquid' in variable)) {
          variable = variable.toLiquid(); 
        }
        if(variable && this._isObject(variable) && ('setContext' in variable)){
          variable.setContext(self);
        }
        return variable;
      }
    };
//    console.log('findVariable("'+ key +'") is returning NULL')
    return null;
  },
  
  variable: function(markup) {
    //return this.scopes[0][key] || ''
    if(typeof markup != 'string') {
    //  console.log('markup('+ Object.inspect(markup) +') was unexpected, returning NULL')
      return null;
    }
      
    var parts       = markup.match( /\[[^\]]+\]|(?:[\w\-]\??)+/g ),
        firstPart   = parts.shift(),
        squareMatch = firstPart.match(/^\[(.*)\]$/);

    if(squareMatch)
      { firstPart = this.resolve( squareMatch[1] ); }
    
    var object = this.findVariable(firstPart),
        self = this;

    // Does 'pos' need to be scoped up here?
    if(object) {
      parts.each(function(part){
        // If object is a hash we look for the presence of the key and if its available we return it
        var squareMatch = part.match(/^\[(.*)\]$/);
        if(squareMatch) {
          var part = self.resolve( squareMatch[1] );
          // Where the hell does 'pos' come from?
          if( typeof(object[part]) == 'function'){ object[part] = object[part].apply(this); }// Array?
          object = object[part];
          if(self._isObject(object) && ('toLiquid' in object)){ object = object.toLiquid(); }
        } else {
          // Hash
          if( (self._isObject(object) || typeof(object) == 'hash') && (part in object)) {
            // if its a proc we will replace the entry in the hash table with the proc
            var res = object[part];
            if( typeof(res) == 'function'){ res = object[part] = res.apply(self) ; }
            if(self._isObject(res) && ('toLiquid' in res)){ object = res.toLiquid(); }
            else { object = res; }
          }
          // Array
          else if( (/^\d+$/).test(part) ) {
            var pos = parseInt(part);
            if( typeof(object[pos]) == 'function') { object[pos] = object[pos].apply(self); }
            if(self._isObject(object) && self._isObject(object[pos]) && ('toLiquid' in object[pos])) { object = object[pos].toLiquid(); }
            else { object  = object[pos]; }
          }
          // Some special cases. If no key with the same name was found we interpret following calls
          // as commands and call them on the current object if it exists
          else if( object && typeof(object[part]) == 'function' && ['length', 'size', 'first', 'last'].include(part) ) {
            object = object[part].apply(part);
            if('toLiquid' in object){ object = object.toLiquid(); }
          }
          // No key was present with the desired value and it wasn't one of the directly supported
          // keywords either. The only thing we got left is to return nil
          else {
            return object = null;
          }
          if(self._isObject(object) && ('setContext' in object)){ object.setContext(self); }
        }
      });
    }
    return object;
  },
  
  addFilters: function(filters) {
    filters = filters.flatten();
    filters.each(function(f){
      if(!this._isObject(f)){ throw ("Expected object but got: "+ typeof(f)) }
      this.strainer.addMethods(f);
    });
  },
  
  handleError: function(err) {
    this.errors.push(err);
    if(this.rethrowErrors){ throw err; }
    return "Liquid error: " + (err.message ? err.message : (err.description ? err.description : err));
  },

  _isObject: function(obj) {
    // typeof(null) == 'object'
    return obj != null && typeof(obj) == 'object';
  }

};

},{}],6:[function(require,module,exports){
var Liquid = {

  author: '<%= AUTHOR %>',
  version: '<%= VERSION %>',

  readTemplateFile: function(path) {
    throw ("This liquid context does not allow includes.");
  },
  
  registerFilters: function(filters) {
    Liquid.Template.registerFilter(filters);
  },
  
  parse: function(src) {
    return Liquid.Template.parse(src);
  }
  
};

require('./extensions')();
Liquid.extensions = require('./extensions').extensions;
require('./class').init_class(Liquid);

Liquid.Tag = Liquid.Class.extend(require('./tag'));
Liquid.Block = Liquid.Tag.extend(require('./block'));
Liquid.Document = Liquid.Block.extend(require('./document'));
Liquid.Strainer = Liquid.Class.extend(require('./strainer'));
require('./strainer').applyMethods(Liquid);

Liquid.Context = Liquid.Class.extend(require('./context'));
Liquid.Template = Liquid.Class.extend(require('./template'));
require('./template').applyMethods(Liquid);

Liquid.Variable = Liquid.Class.extend(require('./variable'));
Liquid.Condition = Liquid.Class.extend(require('./condition'));
require('./condition').applyMethods(Liquid);

Liquid.ElseCondition = Liquid.Condition.extend(require('./condition').ElseCondition);
Liquid.Drop = Liquid.Class.extend(require('./drop'));

require('./default_tags').registerDefaultTags(Liquid);
Liquid.Template.registerFilter(require('./default_filters'));

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Liquid;
  }
  exports.Liquid = Liquid;
}
if (typeof window !== 'undefined') {
  window.Liquid = Liquid;
}
},{"./block":2,"./class":3,"./condition":4,"./context":5,"./default_filters":7,"./default_tags":8,"./document":9,"./drop":10,"./extensions":11,"./strainer":12,"./tag":13,"./template":14,"./variable":15}],7:[function(require,module,exports){
var strftime = require('strftime');

// Standard Filters
module.exports = {
  
  _HTML_ESCAPE_MAP: {
    '&': '&amp;',
    '>': '&gt;',
    '<': '&lt;',
    '"': '&quot;',
    "'": '&#39;'
  },

  size: function(iterable) {
    // could this be done better?
    var length = 0;
    if (iterable['length']) {
      length = iterable.length;
    } else if (typeof iterable === 'object') {
      length = Object.keys(iterable).length; // need polyfill?
    }
    return length;
  },
  
  downcase: function(input) {
    return input.toString().toLowerCase();
  },
  
  upcase: function(input) {
    return input.toString().toUpperCase();
  },
  
  capitalize: function(input) {
    return input.toString().capitalize();
  },
  
  handleize: function(input) {
    return input.toString().replace(/\s/g, '-').toLowerCase();
  },
  
  escape: function(input) {
    var self = this;
    return input.replace(/[&<>"']/g, function(chr) {
      return self._HTML_ESCAPE_MAP[chr];
    });
  },

  h: function(input) {
    var self = this;
    return input.replace(/[&<>"']/g, function(chr) {
      return self._HTML_ESCAPE_MAP[chr];
    });
  },
  
  truncate: function(input, length, string) {
    if(!input || input == ''){ return ''; }
    length = length || 50;
    string = string || "...";

    var seg = input.slice(0, length);
    return (input.length > length ?
            input.slice(0, length) + string : 
            input);
  },
  
  truncatewords: function(input, words, string) {
    if(!input || input == ''){ return ''; }
    words = parseInt(words || 15);
    string = string || '...';
    var wordlist = input.toString().split(" "),
        l = Math.max((words), 0);
    return (wordlist.length > l) ? wordlist.slice(0,l).join(' ') + string : input;
  },

  truncate_words: function(input, words, string) {
    if(!input || input == ''){ return ''; }
    words = parseInt(words || 15);
    string = string || '...';
    var wordlist = input.toString().split(" "),
        l = Math.max((words), 0);
    return (wordlist.length > l) ? wordlist.slice(0,l).join(' ') + string : input;
  },
  
  strip_html: function(input) {
    return input.toString().replace(/<.*?>/g, '');
  },
  
  strip_newlines: function(input) {
    return input.toString().replace(/\n/g, '')
  },
  
  join: function(input, separator) {
    separator = separator ||  ' ';
    return input.join(separator);
  },

  split: function(input, separator) {
    separator = separator ||  ' ';
    return input.split(separator);
  },
  
  sort: function(input) {
    return input.sort();
  },
  
  reverse: function(input) {
    return input.reverse();
  },
  
  replace: function(input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, 'g'), replacement);
  },
  
  replace_first: function(input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, ""), replacement);
  },
  
  newline_to_br: function(input) {
    return input.toString().replace(/\n/g, "<br/>\n");
  },
  
  date: function(input, format) {
    var date;
    if( input instanceof Date ){ date = input; }
    if(!(date instanceof Date) && input == 'now'){ date = new Date(); }
    if(!(date instanceof Date) && typeof(input) == 'number'){ date = new Date(input * 1000); }
    if(!(date instanceof Date) && typeof(input) == 'string'){ date = new Date(Date.parse(input));}
    if(!(date instanceof Date)){ return input; } // Punt
    return strftime(format, date);
  },
  
  first: function(input) {
    return input[0];
  },
  
  last: function(input) {
    input = input;
    return input[input.length -1];
  },

  minus: function(input, number) {
    return (Number(input) || 0) - (Number(number) || 0);
  },

  plus: function(input, number) {
    return (Number(input) || 0) + (Number(number) || 0);
  },

  times: function(input, number) {
    return (Number(input) || 0) * (Number(number) || 0);
  },

  divided_by: function(input, number) {
    return (Number(input) || 0) / (Number(number) || 0);
  },

  modulo: function(input, number) {
    return (Number(input) || 0) % (Number(number) || 0);
  },

  map: function(input, property) {
    input = input || [];
    var results = [];
    for (var i = 0; i < input.length; i++) {
      results.push(input[i][property]);
    }
    return results;
  },
  escape_once: function(input) {
    var self = this;
    return input.replace(/["><']|&(?!([a-zA-Z]+|(#\d+));)/g, function(chr) {
      return self._HTML_ESCAPE_MAP[chr];
    });
  },

  remove: function(input, string) {
    return input.toString().replace(new RegExp(string, 'g'), '');
  },

  remove_first: function(input, string) {
    return input.toString().replace(string, '');
  },

  prepend: function(input, string) {
    return '' + (string || '').toString() + (input || '').toString();
  },

  append: function(input, string) {
    return '' + (input || '').toString() + (string || '').toString();
  }

};

},{"strftime":1}],8:[function(require,module,exports){
module.exports.registerDefaultTags = function (Liquid) {
  var hackObjectEach = function(fun /*, thisp*/) {
    if (typeof fun != "function")
      throw 'Object.each requires first argument to be a function';
  
    var i = 0;
    var thisp = arguments[1];
    for (var p in this) {
      var value = this[p], pair = [p, value];
      pair.key = p;
      pair.value = value;
      fun.call(thisp, pair, i, this);
      i++;
    }
  
    return null;
  };
  
  // Default Tags...
  Liquid.Template.registerTag( 'assign', Liquid.Tag.extend({
  
    tagSyntax: /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*(.+)/,
    
    init: function(tagName, markup, tokens) {
      var parts = markup.match(this.tagSyntax);
  
      if( parts ) {
        this.to   = parts[1];
        this.from = parts[2];
      } else {
        throw ("Syntax error in 'assign' - Valid syntax: assign [var] = [source]");
      }
      this._super(tagName, markup, tokens)
    },
    render: function(context) {
      var value = new Liquid.Variable(this.from);
      context.scopes.last()[this.to.toString()] = value.render(context);
      return '';
    }
  }));
  
  // Cache is just like capture, but it inserts into the root scope...
  Liquid.Template.registerTag( 'cache', Liquid.Block.extend({
    tagSyntax: /(\w+)/,
  
    init: function(tagName, markup, tokens) {
      var parts = markup.match(this.tagSyntax)
      if( parts ) {
        this.to = parts[1];
      } else {
        throw ("Syntax error in 'cache' - Valid syntax: cache [var]");
      }
      this._super(tagName, markup, tokens);
    },
    render: function(context) {
      var output = this._super(context);
      context.scopes.last()[this.to] = [output].flatten().join('');
      return '';
    }
  }));
  
  
  Liquid.Template.registerTag( 'capture', Liquid.Block.extend({
    tagSyntax: /(\w+)/,
  
    init: function(tagName, markup, tokens) {
      var parts = markup.match(this.tagSyntax)
      if( parts ) {
        this.to = parts[1];
      } else {
        throw ("Syntax error in 'capture' - Valid syntax: capture [var]");
      }
      this._super(tagName, markup, tokens);
    },
    render: function(context) {
      var output = this._super(context);
      context.scopes.last()[this.to.toString()] = [output].flatten().join('');
      return '';
    }
  }));
  
  Liquid.Template.registerTag( 'case', Liquid.Block.extend({
  
    tagSyntax     : /("[^"]+"|'[^']+'|[^\s,|]+)/,
    tagWhenSyntax : /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/,
  
    init: function(tagName, markup, tokens) {
      this.blocks = [];
      this.nodelist = [];
  
      var parts = markup.match(this.tagSyntax)
      if( parts ) {
        this.left = parts[1];
      } else {
        throw ("Syntax error in 'case' - Valid syntax: case [condition]");
      }
  
      this._super(tagName, markup, tokens);
    },
    unknownTag: function(tag, markup, tokens) {
      switch(tag) {
        case 'when':
          this.recordWhenCondition(markup);
          break;
        case 'else':
          this.recordElseCondition(markup);
          break;
        default:
          this._super(tag, markup, tokens);
      }
  
    },
    render: function(context) {
      var self = this,
          output = [],
          execElseBlock = true;
  
      context.stack(function(){
        for (var i=0; i < self.blocks.length; i++) {
          var block = self.blocks[i];
          if( block.isElse  ) {
            if(execElseBlock == true){ output = [output, self.renderAll(block.attachment, context)].flatten(); }
            return output;
          } else if( block.evaluate(context) ) {
            execElseBlock = false;
            output = [output, self.renderAll(block.attachment, context)].flatten();
          }
        };
      });
  
      return output;
    },
    recordWhenCondition: function(markup) {
      while(markup) {
        var parts = markup.match(this.tagWhenSyntax);
        if(!parts) {
          throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ");
        }
  
        markup = parts[2];
  
        var block = new Liquid.Condition(this.left, '==', parts[1]);
        this.blocks.push( block );
        this.nodelist = block.attach([]);
      }
    },
    recordElseCondition: function(markup) {
      if( (markup || '').strip() != '') {
        throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")
      }
      var block = new Liquid.ElseCondition();
      this.blocks.push(block);
      this.nodelist = block.attach([]);
    }
  }));
  
  Liquid.Template.registerTag( 'comment', Liquid.Block.extend({
    render: function(context) {
      return '';
    }
  }));
  
  Liquid.Template.registerTag( 'cycle', Liquid.Tag.extend({
  
    tagSimpleSyntax: /"[^"]+"|'[^']+'|[^\s,|]+/,
    tagNamedSyntax:  /("[^"]+"|'[^']+'|[^\s,|]+)\s*\:\s*(.*)/,
  
    init: function(tag, markup, tokens) {
      var matches, variables;
      // Named first...
      matches = markup.match(this.tagNamedSyntax);
      if(matches) {
        this.variables = this.variablesFromString(matches[2]);
        this.name = matches[1];
      } else {
        // Try simple...
        matches = markup.match(this.tagSimpleSyntax);
        if(matches) {
          this.variables = this.variablesFromString(markup);
          this.name = "'"+ this.variables.toString() +"'";
        } else {
          // Punt
          throw ("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]");
        }
      }
      this._super(tag, markup, tokens);
    },
  
    render: function(context) {
      var self   = this,
          key    = context.get(self.name),
          output = '';
  
      if(!context.registers['cycle']) {
        context.registers['cycle'] = {};
      }
  
      if(!context.registers['cycle'][key]) {
        context.registers['cycle'][key] = 0;
      }
  
      context.stack(function(){
        var iter    = context.registers['cycle'][key],
            results = context.get( self.variables[iter] );
        iter += 1;
        if(iter == self.variables.length){ iter = 0; }
        context.registers['cycle'][key] = iter;
        output = results;
      });
  
      return output;
    },
  
    variablesFromString: function(markup) {
      return markup.split(',').map(function(varname){
        var match = varname.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)\s*/);
        return (match[1]) ? match[1] : null
      });
    }
  }));
  
  Liquid.Template.registerTag( 'for', Liquid.Block.extend({
    tagSyntax: /(\w+)\s+in\s+((?:\(?[\w\-\.\[\]]\)?)+)/,
  
    init: function(tag, markup, tokens) {
      var matches = markup.match(this.tagSyntax);
      if(matches) {
        this.variableName = matches[1];
        this.collectionName = matches[2];
        this.name = this.variableName +"-"+ this.collectionName;
        this.attributes = {};
        var attrmarkup = markup.replace(this.tagSyntax, '');
        var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
        if(attMatchs) {
          attMatchs.each(function(pair){
            pair = pair.split(":");
            this.attributes[pair[0].strip()] = pair[1].strip();
          }, this);
        }
      } else {
        throw ("Syntax error in 'for loop' - Valid syntax: for [item] in [collection]");
      }
      this._super(tag, markup, tokens);
    },
  
    render: function(context) {
      var self       = this,
          output     = [],
          collection = (context.get(this.collectionName) || []),
          range      = [0, collection.length];
  
      if(!context.registers['for']){ context.registers['for'] = {}; }
  
      if(this.attributes['limit'] || this.attributes['offset']) {
        var offset   = 0,
            limit    = 0,
            rangeEnd = 0,
            segment = null;
  
        if(this.attributes['offset'] == 'continue')
          { offset = context.registers['for'][this.name]; }
        else
          { offset = context.get( this.attributes['offset'] ) || 0; }
        
        limit = context.get( this.attributes['limit']);
        
        rangeEnd = (limit) ? offset + limit : collection.length;
        range = [ offset, rangeEnd ];
        
        // Save the range end in the registers so that future calls to
        // offset:continue have something to pick up
        context.registers['for'][this.name] = rangeEnd;
      }
  
      // Assumes the collection is an array like object...
      // segment = collection.slice(range[0], range[1]);
      // Stewie: Don't assume incase we want to loop a hash like object
      if (typeof collection === 'object') {
        if (Array.isArray(collection)) {
          segment = collection.slice(range[0], range[1]);
        } else {
          segment = collection;
          // Slice object ???
          // needs hasOwnProperty
          // segment = {}
          // var i = 0;
          // for (var k in collection) {
          //   if (i >= range[0] && (i < range[1] || range[1] == undefined)) {
          //     segment[k] = collection[k];
          //   }
          //   i++;
          // }
        }
      }
      
      if(!segment || segment.length == 0){ return ''; }
          
      context.stack(function(){
        if (Array.isArray(segment)) {
          var length = segment.length;
          segment.each(function(item, index){
            context.set( self.variableName, item );
            context.set( 'forloop', {
              name:   self.name,
              length: length,
              index:  (index + 1),
              index0: index,
              rindex: (length - index),
              rindex0:(length - index - 1),
              first:  (index == 0),
              last:   (index == (length - 1))
            });
            output.push( (self.renderAll(self.nodelist, context) || []).join('') );
          });
        } else {
          var length = Object.keys(segment).length;  
          var index = 0;  
          for (var key in segment) {
            var item = segment[key];
            context.set( self.variableName, item );
            context.set( 'forloop', {
              name:   self.name,
              length: length,
              index:  (index + 1),
              index0: index,
              rindex: (length - index),
              rindex0:(length - index - 1),
              first:  (index == 0),
              last:   (index == (length - 1))
            });
            output.push( (self.renderAll(self.nodelist, context) || []).join('') );
            index++;
          }
        }
      });
  
      return [output].flatten().join('');
    }
  }));
  
  Liquid.Template.registerTag( 'if', Liquid.Block.extend({
  
    tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/,
  
    init: function(tag, markup, tokens) {
      this.nodelist = [];
      this.blocks = [];
      this.pushBlock('if', markup);
      this._super(tag, markup, tokens);
    },
  
    unknownTag: function(tag, markup, tokens) {
      if( ['elsif', 'else'].include(tag) ) {
        this.pushBlock(tag, markup);
      } else {
        this._super(tag, markup, tokens);
      }
    },
  
    render: function(context) {
      var self = this,
          output = '';
      context.stack(function(){
        for (var i=0; i < self.blocks.length; i++) {
          var block = self.blocks[i];
          if( block.evaluate(context) ) {
            output = self.renderAll(block.attachment, context);
            return;
          }
        };
      })
      return [output].flatten().join('');
    },
  
    pushBlock: function(tag, markup) {
      var block;
      if(tag == 'else') {
        block = new Liquid.ElseCondition();
      } else {
        var expressions = markup.split(/\b(and|or)\b/).reverse(),
            expMatches  = expressions.shift().match( this.tagSyntax );
  
        if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }
  
        var condition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);
  
        while(expressions.length > 0) {
          var operator = expressions.shift(),
              expMatches  = expressions.shift().match( this.tagSyntax );
          if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }
  
          var newCondition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);
          newCondition[operator](condition);
          condition = newCondition;
        }
  
        block = condition;
      }
      block.attach([]);
      this.blocks.push(block);
      this.nodelist = block.attachment;
    }
  }));
  
  Liquid.Template.registerTag( 'ifchanged', Liquid.Block.extend({
  
    render: function(context) {
      var self = this,
          output = '';
      context.stack(function(){
        var results = self.renderAll(self.nodelist, context).join('');
        if(results != context.registers['ifchanged']) {
          output = results;
          context.registers['ifchanged'] = output;
        }
      });
      return output;
    }
  }));
  
  Liquid.Template.registerTag( 'include', Liquid.Tag.extend({
  
    tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/,
  
    init: function(tag, markup, tokens) {
      var matches = (markup || '').match(this.tagSyntax);
      if(matches) {
        this.templateName = matches[1];
        this.templateNameVar = this.templateName.substring(1, this.templateName.length - 1);
        this.variableName = matches[3];
        this.attributes = {};
  
        var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
        if(attMatchs) {
          attMatchs.each(function(pair){
            pair = pair.split(":");
            this.attributes[pair[0].strip()] = pair[1].strip();
          }, this);
        }
      } else {
        throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]");
      }
      this._super(tag, markup, tokens);
    },
  
    render: function(context) {
      var self     = this,
          source   = Liquid.readTemplateFile( context.get(this.templateName) ),
          partial  = Liquid.parse(source),
          variable = context.get((this.variableName || this.templateNameVar)),
          output   = '';
      context.stack(function(){
        // HACK Until we get Object.each working right
        self.attributes.each = hackObjectEach;
        self.attributes.each(function(pair){
          context.set(pair.key, context.get(pair.value));
        })
  
        if(variable instanceof Array) {
          output = variable.map(function(variable){
            context.set( self.templateNameVar, variable );
            return partial.render(context);
          });
        } else {
          context.set(self.templateNameVar, variable);
          output = partial.render(context);
        }
      });
      output = [output].flatten().join('');
      return output
    }
  }));
  
  Liquid.Template.registerTag( 'unless', Liquid.Template.tags['if'].extend({
  
    render: function(context) {
      var self = this,
          output = '';
      context.stack(function(){
        // The first block is called if it evaluates to false...
        var block = self.blocks[0];
        if( !block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
        // the rest are the same..
        for (var i=1; i < self.blocks.length; i++) {
          var block = self.blocks[i];
          if( block.evaluate(context) ) {
            output = self.renderAll(block.attachment, context);
            return;
          }
        };
      })
      return [output].flatten().join('');
    }
  }));
  
  Liquid.Template.registerTag( 'raw', Liquid.Block.extend({
    // Override the `parse` function of Liquid.Block to simply pass along all tokens
    // to render directly (rather than parsing them) until we reach {% endraw %}
    parse: function(tokens) {
      if (!this.nodelist) this.nodelist = [];
      this.nodelist.clear();
  
      var token = tokens.shift();
      tokens.push('');
      while(tokens.length) {
  
        if( /^\{\%/.test(token) ) { // It's a tag...
          var tagParts = token.match(/^\{\%\s*(\w+)\s*(.*)?\%\}$/);
  
          if(tagParts) {
            // if we found the proper block delimitor just end parsing here and let
            // the outer block proceed
            if( this.blockDelimiter == tagParts[1] ) {
              this.endTag();
              return;
            }
          }
        }
  
        // As long as we didn't hit {% endraw %}, just render whatever we've got
        // without processing it.
        this.nodelist.push( token || '');
        token = tokens.shift(); // Assign the next token to loop again...
      }
      this.assertMissingDelimitation();
    },
  
    render: function(context) {
      return this.nodelist.join('');
    }
  }));
};
},{}],9:[function(require,module,exports){
module.exports = {

  init: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
    // Documents don't need to assert this...
  }
};
},{}],10:[function(require,module,exports){
module.exports = {
  setContext: function(context) {
    this.context = context;
  },
  beforeMethod: function(method) {
    
  },
  invokeDrop: function(method) {
    var results = this.beforeMethod();
    if( !results && (method in this) )
      { results = this[method].apply(this); }
    return results;
  },
  hasKey: function(name) {
    return true;
  }
};

},{}],11:[function(require,module,exports){
module.exports = function () {
  
  // Array.indexOf
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj) {
      for (var i=0; i<this.length; i++) {
        if (this[i] == obj) return i;
      }
      
      return -1;
    };
  }
  
  // Array.clear
  if (!Array.prototype.clear) {
    Array.prototype.clear = function() {
      //while (this.length > 0) this.pop();
      this.length = 0;
    };
  }
  
  // Array.map
  if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
      var len = this.length;
      if (typeof fun != "function")
        throw 'Array.map requires first argument to be a function';
  
      var res = new Array(len);
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in this)
          res[i] = fun.call(thisp, this[i], i, this);
      }
  
      return res;
    };
  }
  
  // Array.first
  if (!Array.prototype.first) {
    Array.prototype.first = function() {
      return this[0];
    };
  }
  
  // Array.last
  if (!Array.prototype.last) {
    Array.prototype.last = function() {
      return this[this.length - 1];
    };
  }
  
  // Array.flatten
  if (!Array.prototype.flatten) {
    Array.prototype.flatten = function() {
      var len = this.length;
      var arr = [];
      for (var i = 0; i < len; i++) {
        // TODO This supposedly isn't safe in multiple frames;
        // http://stackoverflow.com/questions/767486/how-do-you-check-if-a-variable-is-an-array-in-javascript
        // http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array
        if (this[i] instanceof Array) {
          arr = arr.concat(this[i]);
        } else {
          arr.push(this[i]);
        }
      }
  
      return arr;
    };
  }
  
  // Array.each
  if (!Array.prototype.each) {
    Array.prototype.each = function(fun /*, thisp*/) {
      var len = this.length;
      if (typeof fun != "function")
        throw 'Array.each requires first argument to be a function';
  
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in this)
          fun.call(thisp, this[i], i, this);
      }
  
      return null;
    };
  }
  
  // Array.include
  if (!Array.prototype.include) {
    Array.prototype.include = function(arg) {
      var len = this.length;
  
      return this.indexOf(arg) >= 0;
      for (var i = 0; i < len; i++) {
        if (arg == this[i]) return true;
      }
  
      return false;
    };
  }
  
  
  // String.capitalize
  if (!String.prototype.capitalize) {
    String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    };
  }
  
  // String.strip
  if (!String.prototype.strip) {
    String.prototype.strip = function() {
      return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
  }
};

// NOTE Having issues conflicting with jQuery stuff when setting Object 
// prototype settings; instead add into Liquid.Object.extensions and use in 
// the particular location; can add into Object.prototype later if we want.
var extensions = {};
extensions.object = {};

// Object.update
extensions.object.update = function(newObj) {
  for (var p in newObj) {
    this[p] = newObj[p];
  }

  return this;
};
//if (!Object.prototype.update) {
//  Object.prototype.update = Liquid.extensions.object.update
//}

// Object.hasKey
extensions.object.hasKey = function(arg) {
  return !!this[arg];
};
//if (!Object.prototype.hasKey) {
//  Object.prototype.hasKey = Liquid.extensions.object.hasKey
//}

// Object.hasValue
extensions.object.hasValue = function(arg) {
  for (var p in this) {
    if (this[p] == arg) return true;
  }

  return false;
};
//if (!Object.prototype.hasValue) {
//  Object.prototype.hasValue = Liquid.extensions.object.hasValue
//}

module.exports.extensions = extensions;
},{}],12:[function(require,module,exports){
module.exports = {

  init: function(context) {
    this.context = context;
  },
  
  respondTo: function(methodName) {
    methodName = methodName.toString();
    if (methodName.match(/^__/)) return false;
    if (Liquid.Strainer.requiredMethods.include(methodName)) return false;
    return (methodName in this);
  }
};

module.exports.applyMethods = function (Liquid) {
  Liquid.Strainer.filters = {};
  
  Liquid.Strainer.globalFilter = function(filters) {
    for (var f in filters) {
      Liquid.Strainer.filters[f] = filters[f];
    }
  }
  
  // Array of methods to keep...
  Liquid.Strainer.requiredMethods = ['respondTo', 'context']; 
  
  Liquid.Strainer.create = function(context) {
    var strainer = new Liquid.Strainer(context);
    for (var f in Liquid.Strainer.filters) {
      //console.log('f', f);
      //console.log('Liquid.Strainer.filters[f]', Liquid.Strainer.filters[f]);
      strainer[f] = Liquid.Strainer.filters[f];
    }
    return strainer;
  }
};
},{}],13:[function(require,module,exports){
module.exports = {

  init: function(tagName, markup, tokens) {
    this.tagName = tagName;
    this.markup = markup;
    this.nodelist = this.nodelist || [];
    this.parse(tokens);
  },
  
  parse: function(tokens) {
//      console.log("Tag.parse not implemented...");
  },
  
  render: function(context) {
    return '';
  }
  
  // From ruby: def name; self.class.name.downcase; end
};
},{}],14:[function(require,module,exports){
module.exports = {

  init: function() {
    this.root = null;
    this.registers = {};
    this.assigns = {};
    this.errors = [];
    this.rethrowErrors = false;
  },

  parse: function(src) {
    this.root = new Liquid.Document( Liquid.Template.tokenize(src) );
    return this;
  },

  render: function() {
    if(!this.root){ return ''; }
    var args = {
      ctx: arguments[0],
      filters: arguments[1],
      registers: arguments[2]
    }
    var context = null;
    
    if(args.ctx instanceof Liquid.Context ) {
      context = args.ctx;
      this.assigns = context.assigns;
      this.registers = context.registers;
    } else {
      if(args.ctx){ 
        // HACK Apply from Liquid.extensions.object; extending Object sad.  
        //this.assigns.update(args.ctx); 
        Liquid.extensions.object.update.call(this.assigns, args.ctx); 
      }
      if(args.registers){
        // HACK Apply from Liquid.extensions.object; extending Object sad.  
        //this.registers.update(args.registers);
        Liquid.extensions.object.update.call(this.registers, args.registers);
      }
      context = new Liquid.Context(this.assigns, this.registers, this.rethrowErrors)
    }
    
    if(args.filters){ context.addFilters(arg.filters); }
    
    try {
      return this.root.render(context).join('');
    } finally {
      this.errors = context.errors;
    }
  },
  
  renderWithErrors: function() {
    var savedRethrowErrors = this.rethrowErrors;
    this.rethrowErrors = true;
    var res = this.render.apply(this, arguments);
    this.rethrowErrors = savedRethrowErrors;
    return res;
  }
};

module.exports.applyMethods = function (Liquid) {
  Liquid.Template.tags = {};
  
  Liquid.Template.registerTag = function(name, klass) {
    Liquid.Template.tags[ name ] = klass;
  }
  
  Liquid.Template.registerFilter = function(filters) {
    Liquid.Strainer.globalFilter(filters)
  }
  
  Liquid.Template.tokenize = function(src) {
    var tokens = src.split( /(\{\%.*?\%\}|\{\{.*?\}\}?)/ );
    // removes the rogue empty element at the beginning of the array
    if(tokens[0] == ''){ tokens.shift(); }
  //  console.log("Source tokens:", tokens)
    return tokens;
  }
  
  
  Liquid.Template.parse =  function(src) {
    return (new Liquid.Template()).parse(src);
  }
};
},{}],15:[function(require,module,exports){
module.exports = {

  init: function(markup) {
    this.markup = markup;
    this.name = null;
    this.filters = [];
    var self = this;
    var match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/);
    if( match ) {
      this.name = match[1];
      var filterMatches = markup.match(/\|\s*(.*)/);
      if(filterMatches) {
        var filters = filterMatches[1].split(/\|/);
        filters.each(function(f){
          var matches = f.match(/\s*(\w+)/);
          if(matches) {
            var filterName = matches[1];
            var filterArgs = [];
            (f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) || []).flatten().each(function(arg){
              var cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/);
              if(cleanupMatch)
                { filterArgs.push( cleanupMatch[1] );}
            });
            self.filters.push( [filterName, filterArgs] );
          }
        });
      }
    }
  },
  
  render: function(context) {
    if(this.name == null){ return ''; }
    var output = context.get(this.name);
    this.filters.each(function(filter) {
      var filterName = filter[0],
          filterArgs = (filter[1] || []).map(function(arg){
            return context.get(arg);
          });
      filterArgs.unshift(output); // Push in input value into the first argument spot...
      output = context.invoke(filterName, filterArgs);
    });

    return output;
  }
};

},{}]},{},[6]);
