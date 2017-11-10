define(['./DefaultStorage', './DirectoryAccessor', './Utils', './FilePrimitives', './FileUtils'],
  function(DefaultStorage, DirectoryAccessor, Utils, FilePrimitives, FileUtils) {

  function FileStorage() {
    this._root = null;
    this._eventTarget = $({});

    this.setRootDirectory(null);
    FilePrimitives.addDetachedListener(this._onDeviceDetached.bind(this));
  }

  FileStorage.prototype._onDeviceDetached = function () {
    var self = this;
    this.dirExists('.').done(function (rootExists) {
      if (!rootExists) {
        self.setRootDirectory(null);
        self._eventTarget.trigger('rootEjected');
      }
    });
  };

  FileStorage.prototype._notifyRootChanged = function() {
    this._eventTarget.trigger('rootChanged');
  };

  FileStorage.prototype._setRoot = function(root) {
    if (!root.equals(this._root)) {
      this._root = root;
      this._notifyRootChanged();
    }
  };

  FileStorage.prototype.on = function() {
    this._eventTarget.on.apply(this._eventTarget, _.toArray(arguments));
  };

  FileStorage.prototype.off = function() {
    this._eventTarget.off.apply(this._eventTarget, _.toArray(arguments));
  };

  FileStorage.prototype.setRootDirectory = function(dirEntryId) {
    if (dirEntryId) {
      var self = this;
      FilePrimitives.getRootBySetting(dirEntryId).then(function(root) {
        self._setRoot(root);
      }).fail(function() {
        self._eventTarget.trigger('rootEjected');
      });
    } else {
      // Use the sandboxed Chrome file system for storage
      // if no other directory is specified.
      this._setRoot(DefaultStorage);
    }
  };

  // Delegate all DirectoryAccessor methods to the current root
  var dirAccessorProto = DirectoryAccessor.prototype;
  var fileStorageProto = FileStorage.prototype;
  Object.keys(dirAccessorProto).forEach(function (prop) {
    if (typeof dirAccessorProto[prop] === 'function') {
      fileStorageProto[prop] = function () {
        return this._root[prop].apply(this._root, _.toArray(arguments));
      };
    }
  });

  FileStorage.prototype.settingToFilePath = function (setting) {
    return FilePrimitives.settingToFilePath(setting);
  }

  FileStorage.prototype.browseDirectory = function (currentEntryId) {
    return FilePrimitives.browseDirectory(currentEntryId);
  }

  FileStorage.prototype.supportsLocationSelection = function() {
    return FilePrimitives.supportsLocationSelection();
  };

  FileStorage.prototype.fileSystemName = function () {
    return FilePrimitives.fileSystemName();
  };

  FileStorage.prototype.removeTmpFiles = function () {
    return DefaultStorage.removeDir('/tmp');
  }

  FileStorage.prototype.usesInternalStorage = function() {
    return this._root === DefaultStorage;
  };

  FileStorage.prototype.ensureFileIsOnInternalStorage = function (path) {
    if (this.usesInternalStorage()) {
      return $.when(path, false);
    }

    var ext = path.substring(path.lastIndexOf('.'));
    var tmpFile = '/tmp/' + Date.now().getTime() + ext;
    return $.when(
      this.getFileEntry(path, false),
      DefaultStorage.getFileEntry(tmpFile, true))
        .then(FileUtils.copy)
        .then(function () {
          return $.when(tmpFile, true);
        });
  }

  return new FileStorage();
});
