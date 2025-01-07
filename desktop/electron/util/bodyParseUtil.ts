import bodyParser from "body-parser";
import express from "express";
import multer from "multer";
const typeis = require("type-is");
let json = bodyParser.json();
let urlencoded = bodyParser.urlencoded({ extended: true });
let multipart = multer().any();
import * as http from "http";

export function processBodyParse(
    req: express.Request,
    res: express.Response,
    next: (err?: any) => void
) {
    if (typeis(req, ["multipart"])) {
        multipart(req, res, (err) => {
            if (err) return next(err);
            if (req.body.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                } catch (e) {
                    console.error("JSON parse hatası:", e);
                }
            }
            next();
        });
    } else {
        json(req, res, (err?: any) => {
            if (err) return next(err);
            urlencoded(req, res, next);
        });
    }
}

export function isRecordBody(req: http.IncomingMessage, res: http.IncomingMessage): boolean {
    const recordByRes = typeis.is(res.headers["content-type"], ["json", "text", "html"]);
    const accept = req.headers['accept'];
    const recordByReq = typeis.is(accept, ['json', 'text', 'html']);
    return !!(recordByReq || recordByRes);
}
