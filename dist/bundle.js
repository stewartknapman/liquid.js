(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

//= require "extensions"
//= require "class"
//= require "tag"
//= require "block"
//= require "document"
//= require "strainer"
//= require "context"
//= require "template"
//= require "variable"
//= require "condition"
//= require "drop"
//= require "default_tags"
//= require "default_filters"


//= require <strftime>
//= require <split>

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Liquid;
  }
  exports.Liquid = Liquid;
}
window.Liquid = Liquid;
},{"./block":1,"./class":2,"./condition":3,"./context":4,"./default_filters":6,"./default_tags":7,"./document":8,"./drop":9,"./extensions":10,"./strainer":11,"./tag":12,"./template":13,"./variable":14}],6:[function(require,module,exports){
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
    return date.strftime(format);
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

},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
module.exports = {

  init: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
    // Documents don't need to assert this...
  }
};
},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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

},{}]},{},[5]);
