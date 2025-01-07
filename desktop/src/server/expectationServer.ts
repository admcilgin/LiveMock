import { ExpectationM } from "core/struct/expectation";
import {CreateExpectationResponse, ListExpectationResponse} from "core/struct/response/ExpectationResponse";
import {CreateExpectationReqBody, UpdateExpectationReqBody} from "core/struct/params/ExpectationParams";
import { saveAs } from 'file-saver';

export const createExpectationReq = async (
  projectId: string,
  expectation: ExpectationM
): Promise<CreateExpectationResponse> => {
  const param: CreateExpectationReqBody = {
    projectId,
    expectation,
  };
  return window.api.expectation.createExpectation({}, {}, param)
};

export const updateExpectationReq = async (
  projectId: string,
  expectationId: string,
  expectationUpdate: Partial<ExpectationM>
) => {
  const param: UpdateExpectationReqBody = {
    projectId,
    expectationUpdate,
  };
  return window.api.expectation.updateExpectation({expectationId},{},param);
};

export const listExpectationListReq = async (projectId: string):Promise<ListExpectationResponse> => {
  return window.api.expectation.listExpectation({},{projectId},{});
};

export const deleteExpectationReq = async (projectId:string,expectationId:string) =>{
  return window.api.expectation.deleteExpectation({expectationId},{projectId},{});
}

export const exportExpectationReq = async (projectId: string, expectationIds: string[]) => {
  const result = await window.api.expectation.exportExpectation(projectId, expectationIds);
  const blob = new Blob([result], { type: 'application/json' });
  saveAs(blob, `expectations-${projectId}-${new Date().getTime()}.json`);
};

export const importExpectationReq = async (projectId: string, file: File) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const result = await window.api.expectation.importExpectation(projectId, content);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};
