/* global describe, it */

var Pryv = require('pryv');
var SdkMapper = require('../../../source/gateway/Mapper.js');
var AccountContainer = require('../../../source/gateway/AccountContainer.js');
/*
var account1 = {
  pryv: {
    user: 'user 1'
  },
  service: {
    accounts: [
      {
        aid: 'usr1:acc1'
      },
      {
        aid: 'usr1:acc2'
      }
    ]
  }
}; */
var account2 = {
  pryv: {
    user: 'user 2'
  },
  service: {
    accounts: [
      {
        aid: 'usr2:acc1'
      }
    ]
  }
};


var Mapper = function (database) {
  SdkMapper.call(this, database);
};

Mapper.prototype = Object.create(SdkMapper.prototype);







describe('Mapper', function () {
  describe('Mapper.prototype.executeCron()', function () {
    it('Should execute each step after the other', function (done) {
      this.timeout(50000);

      var preMapGeneralDone = false;
      var preMapPryvDone = false;
      var preStreamCreationDone = false;
      var preMapServiceDone = false;
      var mapDone = false;
      var postMapServiceDone = false;
      var postMapPryvDone = false;
      var postMapGeneralDone = false;

      /* override the methods */
      Mapper.prototype.preMapGeneral = function (callback) {
        preMapGeneralDone = true;
        preMapGeneralDone.should.equal(true);
        preMapPryvDone.should.be.equal(false);
        preStreamCreationDone.should.be.equal(false);
        preMapServiceDone.should.be.equal(false);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        callback.should.be.type('function');

        callback('preMapGeneral', null);
      };


      Mapper.prototype.preMapPryv = function (pryvConnection, generalResult, callback) {
        preMapPryvDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(false);
        preMapServiceDone.should.be.equal(false);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        pryvConnection.should.be.an.instanceof(Pryv.Connection);
        generalResult.should.be.equal('preMapGeneral');
        callback.should.be.type('function');

        callback('preMapPryv', null);
      };

      Mapper.prototype.preStreamCreation = function (accountContainer, pryvResult, generalResult, callback) {
        console.log('Mapper.prototype.preStreamCreation');
        preStreamCreationDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(false);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        accountContainer.should.be.an.instanceof(AccountContainer);
        generalResult.should.be.equal('preMapGeneral');
        pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.preMapService = function (accountContainer, pryvResult, generalResult, callback) {
        console.log('Mapper.prototype.preMapService');

        preMapServiceDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        accountContainer.should.be.an.instanceof(AccountContainer);
        generalResult.should.be.equal('preMapGeneral');
        pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.map = function (accountContainer, pryvResult, generalResult, callback) {
        mapDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        accountContainer.should.be.an.instanceof(AccountContainer);
        generalResult.should.be.equal('preMapGeneral');
        pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };


      Mapper.prototype.postMapService = function (accountContainer, pryvResult, generalResult, callback) {
        postMapServiceDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        accountContainer.should.be.an.instanceof(AccountContainer);
        generalResult.should.be.equal('preMapGeneral');
        pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.postMapPryv = function (pryvConnection, pryvResult, generalResult, callback) {
        postMapPryvDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(true);
        postMapGeneralDone.should.be.equal(false);

        pryvConnection.should.be.an.instanceof(Pryv.Connection);
        generalResult.should.be.equal('preMapGeneral');
        pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.postMapGeneral = function (generalResult, callback) {
        postMapGeneralDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(true);
        postMapGeneralDone.should.be.equal(true);

        generalResult.should.be.equal('preMapGeneral');
        callback.should.be.type('function');

        callback(null, null);
        done();
      };


      var mapper = new Mapper({
        forEachAccount: function (callback) {
          callback(account2);
        }
      });





      mapper.executeCron();
    });
  });
});
