import { App, Button, Table, Select, message } from "antd";
import { PlusOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationReq,
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
import { NInput } from "../component/nui/NInput";
import { useMemo, useState } from "react";
import { ExpectationContext } from "../component/context";
import saveAs from "file-saver";

const ExpectationPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const { modal } = App.useApp();
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationReq(currentProject.id).then((res) => {
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    },
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

  const exportExpectations = () => {
    const data = JSON.stringify(expectationState.expectationList, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    saveAs(blob, "expectations.json");
  };

  const importExpectations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result as string;
      const expectations = JSON.parse(data);

      expectations.forEach((expectation: ExpectationM) => {
        createExpectationReq(currentProject.id, expectation).then(() => {
          getExpectationListQuery.refetch();
        });
      });
      message.success("Expectations imported successfully");
    };
    reader.readAsText(file);
  };

  const uniqueGroups = useMemo(() => {
    const groups = expectationState.expectationList
      .map(exp => exp.group)
      .filter(group => group !== undefined) as string[];
    return [...new Set(groups)];
  }, [expectationState.expectationList]);

  // Filtrelenmiş beklenti listesi
  const filteredExpectations = useMemo(() => {
    if (!selectedGroup) return expectationState.expectationList;
    return expectationState.expectationList.filter(exp => exp.group === selectedGroup);
  }, [expectationState.expectationList, selectedGroup]);

  return (
    <ExpectationContext.Provider
      value={{
        refreshExpectationList: () => {
          getExpectationListQuery.refetch();
        },
      }}
    >
      <div style={{ padding: "10px" }}>
        <div style={{ margin: "10px 0px" }}>
          <Button
            type={"text"}
            icon={<PlusOutlined />}
            onClick={async () => {
              // send request to add new expectation
              const createPromise = createExpectationReq(
                projectState.projectList[projectState.curProjectIndex].id,
                createExpectation(),
              );
              toastPromise(createPromise);
              createPromise.then((res) => {
                getExpectationListQuery.refetch();
              });
            }}
          >
            Add Expectation
          </Button>
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
            <Button
            type={"text"}
            icon={<DownloadOutlined />}
            onClick={exportExpectations}
          >
            Export as JSON
          </Button>
          <Button
            type={"text"}
            icon={<UploadOutlined />}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            Import from JSON
          </Button>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            accept=".json"
            onChange={importExpectations}
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
