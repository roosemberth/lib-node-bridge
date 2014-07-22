/* global describe, it*/
/*jshint expr: true*/

var id = require('../../../source/provider/IdentityProvider.js');
var utils = require('../../../source/utils/utils.js');

var nock = require('nock');
var should = require('should');

var USERNAME = 'testuser';

describe('IdentityProvider', function() {
  describe('verifyPryv()', function() {

    it('should callback false when body is empty', function(done) {
      nock('https://' + USERNAME + utils.getPryvDomain())
        .filteringPath(/auth=[^&]*/g, 'auth=1')
        .get('/accesses?auth=1').reply(200);
      id.verifyPryv(USERNAME, '1', function (result) {
        should(result).not.be.ok;
        done();
      });
    });

    it('should callback false when status is not 200', function(done) {
      nock('https://' + USERNAME + utils.getPryvDomain())
        .filteringPath(/auth=[^&]*/g, 'auth=2')
        .get('/accesses?auth=2').reply(401, {accesses: 'lalala'});
      id.verifyPryv(USERNAME, '2', function (result) {
        should(result).not.be.ok;
        done();
      });
    });

    it('should callback false when access object is missing in response', function(done) {
      nock('https://' + USERNAME + utils.getPryvDomain())
        .filteringPath(/auth=[^&]*/g, 'auth=3')
        .get('/accesses?auth=3').reply(200, {a1: 'lalala'});
      id.verifyPryv(USERNAME, '3', function (result) {
        should(result).not.be.ok;
        done();
      });
    });

    it('should callback true if and only if status is 200 and body contains access object',
      function(done) {
        nock('https://' + USERNAME + utils.getPryvDomain())
          .filteringPath(/auth=[^&]*/g, 'auth=4')
          .get('/accesses?auth=4').reply(200, {accesses: 'lalala'});
      id.verifyPryv(USERNAME, '4', function (result) {
        should(result).be.ok;
        done();
      });
    });

  });
});