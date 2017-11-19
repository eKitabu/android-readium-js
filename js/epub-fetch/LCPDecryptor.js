define(['./Utils', './Crypto'], function(Utils, Crypto) {

  var AES_BLOCKSIZE = 16;

  function aesDecryption(key, encryptedData) {
    return Crypto.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      )
      .then(function(cryptoKey) {
        return Crypto.decrypt(
          {
            name: 'AES-CBC',
            iv: encryptedData.slice(0, AES_BLOCKSIZE)
          },
          cryptoKey,
          encryptedData.slice(AES_BLOCKSIZE)
        );
      });
  }

  /**
   * Decrypt encryptedData using encryptedContentKey.
   * @param {string} encryptedContentKey The encrypted content key in Base64.
   * @param {ArrayBuffer} encryptedData The data to decrypt.
   * @returns {Promise<ArrayBuffer>} A promise that resolves with the deciphered
   * encryptedData as an ArrayBuffer.
   */
  function decrypt(encryptedContentKey, encryptedData) {
    return Crypto.digest('SHA-256', Utils.str2buf(device.serial))
      .then(function (deviceKeyBuffer) {
        var encryptedContentKeyBuffer = Utils.str2buf(atob(encryptedContentKey));
        return aesDecryption(deviceKeyBuffer, encryptedContentKeyBuffer);
      })
      .then(function (contentKeyBase64Buffer) {
        contentKey = atob(Utils.buf2str(contentKeyBase64Buffer));
        return aesDecryption(Utils.str2buf(contentKey), encryptedData);
      });
  }

  // TODO: The `create` method is currently unused as the content key
  // is decrypted in a different fashion. -- etsakov@2017.11.19
  //{"provider":"http://lcp.learningally.org","id":"41ad109d-47f3-47d8-9f38-d91cea73e9dd","date":"2015-06-05T11:31:31.443796548-04:00","encryption":{"profile":"http://readium.org/lcp/profile-1.0","content_key":{"algorithm":"http://www.w3.org/2001/04/xmlenc#aes256-cbc","encrypted_value":"KjkjAU9dttybBBQgmAL1Pk9N50wcqlBNNxjlbABv11MBzHmbVpJ/h9s4IJLByWs8z5i6dd7Eb56EVkjYY27elA=="},"user_key":{"algorithm":"http://www.w3.org/2001/04/xmlenc#sha256","text_hint":"Enter your passphrase","key_check":"ienym8kqLvYR0mB3Fj2U3tyh6BbsftqLEBXts+KrRqm3DbN/myFpOyEZDIhnCYQ+bukWi02J6EXcehiaZGNaRg=="}},"links":{"hint":{"href":"http://lcp.learningally.org:8989/hint"},"publication":{"href":"http://rfbd.vo.llnwd.net/o41/ep/7/5/2/EP-KK752/EP-KK752.epub","type":"application/epub+zip"}},"user":{"id":"ryana"},"rights":{"print":10,"copy":10,"tts":true,"edit":false},"signature":{"certificate":"MIIDXTCCAkWgAwIBAgIJAJfn2W6Ss/RnMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTQwMzIwMDkzODA3WhcNMTkwMzIwMDkzODA3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9VQ+Wos1WXvB2qncW8Oj14KBhtLiKhSAL0vc/a3+7HcK8MPmdPt0/xe9JEu7vyjsre6389KzrUXOyOLuPkrzY6FkF1LMqfPr1+DGRzN45/Am1ArIxEmYhMAtoLfcBM2tSqg0laOpl/WVZb9vCVRgtGsg905D7WGGeL9R89PMNkBSZ950ij3+Snz+f8Bz/w6waVMCoyMMXFyT0+zrRTC6X0lxyaV2r4WMD7GJSF6Ss/csrOQug+N3T3IIbfYWQ8LThmR8OqfNRQmSZ5kuOfSyCYQV/1LRkjWFhlrgdf1dn5aQGe1pguMnuwgUZvTnuM6exuAplrsmWRJ0tjxs40MPawIDAQABo1AwTjAdBgNVHQ4EFgQUnYayVoPd7+34rPM6n08CvGqR7kAwHwYDVR0jBBgwFoAUnYayVoPd7+34rPM6n08CvGqR7kAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEA8I+/NHf3pnEqJ6yg7nfJiF1jg2d/0jb7gva25bM16tXetgRVFcc87XUnn65ctiabY0ov7nsYvugmaZD+vZLxQ0sJaurwiOu26OO6tfphmXM2BawdjzSB5+uBobZ+Po9CoYNQmp3x8r3WdMMBfcC6vKnlYbxubxAKgopqTAouT2nx/GF/iGn9b7YzxVioSvBMHUV88QBTyQ6h6l+Unk0/0TxcVvMzxku3qxmQNQGJpefuEjo6eEvfpy0px8l7yftdM2FGMiU3brSXB9QC77nImqIDsU5Wi4qMF25bpUdikYR+/Fl7sCURVY9EBriuCverwZ3vyg3AaesmCYC7axufpw==","value":"eJ85ykyXZ1qPc+mQ20DDHycpD0uslNWbGFvvELh6dVBmDkpbKWbi6RMMhmjJs7ydo9QN/xxH/7MITIo4t9qk3+JPHQoMMMdj2vcb8eSozG6z+Mrgau1eSt73UaYYkYI2f/xrLOkJ+lcX0OaOZ3db5Wtr1WmLLxFEhSmT9gKCeu8vZDqbRhz6zhOBK2qshH8zuSJsQ0LsC/5NnP9pPe0dSfzJDBRrBKmZDhmMLqQ5paVFtjwP0UPAVr9GJJUIM/82bwYJzSsTQsqlHtvS839uGgkmVYfW09dEqA1eo/1s8d9MF7molgQTY/2+UwzarY4PwgTHfx966iVwnySNjzCQQw==","algorithm":"http://www.w3.org/2000/09/xmldsig#rsa-sha256"}}
  function create(license, passphrase) {
    var id = license.id,
      keyCheck = license.encryption.user_key.key_check,
      encryptedValue = license.encryption.content_key.encrypted_value;

    //base 64 decode the key
    var keyCheckDecoded = atob(keyCheck);
    if (keyCheckDecoded.length <= AES_BLOCKSIZE) {
      return reject('Key check is short');
    }

    // base 64 decode the encrypted value
    var encryptedValueDecoded = atob(encryptedValue);
    if (encryptedValueDecoded.length <= AES_BLOCKSIZE) {
      return reject('Encrypted value is short');
    }

    // convert passphrase to bytes
    var passphraseBuf = Utils.str2buf(passphrase);

    // get sha-256 hash of passphrase
    return Crypto.digest({
          name: 'SHA-256'
        },
        passphraseBuf
      ).then(function(sha) {
        // decrypt the keycheck value using the sha of the password as the key
        return aesDecryption(sha, Utils.str2buf(keyCheckDecoded))
          .then(function(keyCheckDecrypted) {
            var keyCheckStr = Utils.buf2str(keyCheckDecrypted);

            // verify the passphrase and key check
            if (keyCheckStr !== id) {
              return reject('wrong passphrase');
            }

            return Utils.str2buf(encryptedValueDecoded);
          }).then(function(encryptedValueDecodedBuf) {
            // decrypt the content key
            return aesDecryption(sha, encryptedValueDecodedBuf);
          });
      }).then(function(contentKey) {
        // create the decryptor and return it
        return new LCPDecryptor(contentKey);
      });
  }

  function reject(message) {
    var rejection = $.Deferred();
    rejection.reject(message);
    return rejection.promise();
  }

  function LCPDecryptor(contentKey) {
    this.contentKey = contentKey;
  }

  LCPDecryptor.prototype.decrypt = function(content) {
    return aesDecryption(this.contentKey, content);
  };

  return {
    decrypt: decrypt
  };
});
