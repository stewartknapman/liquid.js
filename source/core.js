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
Liquid.Strainer.filters = require('./strainer').filters;
Liquid.Strainer.globalFilter = require('./strainer').globalFilter;
Liquid.Strainer.requiredMethods = require('./strainer').requiredMethods;
Liquid.Strainer.create = require('./strainer').create;

Liquid.Context = Liquid.Class.extend(require('./context'));

Liquid.Template = Liquid.Class.extend(require('./template'));
Liquid.Template.tags = require('./template').tags;
Liquid.Template.registerTag = require('./template').registerTag;
Liquid.Template.registerFilter = require('./template').registerFilter;
Liquid.Template.tokenize = require('./template').tokenize;
Liquid.Template.parse = require('./template').parse;

Liquid.Variable = Liquid.Class.extend(require('./variable'));

Liquid.Condition = Liquid.Class.extend(require('./condition'));
Liquid.Condition.operators = require('./condition').operators;
Liquid.ElseCondition = Liquid.Condition.extend(require('./condition').ElseCondition);

Liquid.Drop = Liquid.Class.extend(require('./drop'));

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