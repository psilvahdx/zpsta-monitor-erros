sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent"
],

/**
 * @param {typeof sap.ui.core.mvc.Controller} Controller
 */
function (Controller, formatter) {
    "use strict";

    return Controller.extend("portoseguro.zpstamonitor.controller.BaseController", {

        formatter: formatter,
        onInit: function () {

        },

        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        onNavBack: function () {
            window.history.go(-1);
            /* var oHistory, sPreviousHash;

            oHistory = History.getInstance();
            sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {*/
            //this.getRouter().navTo("View1", {}, true /*no history*/);
            //}
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        geti18NResourceBundle: function() {
            if (this.getView()) {
                return this.getView().getModel("i18n").getResourceBundle();
            } else {
                return null;
            }
        },
    
        geti18NText: function(key) {
            if (this.geti18NResourceBundle()) {
                return this.geti18NResourceBundle().getText(key);
            } else {
                return null;
            }
        }
    });
});