import { IMatcher, RawBodyMatcherM } from "livemock-core/struct/matcher";
import express from "express";
import * as matchUtils from "./matchUtils";

class RawBodyMatcherImpl implements IMatcher {
  matcher: RawBodyMatcherM;

  constructor(matcher: RawBodyMatcherM) {
    this.matcher = matcher;
  }

  match(req: express.Request): boolean {
    console.log(`[RawBodyMatcher] Matching raw body with condition: ${this.matcher.conditions}, value: ${this.matcher.value}`);
    
    // rawBody'yi kontrol et
    if ((req as any).rawBody) {
      const rawBody = (req as any).rawBody;
      console.log(`[RawBodyMatcher] Raw body length: ${rawBody.length}`);
      
      // rawBody'yi string olarak eşleştir
      const result = matchUtils.stringMatchCondition(
        rawBody,
        this.matcher.conditions,
        this.matcher.value
      );
      
      console.log(`[RawBodyMatcher] Match result: ${result}`);
      return result;
    } else {
      console.log(`[RawBodyMatcher] No raw body found in request`);
      return false;
    }
  }
}

export default RawBodyMatcherImpl; 