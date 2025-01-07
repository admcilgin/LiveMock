import * as electron from "electron";
import { ExpectationEvents } from "core/struct/events/desktopEvents";
import {
  CreateExpectationPathParam,
  CreateExpectationReqBody,
  CreateExpectationReqQuery,
  DeleteExpectationPathParam,
  DeleteExpectationReqBody,
  DeleteExpectationReqQuery,
  GetExpectationPathParam,
  GetExpectationReqBody,
  GetExpectationReqQuery,
  ListExpectationPathParam,
  ListExpectationReqBody,
  ListExpectationReqQuery,
  UpdateExpectationPathParam,
  UpdateExpectationReqBody,
  UpdateExpectationReqQuery,
} from "core/struct/params/ExpectationParams";
import { ServerError } from "./common";
import { getExpectationCollection } from "../db/dbManager";
import { logViewEventEmitter } from "../common/logViewEvent";
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const ipcMain = electron.ipcMain;

export async function setExpectationHandler(path: string): Promise<void> {
  ipcMain.handle(
    ExpectationEvents.CreateExpectation,
    async (
      event,
      reqParam: CreateExpectationPathParam,
      reqQuery: CreateExpectationReqQuery,
      reqBody: CreateExpectationReqBody
    ) => {
      let { expectation, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      if (expectation) {
        const resExp = collection.insert(expectation);
        logViewEventEmitter.emit("insertExpectation", { projectId, resExp });
        return resExp;
      } else {
        throw new ServerError(400, "expectation not exist!");
      }
    }
  );

  ipcMain.handle(
    ExpectationEvents.ListExpectation,
    async (
      event,
      reqParam: ListExpectationPathParam,
      reqQuery: ListExpectationReqQuery,
      reqBody: ListExpectationReqBody
    ) => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectations = collection.find({}).reverse();
      return expectations;
    }
  );

  ipcMain.handle(
    ExpectationEvents.DeleteExpectation,
    async (
      event,
      reqParam: DeleteExpectationPathParam,
      reqQuery: DeleteExpectationReqQuery,
      reqBody: DeleteExpectationReqBody
    ) => {
      const expectationId = reqParam.expectationId;
      const projectId = reqQuery.projectId;

      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      collection.remove(expectation);
      logViewEventEmitter.emit('deleteExpectation', { projectId, expectation });
      return { message: "success" };
    }
  );

  ipcMain.handle(
    ExpectationEvents.UpdateExpectation,
    async (
      event,
      reqParam: UpdateExpectationPathParam,
      reqQuery: UpdateExpectationReqQuery,
      reqBody: UpdateExpectationReqBody
    ) => {
      const projectId = reqBody.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectationId = reqParam.expectationId;
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      Object.assign(expectation, reqBody.expectationUpdate);
      const result = collection.update(expectation);
      logViewEventEmitter.emit("updateExpectation", { projectId, expectation });
      return result;
    }
  );

  ipcMain.handle(
    ExpectationEvents.GetExpectation,
    async (
      event,
      reqParam: GetExpectationPathParam,
      reqQuery: GetExpectationReqQuery,
      reqBody: GetExpectationReqBody
    ) => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationId = reqParam.expectationId;
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      return expectation;
    }
  );

  ipcMain.handle(ExpectationEvents.ExportExpectation, 
    async (event, projectId: string, expectationIds: string[]) => {
      try {
        const collection = await getExpectationCollection(projectId, path);
        const expectations = collection.find({
          id: { $in: expectationIds }
        });
        
        const exportData = {
          version: '1.0',
          expectations: expectations
        };
        
        return JSON.stringify(exportData, null, 2);
      } catch (error) {
        throw new ServerError(500, "Failed to export expectations: " + (error as Error).message);
      }
  });

  ipcMain.handle(ExpectationEvents.ImportExpectation,
    async (event, projectId: string, fileContent: string) => {
      try {
        const collection = await getExpectationCollection(projectId, path);
        const importData = JSON.parse(fileContent);
        
        if (!importData.expectations || !Array.isArray(importData.expectations)) {
          throw new ServerError(400, "Invalid import file format");
        }

        const imported = importData.expectations.map(exp => {
          const newExpectation = {
            ...exp,
            id: uuidv4()
          };
          
          if (newExpectation.matchers) {
            newExpectation.matchers = newExpectation.matchers.map(matcher => ({
              ...matcher,
              id: uuidv4()
            }));
          }
          
          if (newExpectation.actions) {
            newExpectation.actions = newExpectation.actions.map(action => ({
              ...action,
              id: uuidv4()
            }));
          }

          return collection.insert(newExpectation);
        });

        logViewEventEmitter.emit("insertExpectation", { projectId, resExp: imported });
        return imported;
      } catch (error) {
        throw new ServerError(500, "Failed to import expectations: " + (error as Error).message);
      }
    });
}
