import { App, Button, Table, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationListReq,
} from "../server/expectationServer";
import { createExpectation, ExpectationM } from "livemock-core/struct/expectation";
import { v4 as uuId } from "uuid";
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
import { saveAs } from 'file-saver';

const ExpectationPage = () => {
  const { modal } = App.useApp();
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
            type={"text"}
            icon={<DownloadOutlined />}
            onClick={() => {
              // Export expectations as JSON
              if (expectationState.expectationList.length === 0) {
                message.warning("Dışa aktarılacak beklenti bulunamadı.");
                return;
              }
              
              const exportData = JSON.stringify(expectationState.expectationList, null, 2);
              const blob = new Blob([exportData], { type: "application/json" });
              saveAs(blob, `expectations-${currentProject.name}-${new Date().toISOString().slice(0, 10)}.json`);
              message.success("Beklentiler başarıyla dışa aktarıldı.");
            }}
          >
            Export
          </Button>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  console.log("Import - Reading file content, length:", content.length);
                  
                  const importedExpectations = JSON.parse(content) as ExpectationM[];
                  console.log("Import - Parsed expectations count:", importedExpectations.length);
                  
                  if (!Array.isArray(importedExpectations)) {
                    message.error("Geçersiz dosya formatı. Beklentiler listesi içeren bir JSON dosyası olmalı.");
                    return false;
                  }
                  
                  // Import each expectation
                  const importPromises = importedExpectations.map((exp, index) => {
                    console.log(`Import - Processing expectation ${index + 1}/${importedExpectations.length}, original ID: ${exp.id}`);
                    
                    // Create a completely new expectation object with only the necessary data
                    const newExp: ExpectationM = {
                      id: uuId(),
                      name: `${exp.name} (imported)`,
                      delay: exp.delay,
                      priority: exp.priority,
                      activate: exp.activate,
                      matchers: [],
                      actions: [],
                      createTime: new Date()
                    };
                    
                    console.log(`Import - Created new expectation with ID: ${newExp.id}`);
                    
                    // Recreate matchers
                    if (exp.matchers && Array.isArray(exp.matchers)) {
                      console.log(`Import - Processing ${exp.matchers.length} matchers`);
                      exp.matchers.forEach((matcher, mIndex) => {
                        const newMatcherId = uuId();
                        console.log(`Import - Matcher ${mIndex + 1}/${exp.matchers.length}, type: ${matcher.type}, new ID: ${newMatcherId}`);
                        
                        if (matcher.type === "path") {
                          newExp.matchers.push({
                            id: newMatcherId,
                            type: matcher.type,
                            conditions: matcher.conditions,
                            value: matcher.value
                          });
                        } else if (matcher.type === "method") {
                          newExp.matchers.push({
                            id: newMatcherId,
                            type: matcher.type,
                            conditions: matcher.conditions,
                            value: matcher.value
                          });
                        } else if (matcher.type === "header" || matcher.type === "query" || matcher.type === "param") {
                          newExp.matchers.push({
                            id: newMatcherId,
                            type: matcher.type,
                            conditions: matcher.conditions,
                            name: matcher.name,
                            value: matcher.value
                          });
                        }
                      });
                    }
                    
                    // Recreate actions
                    if (exp.actions && Array.isArray(exp.actions)) {
                      console.log(`Import - Processing ${exp.actions.length} actions`);
                      exp.actions.forEach((action, aIndex) => {
                        const newActionId = uuId();
                        console.log(`Import - Action ${aIndex + 1}/${exp.actions.length}, type: ${action.type}, new ID: ${newActionId}`);
                        
                        if (action.type === "PROXY") {
                          newExp.actions.push({
                            id: newActionId,
                            type: action.type,
                            protocol: action.protocol,
                            host: action.host,
                            handleCross: action.handleCross,
                            crossAllowCredentials: action.crossAllowCredentials,
                            supportWebsocket: action.supportWebsocket,
                            pathRewrite: action.pathRewrite ? action.pathRewrite.map(pr => ({
                              type: pr.type,
                              value: pr.value
                            })) : [],
                            prefixRemove: action.prefixRemove,
                            headers: action.headers ? [...action.headers] : undefined,
                            requestHeaders: action.requestHeaders ? [...action.requestHeaders] : undefined
                          });
                        } else if (action.type === "CUSTOM_RESPONSE") {
                          const responseContent = action.responseContent ? {
                            headers: action.responseContent.headers ? [...action.responseContent.headers] : [],
                            type: action.responseContent.type,
                            value: action.responseContent.value,
                            contentHandler: action.responseContent.contentHandler
                          } : null;
                          
                          if (responseContent) {
                            newExp.actions.push({
                              id: newActionId,
                              type: action.type,
                              status: action.status,
                              responseContent
                            });
                          }
                        }
                      });
                    }
                    
                    console.log(`Import - Final expectation: ${newExp.id}, matchers: ${newExp.matchers.length}, actions: ${newExp.actions.length}`);
                    return createExpectationReq(currentProject.id, newExp)
                      .then(result => {
                        console.log(`Import - Successfully imported expectation: ${newExp.id}`);
                        return result;
                      })
                      .catch(error => {
                        console.error(`Import - Error importing expectation: ${newExp.id}`, error);
                        throw error;
                      });
                  });
                  
                  Promise.all(importPromises)
                    .then(() => {
                      console.log(`Import - All ${importPromises.length} expectations imported successfully`);
                      message.success(`${importedExpectations.length} beklenti başarıyla içe aktarıldı.`);
                      getExpectationListQuery.refetch();
                    })
                    .catch(err => {
                      console.error("Import - Error during import:", err);
                      message.error(`İçe aktarma sırasında hata oluştu: ${err.message}`);
                    });
                  
                } catch (error) {
                  console.error("Import - Error parsing file:", error);
                  message.error(`Dosya işlenirken hata oluştu: ${error.message}`);
                }
                return false; // Prevent default upload behavior
              };
              reader.readAsText(file);
              return false; // Prevent default upload behavior
            }}
          >
            <Button type="text" icon={<UploadOutlined />}>
              Import
            </Button>
          </Upload>
        </div>
        <div>
          <Table
            columns={expectationColumn}
            size={"small"}
            rowKey={"id"}
            dataSource={expectationState.expectationList}
            loading={getExpectationListQuery.isFetching}
          />
        </div>
      </div>
    </ExpectationContext.Provider>
  );
};
export default ExpectationPage;
