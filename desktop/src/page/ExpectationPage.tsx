import { App, Button, Select, Table } from "antd";
import { PlusOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationListReq,
  exportExpectationReq,
  importExpectationReq,
} from "../server/expectationServer";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import {
  ActionColumn,
  ActivateColumn,
  DelayColumn,
  MatcherColumn,
  NameColumn,
  OperationColumn,
  PriorityColumn,
} from "../component/expectation/listColumnCompoment";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toastPromise } from "../component/common";
import { getExpectationSuccess } from "../slice/thunk";
import { ExpectationContext } from "src/component/context";
import { useState, useMemo, useRef } from "react";

const ExpectationPage = () => {
  const { modal } = App.useApp();
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationListReq(currentProject.id).then((res) => {
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
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
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "delay",
      dataIndex: "delay",
      key: "delay",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <DelayColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "priority",
      dataIndex: "priority",
      key: "priority",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <PriorityColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "activate",
      dataIndex: "activate",
      key: "activate",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <ActivateColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "matchers",
      dataIndex: "matcher",
      key: "matchers",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <MatcherColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "actions",
      dataIndex: "actions",
      key: "actions",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <ActionColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
          />
        );
      },
    },
    {
      title: "operation",
      dataIndex: "operation",
      key: "operation",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <OperationColumn
            projectId={currentProject.id}
            text={text}
            expectation={record}
            index={index}
            dispatch={dispatch}
            modal={modal}
          />
        );
      },
    },
  ];

  const uniqueGroups = useMemo(() => {
    const groups = expectationState.expectationList
      .map(exp => exp.group)
      .filter(group => group !== undefined) as string[];
    return [...new Set(groups)];
  }, [expectationState.expectationList]);

  const filteredExpectations = useMemo(() => {
    if (!selectedGroup) return expectationState.expectationList;
    return expectationState.expectationList.filter(exp => exp.group === selectedGroup);
  }, [expectationState.expectationList, selectedGroup]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <ExpectationContext.Provider
      value={{
        refreshExpectationList: () => {
          getExpectationListQuery.refetch();
        },
      }}
    >
      <div style={{ padding: "10px" }}>
        <div style={{ margin: "10px 0px", display: "flex", gap: "10px" }}>
          <Button
            type={"text"}
            icon={<PlusOutlined />}
            onClick={async () => {
              // send request to add new expectation
              const createPromise = createExpectationReq(
                projectState.projectList[projectState.curProjectIndex].id,
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

          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => {
              const selectedIds = filteredExpectations.map(exp => exp.id);
              toastPromise(exportExpectationReq(currentProject.id, selectedIds));
            }}
          >
            Export
          </Button>

          <Button
            type="text"
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  await toastPromise(importExpectationReq(currentProject.id, file));
                  getExpectationListQuery.refetch();
                } finally {
                  e.target.value = '';
                }
              }
            }}
          />

          <Select
            style={{ width: 200 }}
            placeholder="Filter by group"
            allowClear
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={uniqueGroups.map(group => ({
              label: group,
              value: group
            }))}
          />
        </div>
        <div>
          <Table
            columns={expectationColumn}
            size={"small"}
            rowKey={"id"}
            dataSource={filteredExpectations}
            loading={getExpectationListQuery.isFetching}
          />
        </div>
      </div>
    </ExpectationContext.Provider>
  );
};
export default ExpectationPage;
