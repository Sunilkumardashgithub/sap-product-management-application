sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("nw.productmanagement.controller.ProductList", {
        onInit() {

            var oModel = this.getView().getModel();

            console.log("OData Model:", oModel);

            // oModel.metadataLoaded().then(function () {

            //     console.log("Northwind Metadata Loaded");

            // });
        }
    });
});