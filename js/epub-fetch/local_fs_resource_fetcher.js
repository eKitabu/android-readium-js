define(['require', 'module', 'jquery', 'URIjs', './discover_content_type', './ZipUtils', './Utils'],
    function(require, module, $, URI, ContentTypeDiscovery, ZipUtils, Utils) {

  function fetchFileContents(archiveFilePath, pathRelativeToPackageRoot, readCallback, onerror) {
    var scheme = 'file://';
    if (archiveFilePath.startsWith(scheme)) {
        archiveFilePath = archiveFilePath.substring(scheme.length);
    }

    ZipUtils.extract(archiveFilePath, pathRelativeToPackageRoot)
      .done(readCallback)
      .fail(onerror);
  }

  function LinkResourceFetcher(parentFetcher, archiveFilePath) {
    this.parentFetcher = parentFetcher;
    this.archiveFilePath = archiveFilePath;
  }

  LinkResourceFetcher.prototype.initialize = function(callback) {
    var self = this;
    self.parentFetcher.getXmlFileDom('META-INF/container.xml', function(containerXmlDom) {
      self._packageDocumentRelativePath = self.parentFetcher.getRootFile(containerXmlDom);
      self._packageDocumentAbsoluteUrl = self._packageDocumentRelativePath;

      callback();
    }, function(error) {
      console.error("unable to find package document: " + error);
      self._packageDocumentAbsoluteUrl = self.archiveFilePath;

      callback();
    });
  };

  LinkResourceFetcher.prototype.getPackageUrl = function() {
    return this._packageDocumentAbsoluteUrl;
  };

  LinkResourceFetcher.prototype.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
    this.fetchFileContentsArrayBuffer(pathRelativeToPackageRoot, function(arrayBuffer) {
        var text = Utils.buf2str(arrayBuffer);
        fetchCallback(text);
      },
      function(errorThrown) {
        console.error('Error when fetching ', pathRelativeToPackageRoot);
        console.error(errorThrown);

        onerror(errorThrown);
      });
  };

  LinkResourceFetcher.prototype.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
    this.fetchFileContentsArrayBuffer(pathRelativeToPackageRoot, function(contentsArrayBuffer) {
      var type = ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot),
        blob = Utils.bufferToBlob(contentsArrayBuffer, type);
      fetchCallback(blob);
    }, onerror);
  };

  LinkResourceFetcher.prototype.fetchFileContentsArrayBuffer = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
    var decryptionFunction = this.parentFetcher.getDecryptionFunctionForRelativePath(pathRelativeToPackageRoot);

    if (decryptionFunction) {
      var origFetchCallback = fetchCallback;
      fetchCallback = function(unencryptedArrayBuffer) {
        decryptionFunction(unencryptedArrayBuffer, origFetchCallback);
      };
    }
    fetchFileContents(this.archiveFilePath, pathRelativeToPackageRoot, fetchCallback, onerror);
  };

  LinkResourceFetcher.prototype.getPackageDom = function(callback, onerror) {
    var self = this;
    this.fetchFileContentsText(this._packageDocumentRelativePath, function(packageXml) {
      var packageDom = self.parentFetcher.markupParser.parseXml(packageXml);
      callback(packageDom);
    }, onerror);
  };

  LinkResourceFetcher.prototype.resolveURI = function (pathRelativeToPackageRoot) {

      var pathRelativeToPackageRootUri = undefined;
      try {
          pathRelativeToPackageRootUri = new URI(pathRelativeToPackageRoot);
      } catch(err) {
          console.error(err);
          console.log(pathRelativeToPackageRoot);
      }
      if (pathRelativeToPackageRootUri && pathRelativeToPackageRootUri.is("absolute")) return pathRelativeToPackageRoot; //pathRelativeToPackageRootUri.scheme() == "http://", "https://", "data:", etc.


      var url = this.parentFetcher.getEbookURL_FilePath();

      try {
          //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
          url = new URI(url).search('').hash('').toString();
      } catch(err) {
          console.error(err);
          console.log(url);
      }

      return url + (url.charAt(url.length-1) == '/' ? "" : "/") + pathRelativeToPackageRoot;
  };

  return LinkResourceFetcher;
});
