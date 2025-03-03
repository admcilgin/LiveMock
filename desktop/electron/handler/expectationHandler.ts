import * as electron from "electron";
import { ExpectationEvents } from "livemock-core/struct/events/desktopEvents";
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
} from "livemock-core/struct/params/ExpectationParams";
import { ServerError } from "./common";
import { getExpectationCollection } from "../db/dbManager";
import {logViewEventEmitter} from "../common/eventEmitters";

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
      const { expectation, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      
      console.log("CreateExpectation - Received expectation:", JSON.stringify({
        id: expectation.id,
        name: expectation.name,
        matchers: expectation.matchers.map(m => ({ id: m.id, type: m.type })),
        actions: expectation.actions.map(a => ({ id: a.id, type: a.type }))
      }));
      
      try {
        const collection = await getExpectationCollection(projectId, path);
        
        // Check if an expectation with the same ID already exists
        const existingExp = collection.findOne({ id: expectation.id });
        if (existingExp) {
          console.log("CreateExpectation - Error: Expectation with ID already exists:", expectation.id);
          throw new Error(`Expectation with ID ${expectation.id} already exists. Please use update instead.`);
        }
        
        // Check if there are any matchers or actions with duplicate IDs
        const matcherIds = new Set();
        const actionIds = new Set();
        let hasDuplicateIds = false;
        
        expectation.matchers.forEach(matcher => {
          if (matcherIds.has(matcher.id)) {
            console.log("CreateExpectation - Error: Duplicate matcher ID:", matcher.id);
            hasDuplicateIds = true;
          }
          matcherIds.add(matcher.id);
        });
        
        expectation.actions.forEach(action => {
          if (actionIds.has(action.id)) {
            console.log("CreateExpectation - Error: Duplicate action ID:", action.id);
            hasDuplicateIds = true;
          }
          actionIds.add(action.id);
        });
        
        if (hasDuplicateIds) {
          throw new Error("Expectation contains duplicate matcher or action IDs");
        }
        
        if (expectation) {
          console.log("CreateExpectation - Inserting expectation with ID:", expectation.id);
          const resExp = collection.insert(expectation);
          if (resExp) {
            console.log("CreateExpectation - Successfully inserted expectation with ID:", resExp.id);
            logViewEventEmitter.emit("insertExpectation", { projectId, resExp });
          } else {
            console.log("CreateExpectation - Warning: Insert returned undefined");
          }
          return resExp;
        } else {
          throw new ServerError(400, "expectation not exist!");
        }
      } catch (error: any) {
        console.error("CreateExpectation - Error:", error.message, error.stack);
        throw error;
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
}
