import { IMatcher, ParamMatcherM } from "core/struct/matcher";
import express from "express";
import typeis from "type-is";
import _ from "lodash";
import * as matchUtils from "./matchUtils";

class ParamMatcherImpl implements IMatcher {
  matcher: ParamMatcherM;

  constructor(matcher: ParamMatcherM) {
    this.matcher = matcher;
  }

  match(req: express.Request): boolean {
    let value;
    
    // Multipart form-data içindeki JSON'ı parse et
    if (typeis(req, ["multipart"]) && req.body.data) {
      try {
        const jsonData = JSON.parse(req.body.data);
        value = _.get(jsonData, this.matcher.name);
      } catch (e) {
        value = _.get(req.body, this.matcher.name);
      }
    } else {
      value = _.get(req.body, this.matcher.name);
    }

    if (typeis.hasBody(req)) {
      switch (typeis(req, ["urlencoded", "json", "multipart"])) {
        case "urlencoded":
          return matchUtils.matchAnyValue(value, this.matcher);
        case "json":
          return matchUtils.matchAnyValue(value, this.matcher);
        case "multipart":
          return matchUtils.matchAnyValue(value, this.matcher);
        default:
          return false;
      }
    } else {
      return false;
    }
  }
}

export default ParamMatcherImpl;
