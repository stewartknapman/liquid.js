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

},{}],4:[function(require,module,exports){
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

require('./class').init_class(Liquid);
Liquid.Tag = Liquid.Class.extend(require('./tag'));
Liquid.Block = Liquid.Tag.extend(require('./block'));
Liquid.Document = Liquid.Block.extend(require('./document'));

Liquid.Strainer = Liquid.Class.extend(require('./strainer'));
Liquid.Strainer.filters = require('./strainer').filters;
Liquid.Strainer.globalFilter = require('./strainer').globalFilter;
Liquid.Strainer.requiredMethods = require('./strainer').requiredMethods;
Liquid.Strainer.create = require('./strainer').create;

Liquid.Context = Liquid.Class.extend(require('./context'));
Liquid.Template = Liquid.Class.extend(require('./template'));

// module.exports = {

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
},{"./block":1,"./class":2,"./context":3,"./document":5,"./strainer":6,"./tag":7,"./template":8}],5:[function(require,module,exports){
module.exports = {

  init: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
    // Documents don't need to assert this...
  }
};
},{}],6:[function(require,module,exports){
var Strainer = {

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
module.exports = Strainer;

module.exports.filters = {};

module.exports.globalFilter = function(filters) {
  for (var f in filters) {
    Liquid.Strainer.filters[f] = filters[f];
  }
}

// Array of methods to keep...
module.exports.requiredMethods = ['respondTo', 'context']; 

module.exports.create = function(context) {
  var strainer = new Liquid.Strainer(context);
  for (var f in Liquid.Strainer.filters) {
    //console.log('f', f);
    //console.log('Liquid.Strainer.filters[f]', Liquid.Strainer.filters[f]);
    strainer[f] = Liquid.Strainer.filters[f];
  }
  return strainer;
}
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
var Template = {

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


Template.tags = {};

Template.registerTag = function(name, klass) {
  Liquid.Template.tags[ name ] = klass;
}

Template.registerFilter = function(filters) {
  Liquid.Strainer.globalFilter(filters)
}

Template.tokenize = function(src) {
  var tokens = src.split( /(\{\%.*?\%\}|\{\{.*?\}\}?)/ );
  // removes the rogue empty element at the beginning of the array
  if(tokens[0] == ''){ tokens.shift(); }
//  console.log("Source tokens:", tokens)
  return tokens;
}


Template.parse =  function(src) {
  return (new Liquid.Template()).parse(src);
}

module.exports = Template;
},{}]},{},[4]);
