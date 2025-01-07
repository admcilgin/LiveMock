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
    
    if (typeis.hasBody(req)) {
      if (typeis(req, ["multipart"]) && req.body.data) {
        try {
          const jsonData = typeof req.body.data === 'string' ? 
            JSON.parse(req.body.data) : req.body.data;
          value = _.get(jsonData, this.matcher.name);
        } catch (e) {
          value = _.get(req.body, this.matcher.name);
        }
      } else {
        value = _.get(req.body, this.matcher.name);
      }

      return matchUtils.matchAnyValue(value, this.matcher);
    }
    
    return false;
  }
}

export default ParamMatcherImpl;
