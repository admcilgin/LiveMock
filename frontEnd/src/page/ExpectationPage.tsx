import { Button, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  getExpectationListReq,
} from "../server/expectationServer";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import { NameColumn } from "../component/expectation/listColumnCompoment";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toastPromise } from "../component/common";
import { getExpectationSuccess } from "../slice/thunk";

const ExpectationPage = () => {
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject._id],
    () => {
      return getExpectationListReq(currentProject._id!).then((res) => {
        dispatch(getExpectationSuccess(currentProject._id!, res));
      });
    }
  );

  const expectationColumn = [
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <NameColumn
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
  ];
  return (
    <div>
      <div>
        <Button
          type={"text"}
          icon={<PlusOutlined />}
          onClick={async () => {
            // send request to add new expectation
            const createPromise = createExpectationReq(
              projectState.projectList[projectState.curProjectIndex]._id!,
              createExpectation()
            );
            toastPromise(createPromise);
            createPromise.then((res) => {
              getExpectationListQuery.refetch();
            });
          }}
        >
          Add Expectation
        </Button>
      </div>
      <div>
        <Table
          columns={expectationColumn}
          size={"small"}
          rowKey={"_id"}
          dataSource={expectationState.expectationList}
          loading={getExpectationListQuery.isFetching}
        />
      </div>
    </div>
  );
};
export default ExpectationPage;
