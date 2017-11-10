define(function() {
  var Utils = Utils || {};

  Utils.blockUI = function() {
    $.blockUI({
      message: $('#throbber')
    });
  };

  Utils.blockUI2 = function() {
    $.blockUI({
      message: $('#throbber'),
      baseZ: 15000
    });
  };

  Utils.unBlockUI = function() {
    $.unblockUI();
  };

  Utils.uuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  function oneCallback(args, defer) {
    args.push(defer.resolve);
  }

  function twoCallbacks(args, defer) {
    args.push(defer.resolve, defer.reject);
  }

  function deferizeWith(argumenter) {
    return function(fn) {
      return function( /*args...*/ ) {
        var defer = $.Deferred();
        var args = _.toArray(arguments);

        argumenter(args, defer);

        fn.apply(this, args);
        return defer.promise();
      };
    };
  }

  Utils.deferize = deferizeWith(twoCallbacks);

  Utils.deferizeOneCallback = deferizeWith(oneCallback);

  Utils.toJqPromise = function(func) {
    return function( /*args...*/ ) {
      var defer = $.Deferred(),
        args = _.toArray(arguments);

      func.apply(this, args)
        .then(defer.resolve, defer.reject);

      return defer.promise();
    };
  };

  Utils.str2buf = function(str) {
    var bytes = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
  };

  Utils.buf2str = function(buf) {
    var decoder = new TextDecoder();
    return decoder.decode(buf);
  };

  Utils.toggleModal = function($modal, show) {
    var isShown = ($modal.data('bs.modal') || {}).isShown;
    if (_.isUndefined(show)) {
      show = !isShown;
    }

    if (show && !isShown) {
      $(':not(.modal *)[tabindex][tabindex!="-1"]').each(function() {
        $(this)
          .attr('data-tabindex', this.tabIndex)
          .attr('tabindex', '-1');
      });

      Keyboard.scope('modal');
      Keyboard.on('esc', 'modal', function() {
        Utils.toggleModal($modal, false);
      });

      $modal
        .one('hidden.bs.modal', function() {
          Keyboard.off('modal');
          Keyboard.scope('all');
          $('[data-tabindex]').each(function() {
            var $el = $(this);
            $el
              .attr('tabindex', $el.attr('data-tabindex'))
              .removeAttr('data-tabindex');
          });
          $('.popup-closed').click();
        });

      $modal
        .one('shown.bs.modal', function() {
          var $content = $modal.find('.modal-content');
          $content.click();
        })
        .modal('show');
    } else if (!show && isShown) {
      $modal.modal('hide');
    }
  };

  Utils.isNonActionKeyEvent = function(event) {
    var k = event && (event.which || event.keyCode);
    return !!event && event.type == 'keydown' && k != 13 && k != 32;
  };

  Utils.bufferToBlob = function(buffer, type) {
    var blob = null;
    try {
      blob = new Blob([buffer], { type: type });
    } catch(e) {
      if (window.BlobBuilder) {
        var blobBuilder = new BlobBuilder();
        blobBuilder.append(buffer);
        blob = blobBuilder.getBlob(type);
      } else {
        try {
          blob = new Blob([buffer]);
        } catch(ex) {
          throw "Sorry";
        }
      }
    }
    return blob;
  };

  return Utils;
});