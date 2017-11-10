define(['./Utils'], function(Utils) {

  function setCordovaShims() {
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
    window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL;

    ArrayBuffer.prototype.slice = ArrayBuffer.prototype.slice || function(start, end) {
      var that = new Uint8Array(this);
      end = end || that.length;
      var result = new ArrayBuffer(end - start);
      var resultArray = new Uint8Array(result);
      for (var i = 0; i < resultArray.length; i++) {
        resultArray[i] = that[i + start];
      }
      return result;
    };
  }

  var deviceReady = (function() {
    var defer = $.Deferred();
    document.addEventListener('deviceready', defer.resolve, false);
    return defer.promise().then(setCordovaShims);
  })();

  function getIp() {
    return deviceReady.then(function() {
      return Utils.deferizeOneCallback(networkinterface.getIPAddress)
        .call(networkinterface);
    });
  }

  function getPlatformInfo() {
    return deviceReady.then(function() {
      return {
        os: device.platform,
        deviceType: device.manufacturer + '/' + device.model
      };
    });
  }

  return {
    launchBrowser: function(url) {
      window.open(url, '_system');
    },
    appVersion: function() {
      return AppVersion.version;
    },
    getSystemInfo: function() {
      return $.when(getIp(), getPlatformInfo());
    },
    deviceReady: _.constant(deviceReady)
  };
});
