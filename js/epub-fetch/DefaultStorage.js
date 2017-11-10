define(['./DirectoryAccessor', './FilePrimitives'], function(DirectoryAccessor, FilePrimitives) {

  function requestFs() {
    return FilePrimitives.requestFS();
  }

  function DefaultStorage() {
    var self = this;
    self._fileSystem = null;

    DirectoryAccessor.call(self, requestFs().then(function (fs) {
      self._fileSystem = fs;
      return fs.root;
    }, console.error.bind(console)));
  }

  var proto = new DirectoryAccessor(null);
  for (var p in proto) {
    if (proto.hasOwnProperty(p)) {
      delete proto[p];
    }
  }

  DefaultStorage.prototype = proto;
  DefaultStorage.prototype.constructor = DefaultStorage;

  DefaultStorage.prototype.getFs = function() {
    return this._fileSystem;
  };

  return new DefaultStorage();
});
