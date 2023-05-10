import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import request from "supertest";
import { createProject } from "core/struct/project";
import { deleteFolderRecursive } from "../../src/common/utils";
import {CustomErrorMiddleware} from "../../src/controller/common";

test("project controller", async () => {
  const server = express(); //创建服务器
  server.use("/project", await getProjectRouter("test_db"));
  server.use(CustomErrorMiddleware);


  const projectM = createProject();
  projectM.name = "new Project";

  // test project name not empty
  const errRes = await request(server)
      .post("/project/")
      .send({
        project:createProject()
      }).expect(400);
  expect(errRes.body.error.message).toEqual('project name can not be empty!')



  const res = await request(server)
    .post("/project/")
    .send({
      project: projectM,
    })
    .expect(200)
    .expect("Content-Type", /json/);
  expect(res.body.name === projectM.name).toBe(true);
  expect(res.body._id).toBeTruthy();

  const projectListRes = await request(server).get("/project/")
      .expect(200);
  expect(projectListRes.body.length === 1);
  expect(projectListRes.body[0].name).toEqual(projectM.name);




  deleteFolderRecursive("test_db");
});
