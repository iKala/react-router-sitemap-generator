"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs');

var convertor = require('xml-js');

var DEFAULT_CONFIG = {
  lastmod: new Date().toISOString().slice(0, 10),
  changefreq: 'monthly',
  priority: 0.8
};

var Generator = /*#__PURE__*/function () {
  function Generator(baseUrl, baseComponent) {
    _classCallCheck(this, Generator);

    if (! /*#__PURE__*/_react["default"].isValidElement(baseComponent)) {
      throw 'Invalid component. Try `Router()` instead of `Router`';
    }

    this._baseUrl = baseUrl;
    this._baseComponent = baseComponent;

    for (var _len = arguments.length, configs = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      configs[_key - 2] = arguments[_key];
    }

    this._configs = configs;
  }

  _createClass(Generator, [{
    key: "getXML",
    value: function getXML() {
      var paths = componentToPaths(this._baseComponent, this._baseUrl);
      return pathsToXml(this._baseUrl, paths, this._configs);
    }
  }, {
    key: "save",
    value: function save(path) {
      var paths = componentToPaths(this._baseComponent, this._baseUrl);
      var xml = pathsToXml(this._baseUrl, paths, this._configs);
      fs.writeFileSync(path, xml);
    }
  }]);

  return Generator;
}();

exports["default"] = Generator;

function componentToPaths(_baseComponent, baseURL) {
  var paths = [];
  var components = [_baseComponent];

  while (components.length !== 0) {
    var _component$props;

    var component = components.pop();
    if (! /*#__PURE__*/_react["default"].isValidElement(component)) continue;
    var props = component.props;
    if (props == null) continue;
    var path = props.path,
        propsComponents = props.component;

    _react["default"].Children.forEach(component === null || component === void 0 ? void 0 : (_component$props = component.props) === null || _component$props === void 0 ? void 0 : _component$props.children, function (child) {
      components.push(child);
    });

    if (component.type.name === 'Route') {
      if (path != null && typeof path === 'string') {
        paths.push(new URL(path, baseURL));
      }

      if (typeof propsComponents === 'function') {
        components.push(propsComponents({
          match: {
            url: path
          }
        }));
      }
    }
  }

  return paths;
}

function pathsToXml(baseUrl, paths, configs) {
  var options = {
    compact: true,
    spaces: 4
  };
  var map = {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'UTF-8'
      }
    },
    urlset: {
      url: paths.map(function (path) {
        return getUrlConfig(baseUrl, path, configs);
      }),
      _attributes: {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'
      }
    }
  };
  return convertor.js2xml(map, options);
}

function getUrlConfig(baseUrl, path, configs) {
  var loc = baseUrl + path;
  var defaultConfig;

  if (!configs) {
    return _objectSpread({
      loc: loc
    }, DEFAULT_CONFIG);
  }

  var config = configs.find(function (config) {
    var paths = config.paths;

    if (!paths) {
      defaultConfig = config;
      return false;
    }

    return paths.some(function (p) {
      return p.test(path);
    });
  });

  if (!config) {
    return _objectSpread({
      loc: loc
    }, defaultConfig || DEFAULT_CONFIG);
  }

  return _objectSpread({
    loc: loc
  }, config);
}