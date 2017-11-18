define(['./Runtime', './Utils'], function(Runtime, Utils) {
  Runtime.deviceReady().then(function(){
    window.crypto = window.crypto || {};
    window.crypto.subtle = window.crypto.subtle || window.crypto.webkitSubtle || window.Link.androidSubtle;
  });

  function delegate(name) {
    return function(/*args*/) {
      var args = _.toArray(arguments);
      return Utils
      .toJqPromise(window.crypto.subtle[name])
      .apply(window.crypto.subtle, args);
    };
  }

  return {
    digest: delegate('digest'),
    importKey: delegate('importKey'),
    decrypt: delegate('decrypt')
  };
});
