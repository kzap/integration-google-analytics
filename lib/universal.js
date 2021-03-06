'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');
var Batch = require('batch');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .endpoint('https://ssl.google-analytics.com/collect')
  .retries(2);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.track = function(track, callback){
  var payload = mapper.track(track, this.settings);
  return this
    .post()
    .type('form')
    .send(payload)
    .end(this.handle(callback));
};

/**
 * Completed Order.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#ecom
 *
 *    - `t` - type
 *    - `ti` - transaction id (.orderId())
 *    - `ta` - transaction affiliation
 *    - `tr` - transaction revenue (.revenue())
 *    - `ts` - transaction shipping (.shipping())
 *    - `tt` - transaction tax (.tax())
 *    - `cu` - currency code (.currency())
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.completedOrder = function(track, fn){
  var payloads = mapper.completedOrder(track, this.settings);
  var batch = new Batch();
  var self = this;

  // make sure batch throws.
  batch.throws(true);

  payloads.forEach(function(payload){
    batch.push(function(done){
      self
        .post()
        .type('form')
        .send(payload)
        .end(self.handle(done));
    });
  });

  batch.end(fn);
};

/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Function} fn
 */

GA.prototype.page = function(page, fn){
  var payload = mapper.page(page, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(this.handle(fn));
};

/**
 * Screen.
 *
 * @param {Screen} screen
 * @param {Function} callback
 */

GA.prototype.screen = function (screen, callback) {
  var payload = mapper.screen(screen, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(this.handle(callback));
};

/**
 * Get headers.
 *
 * @return {Object}
 */

GA.prototype._headers = function(message){
  return {
    'User-Agent': message.userAgent() || 'not set'
  };
};
