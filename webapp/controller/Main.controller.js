sap.ui.define([
    "portoseguro/zpstamonitor/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/syncStyleClass",
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageBox, syncStyleClass, Fragment, Dialog, DialogType, Button, ButtonType, Text, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("portoseguro.zpstamonitor.controller.Main", {
          

            _getDialog: function () {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("portoseguro.zpstamonitor.view.BusyDialog", this);
                    this.getView().addDependent(this._oDialog);
                }
                return this._oDialog;
            },
    
            onInit: function () {
                this.getView().addStyleClass("sapUiSizeCompact");
              
                this.getOwnerComponent().getRouter().getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);
            },
    
            _onObjectMatched: function (oEvent) {
    
                var smartFilterBar = this.getView().byId("smartFilterBar");
                this.byId('smartFilterBar-btnGo').setText(this.geti18NText("FILTER_BAR_GO")); 
                smartFilterBar.clear();
                smartFilterBar.fireSearch();
              
            },    
           
            closeDialog: function () {
                this._getDialog().close();
            },
    
            onApproveDialogPress: function () {
                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Confirmar",
                        content: new Text({
                            text: "Confirma o reprocessamento dos registros?"
                        }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Confirmar",
                            press: function () {
                                this.onProcess();
                                this.oApproveDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancelar",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
    
                this.oApproveDialog.open();
            },
    
            onProcess: function () {
                //Alterado - Fernando Franco :: 27-01-2021 - 05/03/2021
                var tblError = this.byId("tblError").getTable(),
                    selectedIndices = tblError.getSelectedIndices();
    
                let checkStatus = false;
                let checkEmpresa = false;
                let checkEvento = false;
                let checkIsFilter = true;
                let fiftySmaller = false;
    
                if (selectedIndices.length > 0) {
                    this._getDialog().open();
                    var reprocessData = [];
    
                    if (selectedIndices.length <= 50) {
                        selectedIndices.forEach(function (selectedIndex) {
                            var context = tblError.getContextByIndex(selectedIndex);
                            var item = {
                                id: context.getObject().id,
                                codigo_atena: context.getObject().codigo_atena,
                                tableName: context.getObject().tableName,
                                codigo_empresa: context.getObject().codigo_empresa,
                                codigo_evento_negocio: context.getObject().codigo_evento_negocio,
                                codigo_conector: context.getObject().codigo_conector,
                                status: context.getObject().status
                            };
                            checkStatus = true;
                            fiftySmaller = true;
    
                            if (context.getObject().status === "Roteirizado_erro" ||
                                context.getObject().status === "Item_erro" ||
                                context.getObject().status === "ERRO_PROCESS_CHAIN") {
                                reprocessData.push(item);
                            }
                        });
                    } else {
                        let sGetFilfer = "";
    
                        try {
                            sGetFilfer = tblError.mBindingInfos.rows.binding.oCombinedFilter.aFilters;
                        } catch (e) {
                            checkIsFilter = false;
                        }
    
                        try {
                            for (let i of sGetFilfer) {
                                for (let x of i.aFilters) {
                                    if (x.sPath === "status") {
                                        if (x.oValue1 === "Roteirizado_erro" ||
                                            x.oValue1 === "Item_erro" ||
                                            x.oValue1 === "ERRO_PROCESS_CHAIN") {
                                            checkStatus = true;
                                        }
                                    }
                                }
                            }
    
                            if (checkStatus) {
                                for (let i of sGetFilfer) {
                                    for (let x of i.aFilters) {
                                        let item = {
                                            sFuncao: "desvio",
                                            coluna: x.sPath,
                                            value: x.oValue1,
                                            operator: x.sOperator
                                        };
    
                                        if (x.sPath === "codigo_empresa") {
                                            checkEmpresa = x.sPath === "codigo_empresa";
                                        }
                                        if (x.sPath === "codigo_evento_negocio") {
                                            checkEvento = x.sPath === "codigo_evento_negocio";
                                        }
                                        reprocessData.push(item);
                                    }
                                }
                            }
                        } catch (ignore) {
                            for (let i of sGetFilfer) {
                                if (i.sPath === "status") {
                                    if (i.oValue1 === "Roteirizado_erro" ||
                                        i.oValue1 === "Item_erro" ||
                                        i.oValue1 === "ERRO_PROCESS_CHAIN") {
                                        checkStatus = true;
                                    }
                                }
                            }
                            for (let i of sGetFilfer) {
                                let item = {
                                    sFuncao: "desvio",
                                    coluna: i.sPath,
                                    value: i.oValue1,
                                    operator: i.sOperator
                                };
    
                                if (i.sPath === "codigo_empresa") {
                                    checkEmpresa = i.sPath === "codigo_empresa";
                                }
                                if (i.sPath === "codigo_evento_negocio") {
                                    checkEvento = i.sPath === "codigo_evento_negocio";
                                }
                                reprocessData.push(item);
                            }
                        }
                    }
    
                    if (reprocessData.length > 0 && checkIsFilter && checkStatus && (checkEmpresa || checkEvento || fiftySmaller)) {
                        //Envia os dados selecionados para API de reprocessamento
                        var url = "/event_translator/reprocessRecords";
                        var that = this;
    
                        var json_string = JSON.stringify(reprocessData);
                        var res_obj_json = {jsonStr: json_string};
                        var oModel = this.getView().getModel();

                        oModel.create("/OREPROCESSAR", res_obj_json, {
                            success: function (oSucess) {
                                that.closeDialog();
                                //that.onSucessCall(oSucess);
                                tblError.getModel().refresh();
                                tblError.clearSelection();
                            },
                            error: function (oError) {
                                that.closeDialog();
                                that.onErrorCall(oError);
                                tblError.getModel().refresh();
                            },
                            timeout: 600000 //Timeout de 10 minutos
                        });
    
                        // jQuery.ajax({
                        //     url: url,
                        //     method: "POST",
                        //     data: res_obj_json,
                        //     contentType: "application/json",
                        //     //dataType: "json",
                        //     success: function (oSucess) {
                        //         that.closeDialog();
                        //         //that.onSucessCall(oSucess);
                        //         tblError.getModel().refresh();
                        //         tblError.clearSelection();
                        //     },
                        //     error: function (oError) {
                        //         that.closeDialog();
                        //         that.onErrorCall(oError);
                        //         tblError.getModel().refresh();
                        //     },
                        //     timeout: 600000 //Timeout de 10 minutos
                        // });
                    } else {
                        this._getDialog().close();
                        if (!checkStatus) {
                            MessageBox.information(
                                'ERRO: Para REPROCESSO acima de 50 registros, favor definir o filtro para "status" e "codigo_empresa" ou "codigo_evento_negocio" e usar o "check all"'
                            );
                        } else if (reprocessData.length >= 0) {
                            MessageBox.information(
                                'ERRO: Somente os status Roteirizado_erro, Item_erro ou ERRO_PROCESS_CHAIN poderá ser REPROCESSADOS.');
                        } else {
                            MessageBox.information(
                                'ERRO: Para REPROCESSO acima de 50 registros, favor definir o filtro para "status" e "codigo_empresa" ou "codigo_evento_negocio" e usar o "check all"'
                            );
                        }
                    }
    
                } else {
                    
                    let sMsg = this.geti18NText("MSGSEMREGISTRO");
                    MessageBox.information(sMsg);
                }
            },
    
            onErrorCall: function (oError) {
    
                if (oError.statusCode === 500 || oError.statusCode === 400 || oError.statusCode === "500" || oError.statusCode === "400") {
                    var errorRes = JSON.parse(oError.responseText);
                    if (!errorRes.error.innererror) {
                        MessageBox.alert(errorRes.error.message.value);
                    } else {
                        if (!errorRes.error.innererror.message) {
                            MessageBox.alert(errorRes.error.innererror.toString());
                        } else {
                            MessageBox.alert(errorRes.error.innererror.message);
                        }
                    }
                    return;
                } else {
                    MessageBox.alert(oError.responseText);
                    return;
                }
    
            },
    
            onSucessCall: function (oSucess) {
                MessageBox.alert(oSucess.responseText);
            },
    
            onDataReceived: function () {
    
                var oTable = this.byId("tblError");
                var i = 0;
                var aTemplate = this.getTableErrorColumTemplate();
                oTable.getTable().getColumns().forEach(function (oLine) {
                
                    //oLine.getParent().autoResizeColumn(i);
                    var oFieldName = oLine.getId();
                    oFieldName = oFieldName.substring(oFieldName.lastIndexOf("-") + 1, oFieldName.length);
                    var oFielTemplate = aTemplate.find(element => {return element.fieldName === oFieldName;});
                    if(oFielTemplate){
                        oLine.setProperty("width",oFielTemplate.width);
                    }
    
                    i++;
                });
    
                //this.customizeTableColumnLabels(oTable);
    
            },
    
            getTableErrorColumTemplate: function () {
    
                var aTblErrorTemplate = [
                    {
                        fieldName: "id",
                        width: "100px"
                    }, 
                    {
                        fieldName: "codigo_atena",
                        width: "150px"
                    }, 
                    {
                        fieldName: "data",
                        width: "185px"
                    }, 
                    {
                        fieldName: "hora",
                        width: "80px"
                    }, 
                    {
                        fieldName: "flag",
                        width: "70px"
                    }, 
                    {
                        fieldName: "tableName",
                        width: "300px"
                    }, 
                    {
                        fieldName: "field",
                        width: "200px"
                    }, 
                    {
                        fieldName: "erro",
                        width: "910px"
                    },
                    {
                        fieldName: "operacao",
                        width: "200px"
                    },
                    {
                        fieldName: "codigo_conector",
                        width: "150px"
                    }, 
                    {
                        fieldName: "status",
                        width: "200px"
                    }, 
                    {
                        fieldName: "codigo_empresa",
                        width: "130px"
                    }, 
                    {
                        fieldName: "codigo_evento_negocio",
                        width: "180px"
                    }
                ];
    
                return aTblErrorTemplate;
    
            },
    
            onBeforeRebindTable: function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    aSelectedStatus = this.byId("selStatus").getSelectedItems(),
                    aSelectedEmpresas = this.byId("selCodEmpresa").getSelectedItems(),
                    aSelectedCodEvento = this.byId("selCodEventoNegocio").getSelectedItems(),
                    aSelectedCodConector = this.byId("selCodConector").getSelectedItems();
    
                aSelectedStatus.forEach(element => {
                    mBindingParams.filters.push(new Filter("status", FilterOperator.EQ, element.getKey()));
                });
    
                aSelectedEmpresas.forEach(element => {
                    mBindingParams.filters.push(new Filter("codigo_empresa", FilterOperator.EQ, element.getKey()));
                });
    
                aSelectedCodEvento.forEach(element => {
                    mBindingParams.filters.push(new Filter("codigo_evento_negocio", FilterOperator.EQ, element.getKey()));
                });
    
                aSelectedCodConector.forEach(element => {
                    mBindingParams.filters.push(new Filter("codigo_conector", FilterOperator.EQ, element.getKey()));
                });
            }
        });
    });
