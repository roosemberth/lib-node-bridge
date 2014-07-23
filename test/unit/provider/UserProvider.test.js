/* global describe, beforeEach, afterEach, after, it*/
/*jshint expr: true*/

var async = require('async');

var up = require('../../../source/provider/UserProvider.js')();
var should = require('should');

var FAKE_USER_1 = {
  username: 'user1',
  pryv: {
    username: 'user1',
    token: 'token'
  },
  service: {
    accounts: [
      {aid: 1},
      {aid: 2}
    ]
  }
};

var FAKE_USER_2 = {
  username: 'user2',
  pryv: {
    username: 'user2',
    token: 'token'
  },
  service: {
    accounts: [
      {aid: 1},
      {aid: 2}
    ]
  }
};

var FAKE_USER_3 = {
  username: 'user3'
};
var FAKE_USER_4 = {
  username: 'user4'
};
var FAKE_USER_5 = {
  username: 'user5'
};


describe('UserProvider', function () {

  beforeEach(function (done) {
    up.insertUser(FAKE_USER_2.username, FAKE_USER_2.pryv, FAKE_USER_2.service.accounts,
      function () {
        done();
      });
  });

  afterEach(function (done) {
    async.parallel([
      function (callback) {
        up.removeUser(FAKE_USER_1.username, function () {
        });
        callback(null, true);
      },
      function (callback) {
        up.removeUser(FAKE_USER_2.username, function () {
        });
        callback(null, true);
      },
      function (callback) {
        up.removeUser(FAKE_USER_3.username, function () {
        });
        callback(null, true);
      },
      function (callback) {
        up.removeUser(FAKE_USER_4.username, function () {
        });
        callback(null, true);
      },
      function (callback) {
        up.removeUser(FAKE_USER_5.username, function () {
        });
        callback(null, true);
      }
    ], done);
  });

  after(function (done) {
    up.removeUser(FAKE_USER_1.username, function () {
      done();
    });
  });


// -----------------------------------------------
// ------------- FULL USER MANAGEMENT ------------
// -----------------------------------------------
  describe('insertUser()', function () {
    it('should not accept insert without username', function (done) {
      up.insertUser(null, null, null, function (error) {
        should.exist(error);
        done();
      });
    });

    it('should return the create user to the callback', function (done) {
      up.insertUser(FAKE_USER_1.username, FAKE_USER_1.pryv, FAKE_USER_1.service.accounts,
        function (error, user) {
        should.not.exist(error);
        should.exist(user);
        done();
      });
    });

    it('should initialize pryv data, when not supplied', function (done) {
      up.insertUser(FAKE_USER_3.username, null, FAKE_USER_1.service.accounts,
        function (error, user) {
        should.not.exist(error);
        should.exist(user);
        user.pryv.username.should.equal(FAKE_USER_3.username);
        user.pryv.token.should.equal('');
        done();
      });
    });

    it('should initialize pryv data, when not supplied', function (done) {
      up.insertUser(FAKE_USER_4.username, FAKE_USER_1.pryv, null, function (error, user) {
        should.not.exist(error);
        should.exist(user);
        user.pryv.username.should.equal(FAKE_USER_1.pryv.username);
        user.pryv.token.should.equal(FAKE_USER_1.pryv.token);
        should.exist(user.service);
        should.exist(user.service.accounts);
        user.service.accounts.length.should.equal(0);
        done();
      });
    });
  });

  describe('removeUser()', function () {
    it('should remove an existing user', function (done) {
      up.getUser(FAKE_USER_2.username, function (error, user) {

        should.not.exist(error);
        should.exist(user);
        up.removeUser(FAKE_USER_2.username, function (error) {
          should.not.exist(error);
          up.getUser(FAKE_USER_2.username, function (error, user) {

            should.not.exist(error);
            should.not.exist(user);
            done();
          });
        });
      });
    });

    it('should return an error when accessing an inexisting user', function (done) {
      up.removeUser(FAKE_USER_5.username, function (error, user) {

        should.not.exist(error);
        should.not.exist(user);
        done();
      });
    });

    it('should return an error when no username supplied', function (done) {
      up.removeUser(null, function (error, user) {

        should.exist(error);
        should.not.exist(user);
        done();
      });
    });
  });

  describe('getUser()', function () {
    it('should return the user by pryvUsername', function (done) {
      up.getUser(FAKE_USER_2.username, function (error, user) {
        should.not.exist(error);
        should.exist(user);
        should.exist(user.username);
        should.exist(user.service);
        should.exist(user.pryv);
        user.pryv.username.should.equal(FAKE_USER_2.username);
        user.pryv.token.should.equal(FAKE_USER_2.pryv.token);
        should(user.service.accounts).be.instanceof(Array).and.have.lengthOf(2);
        done();
      });
    });

    it('should return an error when no username supplied', function (done) {
      up.getUser(null, function (error, user) {
        should.exist(error);
        should.not.exist(user);
        done();
      });
    });
  });


// -----------------------------------------------
// ------ FULL USER SERVICE MANAGEMENT TEST ------
// -----------------------------------------------
  describe('getService()', function () {
    it('should return an error, when no pryvUsername supplied', function (done) {
      up.getService(null, function (error, result) {
        should.exist(error);
        should.not.exist(result);
        done();
      });
    });

    it('should return the requested service', function (done) {
      up.getService(FAKE_USER_2.username, function (error, result) {
        should.not.exist(error);
        should(result).have.property('accounts');
        should(result.accounts[0]).have.property('aid', 1);
        should(result.accounts[1]).have.property('aid', 2);
        should(result).not.have.property('username', 'service', 'pryv');
        should.exist(result.accounts[1]);
        done();
      });
    });
  });

  describe('setService()', function () {

    it('should return an error, when no pryvUsername supplied', function (done) {
      up.setService(null, null, function (error, result) {
        should.exist(error);
        should.not.exist(result);
        done();
      });
    });

    it('should return the requested service', function (done) {
      var service = FAKE_USER_2.service;
      service.accounts[1].aid = 3;
      up.setService(FAKE_USER_2.username, service, function (error, result) {
        should.not.exist(error);
        should(result).have.property('accounts');
        should(result.accounts[0]).have.property('aid', 1);
        should(result.accounts[1]).have.property('aid', 3);
        should(result).not.have.property('username', 'service', 'pryv');
        should.exist(result.accounts[1]);
        done();
      });
    });
  });

  // -----------------------------------------------
  // ----- FULL USER SERVICE-ACCOUNT MANAGEMENT ----
  // -----------------------------------------------


  // -----------------------------------------------
  // -------------- UTILITY FUNCTIONS --------------
  // -----------------------------------------------


});