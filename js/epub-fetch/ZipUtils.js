define(['./FileStorage'], function(FileStorage) {

  var sync = (function () {
    var syncResource = $.Deferred().resolve();

    return function (func) {
      syncResource = syncResource.then(function() {
        var defer = $.Deferred();
        func()
          .always(defer.resolve);
        return defer.promise();
      });
    };
  })();

  function extract(archiveFilePath, pathRelativeToPackageRoot) {
    var result = $.Deferred();

    if (archiveFilePath.indexOf('/') === 0) {
      archiveFilePath = archiveFilePath.slice(1);
    }

    FileStorage.getFileEntry(archiveFilePath, false)
      .then(function(fileEntry) {
        var schema = 'file:///',
          archiveUrl = fileEntry.nativeURL;

        if (archiveUrl.indexOf(schema) === 0) {
          archiveUrl = archiveUrl.slice(schema.length);
        }

        sync(function() {
          return window.Link.getResource(
            archiveUrl,
            pathRelativeToPackageRoot
          ).then(result.resolve, result.reject);
        });
      }, result.reject);

    return result.promise();
  }

  function ensureFileIsWorkable(path) {
    return $.when(path);
  }

  return {
    extract: extract,
    ensureFileIsWorkable: ensureFileIsWorkable
  };
});
