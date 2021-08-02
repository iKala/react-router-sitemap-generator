// @flow strict

const fs = require('fs');
const convertor = require('xml-js');
import type { MixedElement } from 'react';
import React from 'react';

const DEFAULT_CONFIG = {
  lastmod: new Date().toISOString().slice(0, 10),
  changefreq: 'monthly',
  priority: 0.8,
};

export type Config = {
  lastmod?: string,
  changefreq?: string,
  priority?: number,
};

export type UrlConfig = {
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number,
};

export default class Generator {
  _baseUrl: string;
  _baseComponent: MixedElement;
  _configs: ?Array<Config>;

  constructor(baseUrl: string, baseComponent: MixedElement, ...configs: Array<Config>) {
    if (!React.isValidElement(baseComponent)) {
      throw 'Invalid component. Try `Router()` instead of `Router`';
    }
    this._baseUrl = baseUrl;
    this._baseComponent = baseComponent;
    this._configs = configs;
  }

  getXML(): string {
    const paths = componentToPaths(this._baseComponent, this._baseUrl);
    return pathsToXml(this._baseUrl, paths, this._configs);
  }

  save(path: string) {
    const paths = componentToPaths(this._baseComponent, this._baseUrl);
    const xml = pathsToXml(this._baseUrl, paths, this._configs);
    fs.writeFileSync(path, xml);
  }
}

function componentToPaths(
  _baseComponent: MixedElement,
  baseURL: string
): Array<URL> {
  const paths: Array<URL> = [];
  const components: Array<any> = [_baseComponent];
  while (components.length !== 0) {
    const component = components.pop();
    if (!React.isValidElement(component)) continue;
    const { props } = component;
    if (props == null) continue;
    const { path, component: propsComponents } = props;
    React.Children.forEach(
      component?.props?.children,
      (child: MixedElement) => {
        components.push(child);
      }
    );
    if (component.type.name === 'Route') {
      if (path != null && typeof path === 'string') {
        paths.push(new URL(path, baseURL));
      }
      if (typeof propsComponents === 'function') {
        components.push(propsComponents({ match: { url: path } }));
      }
    }
  }
  return paths;
}

function pathsToXml(
  baseUrl: string,
  paths: Array<URL>,
  configs: ?Array<Config>
): string {
  const options = { compact: true, spaces: 4 };
  const map = {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'UTF-8',
      },
    },
    urlset: {
      url: paths.map((path) => {
        return getUrlConfig(baseUrl, path.pathname, configs);
      }),
      _attributes: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
    },
  };
  return convertor.js2xml(map, options);
}

function getUrlConfig(baseUrl: string, path: string, configs: ?Array<Config>): UrlConfig {
  const loc = baseUrl + path;
  let defaultConfig;

  if(!configs) {
    return {
      loc,
      ...DEFAULT_CONFIG
    };
  }

  const config = configs.find(config => {
    const {paths} = config;

    if(!paths) {
      defaultConfig = config;
      return false;
    }

    return paths.some(p => p.test(path));
  });

  if(!config) {
    return {
      loc,
      ...defaultConfig || DEFAULT_CONFIG
    }
  }

  return {
    loc,
    lastmod: config.lastmod,
    changefreq: config.changefreq,
    priority: config.priority
  };
}
