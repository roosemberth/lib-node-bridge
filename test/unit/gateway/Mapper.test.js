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
      Mapper.prototype.preMapGeneral = function (gc, callback) {
        preMapGeneralDone = true;
        preMapGeneralDone.should.equal(true);
        preMapPryvDone.should.be.equal(false);
        preStreamCreationDone.should.be.equal(false);
        preMapServiceDone.should.be.equal(false);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        gc.should.be.type('object');
        callback.should.be.type('function');

        callback(null, 'preMapGeneral');
      };


      Mapper.prototype.preMapPryv = function (gc, pc, callback) {
        preMapPryvDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(false);
        preMapServiceDone.should.be.equal(false);
        mapDone.should.be.equal(false);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        callback.should.be.type('function');

        callback(null, 'preMapPryv');
      };

      Mapper.prototype.preStreamCreation = function (gc, pc, acc, callback) {
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

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        pc.pryvResult.should.be.equal('preMapPryv');
        acc.should.be.an.instanceof(AccountContainer);
        callback.should.be.type('function');

        callback(null, 'preStreamCreation');
      };

      Mapper.prototype.preMapService = function (gc, pc, acc, callback) {
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

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        pc.pryvResult.should.be.equal('preMapPryv');
        acc.should.be.an.instanceof(AccountContainer);
        acc.preStreamCreationResult.should.be.equal('preStreamCreation');
        callback.should.be.type('function');

        callback(null, 'preMapService');
      };

      Mapper.prototype.map = function (gc, pc, acc, callback) {
        mapDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(false);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        pc.pryvResult.should.be.equal('preMapPryv');
        acc.should.be.an.instanceof(AccountContainer);
        acc.preStreamCreationResult.should.be.equal('preStreamCreation');
        acc.preMapServiceResult.should.be.equal('preMapService');
        callback.should.be.type('function');

        callback(null, 'map');
      };


      Mapper.prototype.postMapService = function (gc, pc, acc, callback) {
        postMapServiceDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(false);
        postMapGeneralDone.should.be.equal(false);

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        pc.pryvResult.should.be.equal('preMapPryv');
        acc.should.be.an.instanceof(AccountContainer);
        acc.preStreamCreationResult.should.be.equal('preStreamCreation');
        acc.preMapServiceResult.should.be.equal('preMapService');
        acc.mapResult.should.be.equal('map');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.postMapPryv = function (gc, pc, callback) {
        postMapPryvDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(true);
        postMapGeneralDone.should.be.equal(false);

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
        pc.connection.should.be.an.instanceof(Pryv.Connection);
        pc.account.should.be.type('object');
        pc.pryvResult.should.be.equal('preMapPryv');
        callback.should.be.type('function');

        callback(null, null);
      };

      Mapper.prototype.postMapGeneral = function (gc, callback) {
        postMapGeneralDone = true;
        preMapGeneralDone.should.be.equal(true);
        preMapPryvDone.should.be.equal(true);
        preStreamCreationDone.should.be.equal(true);
        preMapServiceDone.should.be.equal(true);
        mapDone.should.be.equal(true);
        postMapServiceDone.should.be.equal(true);
        postMapPryvDone.should.be.equal(true);
        postMapGeneralDone.should.be.equal(true);

        gc.should.be.type('object');
        gc.generalResult.should.be.equal('preMapGeneral');
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
