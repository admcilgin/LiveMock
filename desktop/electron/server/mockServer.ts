import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Collection } from "lokijs";
import { ExpectationM } from "livemock-core/struct/expectation";
import {
  getExpectationCollection,
  getExpectationDb,
  getLogCollection,
  setNewestLogNumber,
} from "../db/dbManager";
import arrayUtils from "../util/arrayUtils";
import { IMatcher } from "livemock-core/struct/matcher";
import { getMatcherImpl } from "../matcher/matchUtils";
import { getActionImpl } from "../action/common";
import { insertReqLog, insertResLog } from "../log/logUtils";
import * as http from "http";
import { LogM } from "livemock-core/struct/log";

// default is 10mb
const MaxRawBodySize = 10 * 1024 * 1024;

// Multipart/form-data içeriğini ayrıştırmak için yardımcı fonksiyon
function parseMultipartFormData(req: Request): void {
  try {
    console.log("[parseMultipartFormData] Starting to parse multipart/form-data");
    
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      console.log("[parseMultipartFormData] Not a multipart/form-data request");
      return;
    }

    // rawBody varsa işleyelim
    if ((req as any).rawBody) {
      const rawBody = (req as any).rawBody;
      console.log("[parseMultipartFormData] Raw body length:", rawBody.length);
      
      // Form-data sınırını (boundary) bulalım
      const contentType = req.headers['content-type'] || '';
      console.log("[parseMultipartFormData] Content-Type:", contentType);
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      
      if (boundaryMatch && boundaryMatch[1]) {
        const boundary = boundaryMatch[1];
        console.log("[parseMultipartFormData] Found boundary:", boundary);
        
        // Form-data parçalarını ayıralım
        const parts = rawBody.split(`--${boundary}`);
        console.log("[parseMultipartFormData] Found", parts.length, "parts");
        
        // Eğer req.body tanımlı değilse, oluşturalım
        if (!req.body) {
          req.body = {};
        }
        
        // Her bir parçayı işleyelim
        for (const part of parts) {
          // İsim alanını kontrol edelim
          const nameMatch = part.match(/name="([^"]+)"/);
          
          if (nameMatch && nameMatch[1]) {
            const fieldName = nameMatch[1];
            console.log("[parseMultipartFormData] Found field:", fieldName);
            
            // JSON içeriğini bulmaya çalışalım
            if (part.includes('application/json')) {
              console.log("[parseMultipartFormData] Field contains JSON data");
              const jsonMatch = part.match(/(\{[\s\S]*\})/);
              if (jsonMatch && jsonMatch[1]) {
                try {
                  // JSON'ı ayrıştıralım
                  const jsonValue = JSON.parse(jsonMatch[1]);
                  console.log("[parseMultipartFormData] Parsed JSON:", jsonValue);
                  req.body[fieldName] = jsonValue;
                } catch (e) {
                  console.error("[parseMultipartFormData] JSON parsing error:", e);
                  // JSON ayrıştırma başarısız olursa, ham metni kullan
                  const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
                  if (contentMatch && contentMatch[1]) {
                    console.log("[parseMultipartFormData] Using raw content as fallback");
                    req.body[fieldName] = contentMatch[1];
                  }
                }
              } else {
                console.log("[parseMultipartFormData] No JSON match found in part");
              }
            } else {
              // JSON değilse, düz metin olarak içeriği alalım
              const contentMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n--/);
              if (contentMatch && contentMatch[1]) {
                console.log("[parseMultipartFormData] Found text content:", contentMatch[1]);
                req.body[fieldName] = contentMatch[1];
              } else {
                // Alternatif regex deneme
                const altMatch = part.match(/\r\n\r\n([\s\S]*)/);
                if (altMatch && altMatch[1]) {
                  console.log("[parseMultipartFormData] Found text content (alt):", altMatch[1]);
                  req.body[fieldName] = altMatch[1].trim();
                }
              }
            }
          }
        }
        
        console.log("[parseMultipartFormData] Final request body:", req.body);
      } else {
        console.log("[parseMultipartFormData] No boundary found in Content-Type");
      }
    } else {
      console.log("[parseMultipartFormData] No rawBody found in request");
    }
  } catch (e) {
    console.error("[parseMultipartFormData] Error parsing multipart/form-data:", e);
  }
}

const getMockRouter: (
  path: string,
  projectId: string
) => Promise<express.Router> = async (path, projectId) => {
  let router = express.Router();
  const expectationCollection = await getExpectationCollection(projectId, path);
  const logCollection = await getLogCollection(projectId, path);
  let newestLogIndex = 100000;
  // set the newest log number;
  const logMs: Array<LogM> = logCollection
    .chain()
    .find({})
    .simplesort("id", { desc: true })
    .limit(1)
    .data();
  if (logMs.length >= 1) {
    newestLogIndex = logMs[0].id + 1;
  }
  setNewestLogNumber(projectId, path, newestLogIndex);

  // Ham istek gövdesini yakalamak için middleware
  router.use((req: Request, res: Response, next) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      (req as any).rawBody = data;
      next();
    });
  });

  // Multipart/form-data isteklerini işlemek için middleware
  router.use((req: Request, res: Response, next) => {
    // Multipart/form-data içeriğini ayrıştır
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log("[mockServer] Processing multipart/form-data request");
      parseMultipartFormData(req);
    }
    next();
  });

  // Standart body parser
  router.use(
    bodyParser({
      verify(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        buf: Buffer,
        encoding: string
      ) {
        if (buf.length < MaxRawBodySize) {
          (req as unknown as { rawBody: string }).rawBody = buf.toString(
            encoding as BufferEncoding
          );
        }
      },
    })
  );

  router.all("*", async (req: Request, res: Response) => {
    console.log("[mockServer] Received request:", req.method, req.path);
    console.log("[mockServer] Request headers:", req.headers);
    console.log("[mockServer] Request body:", req.body);
    console.log("[mockServer] Raw body available:", !!(req as any).rawBody);
    
    const expectations = expectationCollection
      .chain()
      .find({ activate: true })
      .compoundsort([
        ["priority", true],
        ["createTime", false],
      ])
      .data();
    
    console.log("[mockServer] Found", expectations.length, "active expectations");
    
    await arrayUtils.first(
      expectations,
      async (expectation, expectationIndex) => {
        console.log("[mockServer] Checking expectation:", expectation.name || expectation.id);
        
        let allValid = arrayUtils.validAll(
          expectation.matchers,
          (matcher, matcherIndex) => {
            let matchImpl: IMatcher | null = getMatcherImpl(matcher);
            console.log("[mockServer] Checking matcher:", matcher.type, matcher.conditions, matcher.value);
            
            if (matchImpl) {
              const result = matchImpl.match(req);
              console.log("[mockServer] Matcher result:", result);
              return result;
            } else {
              console.log("[mockServer] No matcher implementation found");
              return false;
            }
          }
        );
        
        console.log("[mockServer] All matchers valid:", allValid);
        
        if (allValid) {
          if (expectation.actions.length !== 0) {
            console.log("[mockServer] Executing action");
            const actionImpl = getActionImpl(
              expectation.actions[0],
              expectation.delay
            );
            const logM = insertReqLog(
              logCollection,
              req,
              res,
              expectation.id,
              projectId,
              path
            );
            await actionImpl?.process(projectId, req, res, logM, logCollection);
            logM && insertResLog(logCollection, req, res, expectation.id, logM);
            return true;
          }
        }
        return false;
      }
    );
  });

  // error handle
  router.use((err, req, res, next) => {
    console.error("[mockServer] Error:", err);
    res.status(500).send("Something went wrong!");
  });
  return router;
};

export default getMockRouter;
