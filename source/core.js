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

if(!(new Date()).strftime) {
  Date.prototype.strftime = require('strftime');
};

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Liquid;
  }
  exports.Liquid = Liquid;
}
window.Liquid = Liquid;