import { IMatcher, ParamMatcherM } from "livemock-core/struct/matcher";
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
    // İlk olarak standart body'den değeri almaya çalışalım
    const value = _.get(req.body, this.matcher.name);
    
    console.log(`[ParamMatcher] Matching param: ${this.matcher.name}, condition: ${this.matcher.conditions}, value: ${this.matcher.value}`);
    console.log(`[ParamMatcher] Request body:`, req.body);
    console.log(`[ParamMatcher] Found value:`, value);
    
    // Eğer değer bulunduysa, doğrudan eşleştirme yapalım
    if (value !== undefined) {
      const result = matchUtils.matchAnyValue(value, this.matcher);
      console.log(`[ParamMatcher] Direct match result:`, result);
      return result;
    }
    
    // Eğer istek multipart/form-data ise ve değer bulunamadıysa
    if (typeis.hasBody(req) && typeis(req, ["multipart"]) === "multipart") {
      console.log(`[ParamMatcher] Processing multipart/form-data request`);
      // rawBody'den multipart/form-data içeriğini ayrıştırmaya çalışalım
      try {
        // rawBody varsa işleyelim
        if ((req as any).rawBody) {
          const rawBody = (req as any).rawBody;
          console.log(`[ParamMatcher] Raw body length:`, rawBody.length);
          
          // Form-data sınırını (boundary) bulalım
          const contentType = req.headers['content-type'] || '';
          console.log(`[ParamMatcher] Content-Type:`, contentType);
          const boundaryMatch = contentType.match(/boundary=([^;]+)/);
          
          if (boundaryMatch && boundaryMatch[1]) {
            const boundary = boundaryMatch[1];
            console.log(`[ParamMatcher] Found boundary:`, boundary);
            
            // Form-data parçalarını ayıralım
            const parts = rawBody.split(`--${boundary}`);
            console.log(`[ParamMatcher] Found ${parts.length} parts`);
            
            // Her bir parçayı kontrol edelim
            for (const part of parts) {
              // İsim alanını kontrol edelim
              const nameMatch = part.match(/name="([^"]+)"/);
              
              // Eğer bu parça bizim aradığımız isimle eşleşiyorsa
              if (nameMatch && nameMatch[1] === this.matcher.name) {
                console.log(`[ParamMatcher] Found matching part for ${this.matcher.name}`);
                
                // JSON içeriğini bulmaya çalışalım
                const jsonMatch = part.match(/(\{[\s\S]*\})/);
                if (jsonMatch && jsonMatch[1]) {
                  try {
                    // JSON'ı ayrıştıralım
                    const jsonValue = JSON.parse(jsonMatch[1]);
                    console.log(`[ParamMatcher] Parsed JSON:`, jsonValue);
                    
                    // Eşleştirme için bu değeri kullanalım
                    const result = matchUtils.matchAnyValue(jsonValue, this.matcher);
                    console.log(`[ParamMatcher] JSON match result:`, result);
                    return result;
                  } catch (e) {
                    console.error("[ParamMatcher] JSON parsing error:", e);
                  }
                } else {
                  console.log(`[ParamMatcher] No JSON match found in part`);
                }
                
                // JSON değilse, düz metin olarak içeriği alalım
                const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
                if (contentMatch && contentMatch[1]) {
                  console.log(`[ParamMatcher] Found text content:`, contentMatch[1]);
                  const result = matchUtils.matchAnyValue(contentMatch[1], this.matcher);
                  console.log(`[ParamMatcher] Text match result:`, result);
                  return result;
                }
                
                // Hiçbir içerik bulunamadıysa, tüm parçayı kontrol edelim
                console.log(`[ParamMatcher] Checking entire part content`);
                const result = matchUtils.matchAnyValue(part, this.matcher);
                console.log(`[ParamMatcher] Part match result:`, result);
                return result;
              }
            }
            
            console.log(`[ParamMatcher] No matching part found for ${this.matcher.name}`);
          } else {
            console.log(`[ParamMatcher] No boundary found in Content-Type`);
          }
        } else {
          console.log(`[ParamMatcher] No rawBody found in request`);
        }
      } catch (e) {
        console.error("[ParamMatcher] Error parsing multipart/form-data:", e);
      }
    }
    
    // Standart işleme mantığı
    if (typeis.hasBody(req)) {
      const reqType = typeis(req, ["urlencoded", "json", "multipart"]);
      console.log(`[ParamMatcher] Request type:`, reqType);
      
      switch (reqType) {
        case "urlencoded":
          // parse urlencoded body
          console.log(`[ParamMatcher] Processing urlencoded request`);
          return matchUtils.matchAnyValue(value, this.matcher);
        case "json":
          // parse json body
          console.log(`[ParamMatcher] Processing JSON request`);
          return matchUtils.matchAnyValue(value, this.matcher);
        case "multipart":
          console.log(`[ParamMatcher] Processing multipart request (fallback)`);
          return matchUtils.matchAnyValue(value, this.matcher);
        default:
          console.log(`[ParamMatcher] Unknown request type`);
          return false;
      }
    } else {
      console.log(`[ParamMatcher] Request has no body`);
      return false;
    }
  }
}
export default ParamMatcherImpl;
