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

require('./extensions')(Liquid);
require('./class')(Liquid);
require('./tag')(Liquid);
require('./block')(Liquid);
require('./document')(Liquid);
require('./strainer')(Liquid);
require('./context')(Liquid);
require('./template')(Liquid);
require('./variable')(Liquid);
require('./condition')(Liquid);
require('./drop')(Liquid);
require('./default_tags')(Liquid);
require('./default_filters')(Liquid);

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Liquid;
  }
  exports.Liquid = Liquid;
}
if (typeof window !== 'undefined') {
  window.Liquid = Liquid;
}