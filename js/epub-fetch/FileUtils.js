define(['./Utils'], function(Utils) {

  function copy(sourceEntry, destEntry) {
    return $.when(
        Utils.deferize(sourceEntry.file).call(sourceEntry),
        Utils.deferize(destEntry.createWriter).call(destEntry))
      .then(function(sourceFile, destWriter) {
        var writing = $.Deferred().resolve();
        return _readInChunks(sourceFile, 10 * 1024 * 1024)
          .progress(function(chunk) {
            writing = writing.then(_.partial(_write, destWriter, chunk));
          })
          .then(function () {
            return writing.promise();
          });
      });
  }

  function _write(writer, data) {
    var writing = $.Deferred();

    writer.onwrite = writing.resolve;
    writer.onerror = writing.reject;

    writer.write(new Blob([data], {
      type: 'application/octet-stream'
    }));

    return writing.promise();
  }

  function _readInChunks(file, chunkSize) {
    var reading = $.Deferred();
    var reader = new FileReader();
    var offset = 0;

    function readChunk() {
      var chunk = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(chunk);
    }

    reader.onload = function(event) {
      var data = event.target.result;
      reading.notify(data);
      offset += data.byteLength;
      if (offset < file.size) {
        readChunk();
      } else {
        reading.resolve();
      }
    }

    readChunk();
    return reading.promise();
  }

  return {
    copy: copy
  }
});
