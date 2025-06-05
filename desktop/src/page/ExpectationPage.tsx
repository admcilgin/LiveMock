import { App, Button, Table, Upload, message, Select, Input, Space, Modal } from "antd";
import { PlusOutlined, UploadOutlined, DownloadOutlined, FilterOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { AppDispatch, useAppSelector } from "../store";
import {
  createExpectationReq,
  listExpectationListReq,
  deleteExpectationReq,
} from "../server/expectationServer";
import { createExpectation, ExpectationM } from "livemock-core/struct/expectation";
import { v4 as uuId } from "uuid";
import {
  ActionColumn,
  ActivateColumn,
  DelayColumn,
  GroupColumn,
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
import { useState, useMemo } from "react";

const { Option } = Select;

const ExpectationPage = () => {
  const { modal } = App.useApp();
  const projectState = useAppSelector((state) => state.project);
  const expectationState = useAppSelector((state) => state.expectation);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  
  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationListReq(currentProject.id).then((res) => {
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    }
  );
  
  // Mevcut tüm grupları al
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    expectationState.expectationList.forEach(exp => {
      if (exp.group) {
        groups.add(exp.group);
      }
    });
    return Array.from(groups);
  }, [expectationState.expectationList]);
  
  // Filtrelenmiş expectations listesi
  const filteredExpectations = useMemo(() => {
    let filtered = expectationState.expectationList;
    
    // Grup filtresi
    if (selectedGroup) {
      filtered = filtered.filter(exp => exp.group === selectedGroup);
    }
    
    // Path araması
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(exp => {
        // Expectation adında arama
        if (exp.name && exp.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // PATH matcher'larında arama
        return exp.matchers.some(matcher => {
          if (matcher.type === 'path' && matcher.value) {
            return matcher.value.toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    }
    
    return filtered;
  }, [expectationState.expectationList, selectedGroup, searchText]);

  // Toplu silme işlemi
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select the expectations to delete.");
      return;
    }
    
    Modal.confirm({
      title: "Delete Expectations",
      content: `${selectedRowKeys.length} expectations to delete. Are you sure?`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        setIsDeleting(true);
        try {
          const deletePromises = selectedRowKeys.map(key => {
            console.log(`Deleting expectation with ID: ${key}`);
            return deleteExpectationReq(currentProject.id, key.toString());
          });
          
          await Promise.all(deletePromises);
          message.success(`${selectedRowKeys.length} expectations deleted successfully.`);
          setSelectedRowKeys([]);
          getExpectationListQuery.refetch();
        } catch (error: any) {
          console.error("Error deleting expectations:", error);
          message.error(`An error occurred during the deletion process: ${error.message}`);
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };
  
  // Tablo seçim özellikleri
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

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
      title: "group",
      dataIndex: "group",
      key: "group",
      render: (text: string, record: ExpectationM, index: number) => {
        return (
          <GroupColumn
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
        <div style={{ margin: "10px 0px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
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
          
          {selectedRowKeys.length > 0 && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
              loading={isDeleting}
            >
              Seçilenleri Sil ({selectedRowKeys.length})
            </Button>
          )}
          
          <Button
            type={"text"}
            icon={<DownloadOutlined />}
            onClick={() => {
              // Export expectations as JSON
              if (filteredExpectations.length === 0) {
                message.warning("Dışa aktarılacak beklenti bulunamadı.");
                return;
              }
              
              const exportData = JSON.stringify(filteredExpectations, null, 2);
              const blob = new Blob([exportData], { type: "application/json" });
              saveAs(blob, `expectations-${currentProject.name}-${selectedGroup ? selectedGroup + "-" : ""}${new Date().toISOString().slice(0, 10)}.json`);
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
                      createTime: new Date(),
                      group: exp.group || ""
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
                  
                } catch (error: any) {
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
          
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <Input
              placeholder="Path veya isim ile ara..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <span>Group Filter:</span>
            <Select 
              style={{ width: 200 }} 
              placeholder="Select Group"
              allowClear
              value={selectedGroup}
              onChange={value => setSelectedGroup(value)}
            >
              {availableGroups.map(group => (
                <Option key={group} value={group}>{group}</Option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Table
            rowSelection={rowSelection}
            columns={expectationColumn}
            size={"small"}
            rowKey={"id"}
            dataSource={filteredExpectations}
            loading={getExpectationListQuery.isFetching || isDeleting}
          />
        </div>
      </div>
    </ExpectationContext.Provider>
  );
};
export default ExpectationPage;
