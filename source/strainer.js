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