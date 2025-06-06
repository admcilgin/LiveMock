import * as superagent from "superagent";
import {CreateMatcherResponse, UpdateMatcherResponse} from "livemock-core/struct/response/MatcherResponse";
import { ServerUrl } from "../config";
import { DeleteMatcherResponse } from "livemock-core/struct/response/MatcherResponse";
import {
  CreateMatcherReqBody,
  UpdateMatcherReqBody,
} from "livemock-core/struct/params/MatcherParams";

export const createMatcherReq = async (
  param: CreateMatcherReqBody
): Promise<CreateMatcherResponse> => {
  const res = await superagent.post(`${ServerUrl}/matcher`).send(param);
  return res.body;
};

export const deleteMatcherReq = async ({
  matcherId,
  projectId,
  expectationId,
}: {
  matcherId: string;
  projectId: string;
  expectationId: string;
}): Promise<DeleteMatcherResponse> => {
  const response = await superagent.delete(
    `${ServerUrl}/matcher/${matcherId}?projectId=${projectId}&expectationId=${expectationId}`
  );
  return response.body;
};

export const updateMatcherReq = async (
  matcherId: string,
  param: UpdateMatcherReqBody
) :Promise<UpdateMatcherResponse>=> {
  const response = await superagent.put(`${ServerUrl}/matcher/${matcherId}`)
      .send(param);
  return response.body;
};
