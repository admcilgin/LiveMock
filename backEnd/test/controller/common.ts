import request from "supertest";
import supertest from "supertest";
import express from "express";
import { ProjectM } from "livemock-core/struct/project";
import { ExpectationM } from "livemock-core/struct/expectation";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { getActionRouter } from "../../src/controller/actionController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { getLogRouter } from "../../src/controller/logController";
import {
  CreateLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterReqBody,
} from "livemock-core/struct/params/LogFilterParam";
import { LogFilterM } from "livemock-core/struct/log";
import { getLogFilterRouter } from "../../src/controller/logFilterController";

export async function projectCreation(
  server: express.Express,
  projectM: ProjectM
) {
  const res = await request(server)
    .post("/project/")
    .send({
      project: projectM,
    })
    .expect(200);
  return res;
}

export const expectationCreation = async (
  server: express.Express,
  projectM: ProjectM,
  expectationM: ExpectationM
) => {
  await request(server)
    .post("/expectation/")
    .send({
      expectation: expectationM,
      projectId: projectM.id,
    })
    .expect(200);
};

export const logFilterCreation = async (
  server: express.Express,
  logFilter: LogFilterM,
  logViewId: string,
  projectId: string
) => {
  let param2: CreateLogFilterReqBody = {
    filter: logFilter,
    logViewId: logViewId,
    projectId: projectId,
  };
  return supertest(server).post("/logFilter/").send(param2).expect(200);
};

export const logFilterUpdateAction = async (
  server: express.Express,
  logFilter: LogFilterM,
  logViewId: string,
  projectId: string
) => {
  let param: UpdateLogFilterReqBody = {
    filter: logFilter,
    logViewId: logViewId,
    projectId: projectId,
  };

  return supertest(server)
    .post("/logFilter/" + logFilter.id)
    .send(param)
    .expect(200);
};

export const logFilterDeletion = async (
  server: express.Express,
  logFilterId: string,
  logViewId: string,
  projectId: string
) => {
  let param: DeleteLogFilterReqQuery = {
    logViewId: logViewId,
    projectId: projectId,
  };

  return supertest(server)
    .delete("/logFilter/" + logFilterId)
    .query(param)
    .expect(200);
};

export const routerSetup = async (server: express.Express) => {
  server.use("/project", await getProjectRouter("test_db"));
  server.use("/expectation", getExpectationRouter("test_db"));
  server.use("/action", await getActionRouter("test_db"));
  server.use("/log", await getLogRouter("test_db"));
  server.use("/logFilter", await getLogFilterRouter("test_db"));
  server.use(CustomErrorMiddleware);
};
