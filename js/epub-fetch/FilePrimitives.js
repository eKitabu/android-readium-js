define(['./Utils', './Runtime', /*'cordova/cordova',*/ './DirectoryAccessor'],
  function(Utils, Runtime, /*Cordova,*/ DirectoryAccessor) {

  function getRootDirUri() {
    // TODO: Use the root directory for now -- etsakov@2017.11.13
    // var rootDir = Cordova.isPlatform('android') ? 'externalApplicationStorageDirectory' : 'dataDirectory';
    // return window.cordova.file[rootDir];

    return "file:///";
  }

  function resolve(dirUri) {
    return Utils.deferize(window.resolveLocalFileSystemURL)
      .call(window, dirUri);
  }

  function resolveDefaultFileSystem() {
    var rootDirUri = getRootDirUri();

    return resolve(rootDirUri).then(function(dirEntry) {
      return { root: dirEntry };
    });
  }

  function requestFS() {
    return Runtime.deviceReady()
      .then(resolveDefaultFileSystem);
  }

  function addDetachedListener(cb) {
    console.error('TODO: implement detached listener');
  }

  function getRootBySetting(setting) {
    return resolve('file://' + setting)
      .then(function(dirEntry) {
        return new DirectoryAccessor(dirEntry);
      });
  }

  function settingToFilePath(setting) {
    var path = setting || '/';
    return $.when(path);
  }

  function browseDirectory(setting) {
    var path = setting || '/';
    return Runtime.deviceReady().then(function() {
      return window.Link.browseDirectory(path)
        .then(function(path){
          return $.when(path, path);
        });
    });
  }

  function supportsLocationSelection() {
    return device.platform === 'Android';
  }

  function fileSystemName() {
    return 'default external location';
  }

  return {
    requestFS: requestFS,
    addDetachedListener: addDetachedListener,
    supportsLocationSelection: supportsLocationSelection,
    fileSystemName: fileSystemName,
    getRootBySetting: getRootBySetting,
    settingToFilePath: settingToFilePath,
    browseDirectory: browseDirectory
  };
});
