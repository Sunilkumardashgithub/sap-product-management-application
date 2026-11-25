
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History"
], function (Controller, UIComponent, History) {
    "use strict";

    return Controller.extend(
        "nw.productmanagement.controller.ProductDetail",
        {

            onInit: function () { 

                var oRouter = UIComponent.getRouterFor(this);

                oRouter
                    .getRoute("ProductDetail")
                    .attachPatternMatched(
                        this.onProductMatched,
                        this
                    );
            },

            onProductMatched: function (oEvent) {

                // Get product ID from route
                var sProductId = oEvent
                    .getParameter("arguments")
                    .productId;

                // Bind selected product with Category and Supplier
                this.getView().bindElement({
                    path: "/Products(" + sProductId + ")",
                    parameters: {
                        expand: "Category,Supplier"
                    }
                });
            },

            onNavBack: function () {

                var oHistory = History.getInstance();

                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {

                    window.history.go(-1);

                } else {

                    UIComponent
                        .getRouterFor(this)
                        .navTo("ProductList", {}, true);
                }
            }

        }
    );
});
