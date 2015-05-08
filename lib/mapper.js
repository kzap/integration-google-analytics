'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var extend = require('lodash.assign');
var fmt = require('util').format;
var hash = require('string-hash');
var is = require('is');
var lookup = require('obj-case');
var parse = require('url').parse;
var pick = require('lodash.pick');
var reduce = require('lodash.reduce');
var values = require('lodash.values');

/**
 * Map page msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @api public
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings){
  var result = createPageDataForm(page, createCommonGAForm(page, settings));
  var ref = page.referrer();
  if (ref) result.dr = ref;
  result.dt = page.fullName();
  result.t = 'pageview';

  if (typeof url !== 'string') return result;

  return result;
};

/**
 * Map screen msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#screenView
 *
 * @api public
 * @param {Screen} screen
 * @param {Object} settings
 * @return {Object}
 */

exports.screen = function(screen, settings){
  var result = createCommonGAForm(screen, settings);
  result.cd = screen.name();
  result.t = 'screenview';

  return result;
};

/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 *
 * @api public
 * @param {Page} track
 * @param {Object} settings
 * @return {Object}
 */

exports.track = function(track, settings){
  var result = createPageDataForm(track, createCommonGAForm(track, settings));
  result.ev = Math.round(track.value() || track.revenue() || 0);
  result.el = track.proxy('properties.label') || 'event';
  result.ec = track.category() || 'All';
  result.ea = track.event();
  result.t = 'event';
  result.ni = track.proxy('properties.nonInteraction') || settings.nonInteraction;

  return result;
};

/**
 * Map Clicked Product.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 */

exports.clickedProduct = function(track, settings){
  return extend(
    {
      ea: track.event(),
      ec: track.field('category') || 'EnhancedEcommerce',
      pa: 'click',
      t: 'event'
    },
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Added Product.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.addedProduct = function(track, settings){
  return extend(
    {
      ea: track.event(),
      ec: track.field('category') || 'EnhancedEcommerce',
      pa: 'add',
      t: 'event'
    },
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Removed Product.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.removedProduct = function(track, settings){
  return extend(
    {
      ea: track.event(),
      ec: track.field('category') || 'EnhancedEcommerce',
      pa: 'remove',
      t: 'event'
    },
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Started Order.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.startedOrder = function(track, settings){
  // FIXME: Should this actually be a pageview? Seems like it should be an event
  return exports.viewedCheckoutStep(track, settings);
};

/**
 * Map Updated Order.
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-steps
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *    - pa       ('checkout') ?
 *    - pr{x}{x} (.properties.products[x].z)
 *    - t        ('pageview') TODO: right?
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.updatedOrder = function(track, settings){
  // FIXME: Should this actually be a pageview? Seems like it should be an event
  return exports.viewedCheckoutStep(track, settings);
};

/**
 * Map Completed Checkout Step.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    TODO: Is this option, or options?
 *    - col      (.properties.option(s?))
 *    - cos      (.properties.step)
 *    - ea       (.event)
 *    - ec       (.category)
 *    - pa       ('checkout_option')
 *    - t        ('event')
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.completedCheckoutStep = function(track, settings){
  var renames = {
    option: 'col',
    step: 'cos'
  };

  return extend(
    {
      pa: 'checkout_option',
      t: 'event',
      ea: track.event(),
      ec: track.category() || 'EnhancedEcommerce'
    },
    createCommonGAForm(track, settings),
    pick(track.properties(renames), values(renames))
  );
};

/**
 * Map Viewed Checkout Step.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    TODO: Is this option, or options?
 *    - col      (.properties.option(s?)) checkout step option
 *    - cos      (.properties.step) checkout step
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - dt       (.context.page.title)
 *    - pa       ('checkout')
 *    - pr{x}br  (.properties.products[x].brand) product x brand
 *    - pr{x}ca  (.properties.products[x].category) product x category
 *    - pr{x}id  (.properties.products[x].id) product x id
 *    - pr{x}nm  (.properties.products[x].name) product x name (either this or id is required)
 *    - pr{x}pr  (.properties.products[x].price) product x price
 *    - pr{x}qt  (.properties.products[x].quantity) product x qty
 *    - pr{x}va  (.properties.products[x].variant) product x variant
 *    - t        ('pageview')
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *    - ni       (1)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

// TODO: Should this be a noninteraction event?
exports.viewedCheckoutStep = function(track, settings){
  var renames = {
    step: 'cos',
    option: 'col'
  };

  return extend(
    {
      ea: track.event(),
      ec: track.category() || 'EnhancedEcommerce',
      ni: 1,
      pa: 'checkout',
      t: 'pageview'
    },
    createCommonGAForm(track, settings),
    formatProducts(track.products()),
    formatPage(track),
    pick(track.properties(renames), values(renames))
  );
};

/**
 * Map Completed Order.
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
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object[]}
 */

exports.completedOrder = function(track, settings){
  var currency = track.currency();
  var orderId = track.orderId();
  var products = track.products();

  var transaction = createPageDataForm(track, createCommonGAForm(track, settings));
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  products = products.map(function(product){
    product = new Track({ properties: product });
    var item = createCommonGAForm(track, settings);
    item.iq = product.quantity();
    item.iv = product.category();
    item.ip = product.price();
    item.in = product.name();
    item.ic = product.sku();
    item.cu = currency;
    item.ti = orderId;
    item.t = 'item';
    return item;
  });

  return [transaction].concat(products);
};

/**
 * Map Refunded Order.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - ea       (.event)
 *    - ec       (.category)
 *    - ni       (1)
 *    - pa       ('refund')
 *    - t        ('event')
 *    - ti       (.properties.orderId)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

// FIXME: Multiple products?
exports.refundedOrder = function(track, settings){
  var renames = { orderId: 'ti' };

  return extend(
    // Extract call-specific properties.
    {
      ea: track.event(),
      ec: track.category() || 'EnhancedEcommerce',
      ni: 1,
      pa: 'refund',
      t: 'event'
    },
    // Extract common items.
    createCommonGAForm(track, settings),
    // Extract properties.
    pick(track.properties(renames), values(renames))
  );
};

/**
 * Map Viewed Promotion.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - dt       (.context.page.title)
 *    - promo1cr (.properties.creative)
 *    - promo1id (.properties.id)
 *    - promo1nm (.properties.name)
 *    - promo1ps (.properties.position)
 *    - t        (=pageview)
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * FIXME: Should this be a ni event?
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.viewedPromotion = function(track, settings){
  var renames = {
    creative: 'promo1cr',
    id: 'promo1id',
    name: 'promo1nm',
    position: 'promo1ps'
  };

  return extend(
    // Root-level and static properties
    { t: 'pageview' },
    formatPage(track),
    // Promotion-specific properties
    createCommonGAForm(track, settings),
    // Shared properties
    pick(track.properties(renames), values(renames))
  );
};

/**
 * Map Clicked Promotion.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - ea       (.event)
 *    - ec       (.category)
 *    - el       (.properties.label)
 *    - promo1cr (.properties.creative)
 *    - promo1id (.properties.id)
 *    - promo1nm (.properties.name)
 *    - promo1ps (.properties.position)
 *    - promoa   ( =click)
 *    - t        ( =event)
 *    - cid      (set in createCommonGAForm)
 *    - tid      (set in createCommonGAForm)
 *    - v        (set in createCommonGAForm)
 *
 * FIXME: Should this be a ni event?
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.clickedPromotion = function(track, settings){
  // Map a list of properties to its corresponding GA property name
  var renames = {
    creative: 'promo1cr',
    id: 'promo1id',
    label: 'el',
    name: 'promo1nm',
    position: 'promo1ps'
  };

  return extend(
    // TODO: Filter where returns `undefined`
    // Root-level and static properties
    {
      ea: track.event(),
      ec: track.category() || 'EnhancedEcommerce',
      promoa: 'click',
      t: 'event'
    },
    // Promotion-specific properties
    createCommonGAForm(track, settings),
    // Shared properties
    pick(track.properties(renames), values(renames))
  );
};

/**
 * Create common GA form.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @api private
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 */

function createCommonGAForm(facade, settings){
  var library = facade.proxy('context.library');
  var trackingId = isMobile(library) ? settings.mobileTrackingId || settings.serversideTrackingId : settings.serversideTrackingId;
  var cid = hash(facade.userId() || facade.anonymousId());
  var campaign = facade.proxy('context.campaign') || {};
  var properties = facade.field('properties') || {};
  var screen = facade.proxy('context.screen') || {};
  var locale = facade.proxy('context.locale');
  var app = facade.proxy('context.app') || {};
  var traits = facade.traits();

  var options = facade.options('Google Analytics');
  if (options && is.string(options.clientId)) cid = options.clientId;

  var form = extend(
    metrics(traits, settings),
    metrics(properties, settings)
  );
  form.cid = cid;
  form.tid = trackingId;
  form.v = 1;

  // campaign
  if (campaign.name) form.cn = campaign.name;
  if (campaign.source) form.cs = campaign.source;
  if (campaign.medium) form.cm = campaign.medium;
  if (campaign.content) form.cc = campaign.content;

  // screen
  if (screen.height && screen.width) {
    form.sr = fmt('%sx%s', screen.width, screen.height);
  }

  // locale
  if (locale) form.ul = locale;

  // app
  if (app.name) form.an = app.name;
  if (app.version) form.av = app.version;
  if (app.appId) form.aid = app.appId;
  if (app.appInstallerId) form.aiid = app.appInstallerId;

  if (settings.sendUserId && facade.userId()) form.uid = facade.userId();
  if (facade.userAgent()) form.ua = facade.userAgent();
  if (facade.ip()) form.uip = facade.ip();

  return form;
}

/**
 * Adds hostname and path
 *
 * @api private
 * @param {Object} facade
 * @param {Object} form
 * @return {Object}
 */

function createPageDataForm(facade, form){
  var url = facade.proxy('properties.url') || facade.proxy('context.page.url');
  if (!is.string(url)) return form; 

  var parsed = parse(url || '');
  if (parsed.hostname) form.dh = parsed.hostname;
  if (parsed.path) form.dp = parsed.path;

  return form;
}

/**
 * Map google's custom dimensions & metrics with `obj`.
 *
 * Example:
 *
 *      metrics({ revenue: 1.9 }, { { metrics : { revenue: 'metric8' } });
 *      // => { metric8: 1.9 }
 *
 *      metrics({ revenue: 1.9 }, {});
 *      // => {}
 *
 * @api private
 * @param {Object} obj
 * @param {Object} data
 * @return {Object|null}
 */

function metrics(obj, data){
  var dimensions = data.dimensions || {};
  var metrics = data.metrics || {};
  var names = Object.keys(metrics).concat(Object.keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = shorten(metrics[name] || dimensions[name]);
    var value = lookup(obj, name) || obj[name];
    if (value == null) continue;
    if (key) ret[key] = value;
  }

  return ret;
}

/**
 * Shorten `metric\d+` or `dimension\d+` to `cm\d+`, `cd\d+`.
 *
 * Example:
 *
 *    shorten('metric99'); // => cm99
 *    shorten('dimension57'); // => cd57
 *
 * @api private
 * @param {string} name
 * @return {string}
 */

function shorten(name){
  var match = name.match(/^metric(\d+)$/);
  if (match) return 'cm' + match[1];
  match = name.match(/^dimension(\d+)$/);
  if (match) return 'cd' + match[1];
}

/**
 * Determine whether the request is being made directly on behalf of a
 * mobile device (iOS, android, Xamarin).
 *
 * @api private
 * @param {Object|String} library
 * @return {Boolean}
 */

function isMobile(library){
  if (!library) return false;
  return contains('ios') || contains('android') || contains('analytics.xamarin');

  function contains(str) {
    return name().toLowerCase().indexOf(str) !== -1;
  }

  function name() {
    return typeof library === 'string' ? library : library.name;
  }
}

/**
 * Return a copy of an object, less an  `undefined` values.
 *
 * @param {Object} obj
 * @return {Object}
 */

function compactObject(obj) {
  return reduce(obj, function(result, val, key){
    if (val !== undefined) {
      result[key] = val;
    }
    return result;
  }, {});
}

/**
 * Format context.page into GA-compatible key-value pairs.
 *
 * @param {Track} track
 * @return {Object}
 */

function formatPage(track){
  var parsedUrl = parse(track.proxy('context.page.url') || '');

  return compactObject({
    dh: parsedUrl.hostname || undefined,
    dp: parsedUrl.pathname || undefined,
    dt: track.proxy('context.page.title')
  });
}

/**
 * Format a single product (from an ecommerce #track call) into a GA-compatible
 * set of key-value pairs.
 *
 * @api private
 * @param {Object} product
 * @param {number} [index=1]
 * @return {Object}
 * @example
 * formatProduct({ id: 9, name: 'Toothbrush' });
 * // => { pr1id: 9, pr1nm: 'Toothbrush' }
 */

function formatProduct(product, index){
  if (index === undefined) index = 1;

  var prefix = 'pr' + index;
  var renames = {
    brand: prefix + 'br',
    category: prefix + 'ca',
    id: prefix + 'id',
    name: prefix + 'nm',
    price: prefix + 'pr',
    quantity: prefix + 'qty',
    variant: prefix + 'va'
  };
  var productFacade = new Track({ properties: product });

  return pick(productFacade.properties(renames), values(renames));
}

/**
 * Format a list of products (from an ecommerce #track call) into a
 * GA-compatible set of key-value pairs.
 *
 * @api private
 * @param {Object[]} products A list of products.
 * @return {Object}
 * @example
 * var products = [
 *   { id: 9, name: 'Toothbrush' },
 *   { id: 33, name: 'Toothpaste' },
 * ];
 * formatProducts(products);
 * // => { pr1id: 9, pr1nm: 'Toothbrush', pr2id: 33, pr2nm: 'Toothpaste' }
 */

function formatProducts(products){
  return reduce(products, function(result, product, i) {
    return extend(result, formatProduct(product, i + 1));
  }, {});
}
