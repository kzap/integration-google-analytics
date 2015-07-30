'use strict';

/**
 * Module dependencies.
 */

var GoogleAnalytics = require('..');
var Test = require('segmentio-integration-tester');
var assert = require('assert');
var each = require('lodash.forEach');
var enhancedEcommerceMethods = require('../lib/universal/enhanced-ecommerce');
var fmt = require('util').format;
var helpers = require('./helpers');
var mapper = require('../lib/universal/mapper');

/**
 * Tests.
 */

describe('Google Analytics :: Universal', function(){
  var ga;
  var settings;
  var test;

  beforeEach(function(){
    settings = {
      serversideTrackingId: 'UA-27033709-11',
      mobileTrackingId: 'UA-27033709-23',
      serversideClassic: false
    };
    ga = new GoogleAnalytics(settings);
    test = new Test(ga.universal, __dirname);
    test.mapper(mapper);
  });

  describe('mapper', function(){
    describe('page', function(){
      it('should map basic page', function(){
        test.maps('page-basic', settings);
      });

      it('should map context.app', function(){
        test.maps('page-app', settings);
      });

      it('should map context.campaign', function(){
        test.maps('page-campaign', settings);
      });

      it('should map context.screen', function(){
        test.maps('page-screen', settings);
      });

      it('should map context.locale', function(){
        test.maps('page-locale', settings);
      });

      it('should map page with custom dimensions and metrics', function(){
        test.maps('page-cm-cd', settings);
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic', settings);
      });

      it('should map context.app', function(){
        test.maps('track-app', settings);
      });

      it('should map context.screen', function(){
        test.maps('page-screen', settings);
      });

      it('should map page with custom dimensions and metrics', function(){
        test.maps('track-cm-cd', settings);
      });

      it('should map url in track call', function(){
        test.maps('track-url', settings);
      });
    });

    describe('completed-order', function(){
      it('should map basic completed-order', function(){
        test.maps('completed-order-basic', settings);
      });

      it('should map context.app', function(){
        test.maps('completed-order-app', settings);
      });

      it('should map context.screen', function(){
        test.maps('page-screen', settings);
      });

      it('should map page with custom dimensions and metrics', function(){
        test.maps('completed-order-cm-cd', settings);
      });
    });

    describe('screen', function(){
      it('should map basic screen', function(){
        test.maps('screen-basic', settings);
      });

      it('should map context.app', function(){
        test.maps('screen-app', settings);
      });

      it('should fall back to server-side id', function(){
        delete settings.mobileTrackingId;
        test.maps('screen-server-id', settings);
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = {};
      track.userId = 'userId';
      track.event = 'event';
      test
        .set(settings)
        .track(track)
        .expects(200, done);
    });

    it('should respect .label, .category and .value', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200, done);
    });

    it('should fallback to .revenue after .value', function(done){
      var json = test.fixture('track-revenue');
      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200, done);
    });

    it('should send custom dimensions and metrics', function(done){
      var json = test.fixture('track-cm-cd');
      test
        .set(settings)
        .set(json.settings)
        .track(json.input)
        .sends(json.output)
        .expects(200, done);
    });
  });

  describe('.page()', function(){
    it('should get a good response from the API', function(done){
      var json = test.fixture('page-basic');
      test
        .set(settings)
        .page(json.input)
        .sends(json.output)
        .expects(200, done);
    });

    it('should send custom dimensions and metrics', function(done){
      var json = test.fixture('page-cm-cd');
      test
        .set(settings)
        .set(json.settings)
        .page(json.input)
        .sends(json.output)
        .expects(200, done);
    });
  });

  describe('.screen()', function(){
    it('should get a good response from the API', function(done){
      var json = test.fixture('screen-basic');
      test
        .set(settings)
        .screen(json.input)
        .sends(json.output)
        .expects(200, done);
    });

    it('should send app info', function(done){
      var json = test.fixture('screen-app');
      test
        .set(settings)
        .set(json.settings)
        .screen(json.input)
        .sends(json.output)
        .expects(200, done);
    });
  });

  describe('.completedOrder()', function(){
    it('should send ecommerce data', function(done){
      var track = helpers.transaction();
      // TODO: fixture
      ga.track(track, done);
    });

    // TODO: cm, cd tests once we have multi request tests.
  });

  describe('enhanced ecommerce', function(){
    beforeEach(function(){
      settings.enhancedEcommerce = true;
      ga = new GoogleAnalytics(settings);
      test = new Test(ga.universal, __dirname);
      test.mapper(mapper);
    });

    it('should not have EE methods when EE is not enabled', function(){
      settings.enhancedEcommerce = false;
      ga = new GoogleAnalytics(settings);
      test = new Test(ga.universal, __dirname);

      each(enhancedEcommerceMethods, function(method, name){
        assert(
          ga.universal[name] !== method,
          fmt('GA should not have enhanced ecommerce method %s when settings.enhancedEcommerce is `false`', name)
        );
      });
    });

    it('should have EE methods when EE is not enabled', function(){
      each(enhancedEcommerceMethods, function(method, name){
        assert(
          ga.universal[name] === method,
          fmt('GA should have enhanced ecommerce method %s when settings.enhancedEcommerce is `true`', name)
        );
      });
    });

    describe('mapper', function(){
      // TODO: More aggressive tests
      describe('#viewedProduct', function(){
        it('should map basic viewedProduct', function(){
          test.maps('viewed-product-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#clickedProduct', function(){
        it('should map basic clickedProduct', function(){
          test.maps('clicked-product-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#addedProduct', function(){
        it('should map basic addedProduct', function(){
          test.maps('added-product-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#removedProduct', function(){
        it('should map basic removedProduct', function(){
          test.maps('removed-product-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#startedOrder', function(){
        it('should map basic startedOrder', function(){
          test.maps('started-order-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#updatedOrder', function(){
        it('should map basic updatedOrder', function(){
          test.maps('updated-order-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#completedCheckoutStep', function(){
        it('should map basic completedCheckoutStep', function(){
          test.maps('completed-checkout-step-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#viewedCheckoutStep', function(){
        it('should map basic viewedCheckoutStep', function(){
          test.maps('viewed-checkout-step-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#refundedOrder', function(){
        it('should map basic refundedOrder', function(){
          test.maps('refunded-order-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#clickedPromotion', function(){
        it('should map basic clickedPromotion', function(){
          test.maps('clicked-promotion-basic', settings);
        });
      });

      // TODO: More aggressive tests
      describe('#viewedPromotion', function(){
        it('should map basic viewedPromotion', function(){
          test.maps('viewed-promotion-basic', settings);
        });
      });
    });

    describe('#viewedProduct', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('viewed-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#clickedProduct', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('clicked-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#addedProduct', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('added-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#removedProduct', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('removed-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#startedOrder', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('started-order-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#updatedOrder', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('updated-order-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#completedCheckoutStep', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('completed-checkout-step-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#viewedCheckoutStep', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('viewed-checkout-step-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#refundedOrder', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('refunded-order-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#clickedPromotion', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('clicked-promotion-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('#viewedPromotion', function(){
      it('should get a 200 from the API', function(done){
        var json = test.fixture('viewed-promotion-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, function(err, res) {
            console.log(res[0].body);
            done();
          });
      });
    });
  });
});
