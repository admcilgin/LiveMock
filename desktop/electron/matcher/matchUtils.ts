import {
  MatcherCondition,
  RequestMatcherM,
  RequestMatcherType,
  StringMatcherCondition,
} from "livemock-core/struct/matcher";
import _ from "lodash";
import MethodMatcher from "./MethodMatcher";
import PathMatcher from "./PathMatcher";
import HeaderMatcher from "./HeaderMatcher";
import QueryMatcher from "./QueryMatcher";
import ParamMatcher from "./ParamMatcher";
import RawBodyMatcher from "./RawBodyMatcher";
import micromatch from "micromatch";

export const stringMatchCondition = (
  left: string,
  condition: StringMatcherCondition,
  right: string
) => {
  console.log(`[stringMatchCondition] Comparing: "${left}" ${condition} "${right}"`);
  
  let result = false;
  switch (condition) {
    case MatcherCondition.IS:
      result = left === right;
      break;
    case MatcherCondition.START_WITH:
      result = left.startsWith(right);
      break;
    case MatcherCondition.CONTAINS:
      result = left.indexOf(right) != -1;
      break;
    case MatcherCondition.END_WITH:
      result = left.endsWith(right);
      break;
    case MatcherCondition.IS_NOT:
      result = left !== right;
      break;
    case MatcherCondition.NOT_CONTAINS:
      result = left.indexOf(right) == -1;
      break;
    case MatcherCondition.SHOWED:
      result = left == null;
      break;
    case MatcherCondition.NOT_SHOWED:
      result = left != null;
      break;
    case MatcherCondition.MATCH_REGEX:
      result = regexMatch(left, right);
      break;
    case MatcherCondition.NOT_MATCH_REGEX:
      result = !regexMatch(left, right);
      break;
    case MatcherCondition.MATCH_GLOB:
      result = globMatch(left, right);
      break;
    case MatcherCondition.NO_MATCH_GLOB:
      result = !globMatch(left, right);
      break;
    default:
      result = false;
  }
  
  console.log(`[stringMatchCondition] Result: ${result}`);
  return result;
};

export function regexMatch(valueStr: string, regexStr: string) {
  try {
    console.log(`[regexMatch] Testing: "${valueStr}" against regex "${regexStr}"`);
    let regExp: RegExp;
    if (regexStr.startsWith("/")) {
      let pattern = regexStr.slice(1, regexStr.lastIndexOf("/"));
      let modified = regexStr.slice(regexStr.lastIndexOf("/") + 1);
      regExp = new RegExp(pattern, modified);
    } else {
      regExp = new RegExp(regexStr);
    }
    const result = regExp.test(valueStr);
    console.log(`[regexMatch] Result: ${result}`);
    return result;
  } catch (e) {
    console.error(`[regexMatch] Error:`, e);
    return false;
  }
}

export function globMatch(valueStr: string, pattern: string) {
  console.log(`[globMatch] Testing: "${valueStr}" against pattern "${pattern}"`);
  const result = micromatch.isMatch(valueStr, pattern);
  console.log(`[globMatch] Result: ${result}`);
  return result;
}

// JSON nesnelerini karşılaştırmak için yardımcı fonksiyon
export function jsonContains(obj: any, searchValue: string): boolean {
  try {
    console.log(`[jsonContains] Checking if object contains: "${searchValue}"`);
    console.log(`[jsonContains] Object:`, obj);
    
    // Eğer searchValue bir JSON string ise, onu nesneye dönüştürmeyi deneyelim
    let searchObj;
    try {
      searchObj = JSON.parse(searchValue);
      console.log(`[jsonContains] Parsed search value as object:`, searchObj);
    } catch (e) {
      // JSON olarak ayrıştırılamıyorsa, string olarak devam edelim
      console.log(`[jsonContains] Search value is not valid JSON, using as string`);
      searchObj = null;
    }

    // Eğer searchObj bir nesne ise, nesne içinde arama yapalım
    if (searchObj && typeof searchObj === 'object' && !Array.isArray(searchObj)) {
      console.log(`[jsonContains] Searching for object properties in target object`);
      
      const result = Object.entries(searchObj).every(([key, val]) => {
        // Nesnenin içinde key var mı kontrol edelim
        console.log(`[jsonContains] Checking key: "${key}"`);
        if (!_.has(obj, key)) {
          console.log(`[jsonContains] Key "${key}" not found in object`);
          return false;
        }
        
        // Değer eşleşiyor mu kontrol edelim
        const objVal = _.get(obj, key);
        console.log(`[jsonContains] Comparing values: `, val, objVal);
        
        // Değerler nesne ise recursive olarak kontrol edelim
        if (typeof val === 'object' && val !== null && typeof objVal === 'object' && objVal !== null) {
          console.log(`[jsonContains] Both values are objects, checking recursively`);
          return jsonContains(objVal, JSON.stringify(val));
        }
        
        // Değerler string ise doğrudan karşılaştıralım
        const valMatch = objVal === val;
        console.log(`[jsonContains] Direct value comparison result: ${valMatch}`);
        return valMatch;
      });
      
      console.log(`[jsonContains] Object property search result: ${result}`);
      return result;
    }
    
    // Eğer searchValue bir string ise, JSON stringi içinde arama yapalım
    console.log(`[jsonContains] Searching for string in JSON representation`);
    const jsonStr = JSON.stringify(obj);
    console.log(`[jsonContains] JSON string:`, jsonStr);
    const result = jsonStr.includes(searchValue);
    console.log(`[jsonContains] String search result: ${result}`);
    return result;
  } catch (e) {
    console.error(`[jsonContains] Error:`, e);
    return false;
  }
}

// Alternatif JSON eşleştirme fonksiyonu - daha basit ve doğrudan
export function simpleJsonContains(obj: any, searchValue: string): boolean {
  try {
    console.log(`[simpleJsonContains] Checking if object contains: "${searchValue}"`);
    
    // Nesneyi JSON string'e dönüştür
    const jsonStr = JSON.stringify(obj);
    
    // searchValue'yu temizle (tırnak işaretleri, kaçış karakterleri vb.)
    const cleanSearchValue = searchValue
      .replace(/\\"/g, '"')  // Kaçış karakterli tırnakları düzelt
      .replace(/^"|"$/g, ''); // Başlangıç ve bitişteki tırnakları kaldır
    
    console.log(`[simpleJsonContains] JSON string: "${jsonStr}"`);
    console.log(`[simpleJsonContains] Clean search value: "${cleanSearchValue}"`);
    
    // Basit string içerme kontrolü
    const result = jsonStr.includes(cleanSearchValue);
    console.log(`[simpleJsonContains] Result: ${result}`);
    return result;
  } catch (e) {
    console.error(`[simpleJsonContains] Error:`, e);
    return false;
  }
}

export function matchAnyValue(
  value: string | undefined | Array<any> | Object,
  matcher: RequestMatcherM
): boolean {
  console.log(`[matchAnyValue] Matching value:`, value);
  console.log(`[matchAnyValue] Matcher:`, matcher);
  
  if (typeof value === "undefined") {
    console.log(`[matchAnyValue] Value is undefined`);
    if (matcher.conditions === MatcherCondition.NOT_SHOWED) {
      console.log(`[matchAnyValue] Condition is NOT_SHOWED, returning true`);
      return true;
    } else {
      console.log(`[matchAnyValue] Condition is not NOT_SHOWED, returning false`);
      return false;
    }
  } else if (typeof value === "string") {
    console.log(`[matchAnyValue] Value is string: "${value}"`);
    return stringMatchCondition(
      value,
      matcher.conditions as StringMatcherCondition,
      matcher.value
    );
  } else if (typeof value === "object") {
    console.log(`[matchAnyValue] Value is object`);
    
    if (_.isArray(value)) {
      console.log(`[matchAnyValue] Value is array`);
      switch (matcher.conditions) {
        case MatcherCondition.CONTAINS:
        case MatcherCondition.SHOWED:
          const containsResult = (value as Array<any>).includes(matcher.value);
          console.log(`[matchAnyValue] Array contains check result: ${containsResult}`);
          return containsResult;
        case MatcherCondition.NOT_CONTAINS:
        case MatcherCondition.NOT_SHOWED:
          const notContainsResult = !(value as Array<any>).includes(matcher.value);
          console.log(`[matchAnyValue] Array not contains check result: ${notContainsResult}`);
          return notContainsResult;
        default:
          console.log(`[matchAnyValue] Unsupported condition for array, returning false`);
          return false;
      }
    } else {
      // Nesne için eşleştirme mantığı
      console.log(`[matchAnyValue] Value is plain object`);
      
      switch (matcher.conditions) {
        case MatcherCondition.CONTAINS:
          // Önce basit eşleştirme deneyelim
          const simpleResult = simpleJsonContains(value, matcher.value);
          if (simpleResult) {
            console.log(`[matchAnyValue] Simple JSON contains check succeeded`);
            return true;
          }
          
          // Basit eşleştirme başarısız olursa, detaylı eşleştirme deneyelim
          const containsResult = jsonContains(value, matcher.value);
          console.log(`[matchAnyValue] JSON contains check result: ${containsResult}`);
          return containsResult;
          
        case MatcherCondition.NOT_CONTAINS:
          const notContainsResult = !jsonContains(value, matcher.value) && !simpleJsonContains(value, matcher.value);
          console.log(`[matchAnyValue] JSON not contains check result: ${notContainsResult}`);
          return notContainsResult;
          
        case MatcherCondition.SHOWED:
          console.log(`[matchAnyValue] Object exists, returning true for SHOWED`);
          return true;
          
        case MatcherCondition.NOT_SHOWED:
          console.log(`[matchAnyValue] Object exists, returning false for NOT_SHOWED`);
          return false;
          
        case MatcherCondition.IS:
          try {
            const matcherObj = JSON.parse(matcher.value);
            const isEqual = _.isEqual(value, matcherObj);
            console.log(`[matchAnyValue] Object equality check result: ${isEqual}`);
            return isEqual;
          } catch (e) {
            console.error(`[matchAnyValue] Error parsing matcher value as JSON:`, e);
            return false;
          }
          
        default:
          // Nesneyi string'e dönüştürüp normal string eşleştirme yapabiliriz
          try {
            const valueStr = JSON.stringify(value);
            console.log(`[matchAnyValue] Converting object to string for comparison: "${valueStr}"`);
            return stringMatchCondition(
              valueStr,
              matcher.conditions as StringMatcherCondition,
              matcher.value
            );
          } catch (e) {
            console.error(`[matchAnyValue] Error stringifying object:`, e);
            return false;
          }
      }
    }
  }
  
  console.log(`[matchAnyValue] Value type not supported, returning false`);
  return false;
}

export const getMatcherImpl = (matcher: RequestMatcherM) => {
  if (matcher.type == RequestMatcherType.METHOD) {
    return new MethodMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.PATH) {
    return new PathMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.HEADER) {
    return new HeaderMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.QUERY) {
    return new QueryMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.PARAM) {
    return new ParamMatcher(matcher);
  } else if (matcher.type == RequestMatcherType.RAWBODY) {
    return new RawBodyMatcher(matcher);
  } else {
    return null;
  }
};
