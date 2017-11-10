define(['./Utils'], function(Utils) {

  function FileWriter(writer) {
    this._writer = writer;
    Object.defineProperty(this, 'length', {
      get: function () {
        return this._writer.length;
      }
    });
  }

  function asBlob(buffer) {
    return Utils.bufferToBlob(buffer, 'application/octet-stream')
  }

  FileWriter.prototype.write = function(data) {
    var defer = $.Deferred();
    this._writer.onwrite = defer.resolve;
    this._writer.onerror = defer.reject;

    this._writer.write(asBlob(data));

    return defer.promise();
  };

  FileWriter.prototype.start = function(startByte) {
    this._writer.seek(startByte || 0);
  };

  function DirectoryAccessor(dirEntryPromise) {
    var self = this;
    this._init = $.when(dirEntryPromise).then(function (dirEntry) {
      self._root = dirEntry;
    });
  }

  DirectoryAccessor.prototype.equals = function(other) {
    return other && this._root &&
        this._root.filesystem.name === other._root.filesystem.name &&
        this._root.fullPath === other._root.fullPath;
  };

  DirectoryAccessor.prototype.getFileEntry = function(path, create) {
    var pathSegments = this._normalize(path).split('/');

    return this.mkdirs(_.initial(pathSegments))
      .then(function(dir) {
        return Utils.deferize(dir.getFile).call(dir, _.last(pathSegments), {
          create: create
        });
      });
  };

  DirectoryAccessor.prototype.getFile = function(path, create) {
    return this.getFileEntry(path, create)
      .then(function (entry) {
        return Utils.deferize(entry.file).call(entry);
      });
  };

  DirectoryAccessor.prototype.getFileUri = function(path) {
    return this.getFileEntry(path, false)
      .then(function(entry) {
        return entry.toURL();
      });
  };

  DirectoryAccessor.prototype.getFileWriter = function(path) {
    return this.getFileEntry(path, true)
      .then(function(entry) {
        return Utils.deferize(entry.createWriter).call(entry);
      })
      .then(function(writer) {
        return new FileWriter(writer);
      });
  };

  DirectoryAccessor.prototype.getFileSize = function(path) {
    return this.getFileEntry(path, false)
      .then(function (entry) {
        return Utils.deferize(entry.getMetadata).call(entry);
      })
      .then(function (metadata) {
        return metadata.size;
      });
  };

  DirectoryAccessor.prototype.getDirEntry = function(path) {
    var self = this;
    return this._init
      .then(function () {
        return Utils.deferize(self._root.getDirectory).call(self._root, self._normalize(path), {
          create: false
        });
      });
  };

  DirectoryAccessor.prototype.getDirUri = function(path) {
    return this.getDirEntry(path).then(function(entry) {
      return entry.toURL();
    });
  };

  DirectoryAccessor.prototype.dirExists = function(path) {
    return this.getDirEntry(path)
      .then(function () {
        return true;
      }, function () {
        return $.Deferred().resolve(false);
      });
  };

  DirectoryAccessor.prototype.fileExists = function(path) {
    return this.getFileEntry(path, false)
      .then(function () {
        return true;
      }, function () {
        return $.Deferred().resolve(false);
      });
  };

  DirectoryAccessor.prototype.remove = function(path) {
    return this.getFileEntry(path, false)
      .then(function(entry) {
        return Utils.deferize(entry.remove).call(entry);
      });
  };

  DirectoryAccessor.prototype.removeDir = function(path) {
    return this.getDirEntry(path)
      .then(function (entry) {
        return Utils.deferize(entry.removeRecursively).call(entry);
      });
  };

  DirectoryAccessor.prototype.mkdirs = function(pathSegments) {
    var creatingDirs = $.Deferred();
    var self = this;
    var currentDir;

    function createDir(i) {
      var dirName = pathSegments[i];
      if (dirName) {
        currentDir.getDirectory(dirName, {
          create: true,
          exclusive: false
        }, function(dir) {
          currentDir = dir;
          createDir(i + 1);
        }, creatingDirs.reject);
      } else if (i < pathSegments.length) {
        // Handle empty path segments
        createDir(i + 1);
      } else {
        // Done. Return the last directory entry.
        creatingDirs.resolve(currentDir);
      }
    }

    this._init.then(function () {
      currentDir = self._root;
      createDir(0);
    });

    return creatingDirs.promise();
  };

  DirectoryAccessor.prototype._normalize = function (path) {
    return path.replace(/^\//, '');
  };

  return DirectoryAccessor;

});
