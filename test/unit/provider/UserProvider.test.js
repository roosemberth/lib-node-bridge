/* global describe, beforeEach, afterEach, it*/
/*jshint expr: true*/

var should = require('should');
var async = require('async');
var up = require('../../../source/provider/UserProvider.js')();

var FAKE_USER_1 = {
  username: 'user1',
  pryv: {
    username: 'user1',
    token: 'token'
  },
  service: {
    settings: {
      a: 5,
      b: 6
    },
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
    settings: {
      a: 1,
      b: 2
    },
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
  this.timeout(5000);

  beforeEach(function (done) {
    up.insertUser(FAKE_USER_2.username, FAKE_USER_2.pryv,
      FAKE_USER_2.service.settings, FAKE_USER_2.service.accounts,
      function () {
        done();
      });
  });

  afterEach(function (done) {
    async.series([
      function (callback) {
        up.removeUser(FAKE_USER_1.username, function () {
          callback(null, true);
        });
      },
      function (callback) {
        up.removeUser(FAKE_USER_2.username, function () {
          callback(null, true);
        });
      },
      function (callback) {
        up.removeUser(FAKE_USER_3.username, function () {
          callback(null, true);
        });
      },
      function (callback) {
        up.removeUser(FAKE_USER_4.username, function () {
          callback(null, true);
        });
      },
      function (callback) {
        up.removeUser(FAKE_USER_5.username, function () {
          callback(null, true);
        });
      }
    ], done);
  });


// -----------------------------------------------
// ------------- FULL USER MANAGEMENT ------------
// -----------------------------------------------
  describe('insertUser()', function () {
    it('should not accept insert without username', function (done) {
      up.insertUser(null, null, null, null, function (error) {
        should.exist(error);
        done();
      });
    });

    it('should return the create user to the callback', function (done) {
      up.insertUser(FAKE_USER_1.username, FAKE_USER_1.pryv,
        FAKE_USER_1.service.settings, FAKE_USER_1.service.accounts,
        function (error, user) {
          should.not.exist(error);
          should.exist(user);
          done();
        });
    });

    it('should initialize pryv data, when not supplied', function (done) {
      up.insertUser(FAKE_USER_3.username, null,
        FAKE_USER_1.service.settings, FAKE_USER_1.service.accounts,
        function (error, user) {
          should.not.exist(error);
          should.exist(user);
          user.pryv.username.should.equal(FAKE_USER_3.username);
          user.pryv.token.should.equal('');
          done();
        });
    });

    it('should initialize pryv data, when not supplied', function (done) {
      up.insertUser(FAKE_USER_4.username, FAKE_USER_1.pryv,
        FAKE_USER_1.service.settings, null, function (error, user) {
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

  describe('getServiceSettings()', function () {

    it('should return an error, when no pryvUsername supplied', function (done) {
      up.getServiceSettings(null, function (error, result) {
        should.exist(error);
        should.not.exist(result);
        done();
      });
    });

    it('should return the requested service settings', function (done) {
      up.getServiceSettings(FAKE_USER_2.username, function (error, result) {
        should.not.exist(error);
        should(result).have.property('a', 1);
        should(result).have.property('b', 2);
        done();
      });
    });

    it('should not break the account object', function (done) {
      up.getServiceSettings(FAKE_USER_2.username, function (error, result) {
        should.not.exist(error);
        up.getService(FAKE_USER_2.username, function (error, service) {
          should.not.exist(error);
          should(service).have.property('accounts');
          should(service.accounts[0]).have.property('aid', 1);
          should(service.accounts[1]).have.property('aid', 3);
          should(service).not.have.property('username', 'service', 'pryv');
          should(service.settings).have.property('a', 1);
          should(service.settings).have.property('b', 2);
          done();
        });
      });
    });
  });

  describe('setServiceSettings()', function () {

    it('should return an error, when no pryvUsername supplied', function (done) {
      up.setServiceSettings(null, null, function (error, result) {
        should.exist(error);
        should.not.exist(result);
        done();
      });
    });

    it('should return the update service', function (done) {
      var settings = {a: 2, b: 3};
      up.setServiceSettings(FAKE_USER_2.username, settings, function (error, result) {
        should.not.exist(error);
        should(result).have.property('a', 2);
        should(result).have.property('b', 3);
        done();
      });
    });

    it('should not break the account object', function (done) {
      var settings = {a: 5, b: 6};
      up.setServiceSettings(FAKE_USER_2.username, settings, function (error, result) {
        up.getService(FAKE_USER_2.username, function (error, service) {
          should.not.exist(error);
          should(service).have.property('accounts');
          should(service.accounts[0]).have.property('aid', 1);
          should(service.accounts[1]).have.property('aid', 3);
          should(service).not.have.property('username', 'service', 'pryv');
          should(service.settings).have.property('a', 5);
          should(service.settings).have.property('b', 6);
          done();
        });
      });
    });
  });

  // -----------------------------------------------
  // ----- FULL USER SERVICE-ACCOUNT MANAGEMENT ----
  // -----------------------------------------------
  describe('getServiceAccounts()', function () {


    it('should return an error, when no pryvUsername supplied', function (done) {
      FAKE_USER_2.service.accounts[1].aid = 2;

      up.getServiceAccounts(null, function (error, accounts) {
        should.exist(error);
        should.not.exist(accounts);
        done();
      });
    });

    it('should return all service accounts of that user', function (done) {
      up.getServiceAccounts(FAKE_USER_2.username, function (error, accounts) {
        should.not.exist(error);
        should.exist(accounts);
        should(accounts).be.instanceof(Array).and.have.lengthOf(2);
        should(accounts[0]).have.property('aid', 1);
        should(accounts[1]).have.property('aid', 2);
        done();
      });
    });
  });

  describe('getServiceAccount()', function () {
    it('should return an error, when no pryvUsername supplied', function (done) {
      up.getServiceAccount(null, null, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when no aid supplied', function (done) {
      up.getServiceAccount(null, null, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when the service does not have an account with aid', function (done) {
      up.getServiceAccount(FAKE_USER_2.username, 3, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return service account with that aid of that user', function (done) {
      up.getServiceAccount(FAKE_USER_2.username, 2, function (error, account) {
        should.not.exist(error);
        should.exist(account);
        should(account).have.property('aid', 2);
        done();
      });
    });
  });

  describe('addServiceAccount()', function () {
    it('should return an error, when no pryvUsername supplied', function (done) {
      up.addServiceAccount(null, FAKE_USER_2.service.accounts[1], function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when no account supplied', function (done) {
      up.addServiceAccount(FAKE_USER_2.username, null, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when account does not have aid property', function (done) {
      up.addServiceAccount(FAKE_USER_2.username, {asdf: 1}, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return service account just added', function (done) {
      up.addServiceAccount(FAKE_USER_2.username, {aid: 3}, function (error, account) {
        should.not.exist(error);
        should.exist(account);
        should(account).have.property('aid', 3);
        done();
      });
    });
  });

  describe('updateServiceAccount()', function () {
    it('should return an error, when no pryvUsername supplied', function (done) {
      up.updateServiceAccount(null, {aid: 1, a: 3}, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when no account supplied', function (done) {
      up.updateServiceAccount(FAKE_USER_2.username, null, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when account does not have aid property', function (done) {
      up.updateServiceAccount(FAKE_USER_2.username, {asdf: 1}, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return service account just updated', function (done) {
      up.updateServiceAccount(FAKE_USER_2.username, {aid: 1, a: 3}, function (error, account) {
        should.not.exist(error);
        should.exist(account);
        should(account).have.property('aid', 1);
        should(account).have.property('a', 3);
        done();
      });
    });
  });

  describe('removeServiceAccount()', function () {
    it('should return an error, when no pryvUsername supplied', function (done) {
      up.removeServiceAccount(null, 1, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should return an error, when no accountId supplied', function (done) {
      up.removeServiceAccount(FAKE_USER_2.username, null, function (error, account) {
        should.exist(error);
        should.not.exist(account);
        done();
      });
    });
    it('should remove the account with aid', function (done) {
      up.removeServiceAccount(FAKE_USER_2.username, 1, function (error, account) {
        should.not.exist(error);
        should.not.exist(account);
        up.getServiceAccount(FAKE_USER_2.username, 1, function (err, acc) {
          should.exist(err);
          should.not.exist(acc);
          done();
        });
      });
    });
  });


  // -----------------------------------------------
  // -------------- UTILITY FUNCTIONS --------------
  // -----------------------------------------------


});