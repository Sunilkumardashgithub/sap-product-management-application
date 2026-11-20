
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "nw/productmanagement/model/formatter",
    "sap/m/MessageBox"


], function (
    Controller,
    Fragment,
    Token,
    Filter,
    FilterOperator,
    MessageToast,
    formatter,
    MessageBox
) {

    "use strict";

    return Controller.extend(
        "nw.productmanagement.controller.ProductList",
        {

            formatter: formatter,

            // 1. Open Product Value Help Dialog
            onProductValueHelp: async function () {

                var oView = this.getView();

                // Load fragment only once
                if (!this._oProductValueHelpDialog) {

                    this._oProductValueHelpDialog =
                        await Fragment.load({

                            id: oView.getId(),

                            name: "nw.productmanagement.fragment.ProductValueHelp",

                            controller: this

                        });

                    // Connect fragment with view
                    oView.addDependent(
                        this._oProductValueHelpDialog
                    );

                }

                // Remove previous search filter
                var oBinding =
                    this._oProductValueHelpDialog.getBinding("items");

                if (oBinding) {
                    oBinding.filter([]);
                }

                // Open dialog
                this._oProductValueHelpDialog.open();

            },


            // 2. Search Products Inside Value Help Dialog
            onProductValueHelpSearch: function (oEvent) {

                var sValue = oEvent.getParameter("value");

                var oBinding = oEvent.getSource().getBinding("items");

                if (!sValue) {

                    oBinding.filter([]);

                    return;

                }

                // Search by Product Name
                var oFilter = new Filter(
                    "Name",
                    FilterOperator.Contains,
                    sValue
                );

                oBinding.filter([oFilter]);

            },


            // 3. Get Selected Products
            onProductValueHelpConfirm: function (oEvent) {

                var aSelectedItems =
                    oEvent.getParameter("selectedItems") || [];

                var aTokens = [];

                aSelectedItems.forEach(function (oItem) {

                    var oContext = oItem.getBindingContext();

                    var sProductId =
                        oContext.getProperty("ID");

                    var sProductName =
                        oContext.getProperty("Name");

                    // Create token for each selected product
                    var oToken = new Token({

                        key: String(sProductId),

                        text: sProductName

                    });

                    aTokens.push(oToken);

                });

                // Set selected products in MultiInput
                var oMultiInput =
                    this.byId("productFilter");

                oMultiInput.setTokens(aTokens);

                MessageToast.show(
                    aTokens.length + " product(s) selected"
                );

            },


            // 4. Cancel Value Help Dialog
            onProductValueHelpCancel: function () {

                // No action required

            },


            // 5. Go Button - Filter Product Table
            onGo: function () {

                var oMultiInput =
                    this.byId("productFilter");

                var aTokens = oMultiInput.getTokens();

                var oTable =
                    this.byId("productTable");

                var oBinding =
                    oTable.getBinding("items");

                // If no product selected, show all products
                if (aTokens.length === 0) {

                    oBinding.filter([]);

                    MessageToast.show("Showing all products");

                    return;

                }

                var aFilters = [];

                aTokens.forEach(function (oToken) {

                    var iProductId =
                        Number(oToken.getKey());

                    if (Number.isFinite(iProductId)) {

                        aFilters.push(
                            new Filter(
                                "ID",
                                FilterOperator.EQ,
                                iProductId
                            )
                        );

                    }

                });

                // Combine multiple product filters using OR
                var oFinalFilter = new Filter({

                    filters: aFilters,

                    and: false

                });

                // Apply filter to table
                oBinding.filter([oFinalFilter]);

                MessageToast.show(
                    "Product filter applied"
                );

            },


            // 6. Clear Button
            onClear: function () {

                var oMultiInput =
                    this.byId("productFilter");

                var oTable =
                    this.byId("productTable");

                // Remove all selected tokens
                oMultiInput.destroyTokens();

                // Remove table filters
                oTable.getBinding("items").filter([]);

                MessageToast.show(
                    "Filters cleared"
                );

            },


            // 7. Open Create Product Dialog
            onCreate: async function () {

                var oView = this.getView();

                // Load fragment only once
                if (!this._oCreateProductDialog) {

                    this._oCreateProductDialog =
                        await Fragment.load({

                            id: oView.getId(),

                            name: "nw.productmanagement.fragment.CreateProduct",

                            controller: this

                        });

                    // Connect dialog with view
                    oView.addDependent(this._oCreateProductDialog);

                }

                // Open dialog
                this._oCreateProductDialog.open();

            },

            
            // 8. Save New Product
            onCreateProductSave: function () {

                var oView = this.getView();

                // Get values from fragment controls
                var sName = Fragment.byId(
                    oView.getId(),
                    "productName"
                ).getValue().trim();

                var sDescription = Fragment.byId(
                    oView.getId(),
                    "productDescription"
                ).getValue().trim();

                var oReleaseDate = Fragment.byId(
                    oView.getId(),
                    "productReleaseDate"
                ).getDateValue();

                var sRating = Fragment.byId(
                    oView.getId(),
                    "productRating"
                ).getValue();

                var sPrice = Fragment.byId(
                    oView.getId(),
                    "productPrice"
                ).getValue();

                // Validation
                if (
                    !sName ||
                    !sDescription ||
                    !oReleaseDate ||
                    !sRating ||
                    !sPrice
                ) {
                    MessageBox.warning("Please fill all required fields");
                    return;
                }

                var iRating = Number(sRating);
                var fPrice = Number(sPrice);

                if (
                    !Number.isInteger(iRating) ||
                    iRating < 0 ||
                    iRating > 5
                ) {
                    MessageBox.warning(
                        "Rating must be an integer between 0 and 5"
                    );
                    return;
                }

                if (!Number.isFinite(fPrice) || fPrice < 0) {
                    MessageBox.warning("Please enter a valid price");
                    return;
                }

                var oModel = this.getView().getModel();
                var oDialog = this._oCreateProductDialog;

                oDialog.setBusy(true);

                // Step 1: Get the highest existing Product ID
                oModel.read("/Products", {

                    urlParameters: {
                        "$orderby": "ID desc",
                        "$top": "1"
                    },

                    success: function (oData) {

                        var iNextId = 0;

                        if (oData.results.length > 0) {
                            iNextId = oData.results[0].ID + 1;
                        }

                        // Step 2: Prepare normal JavaScript payload
                        var oPayload = {
                            ID: iNextId,
                            Name: sName,
                            Description: sDescription,
                            ReleaseDate: oReleaseDate,
                            Rating: iRating,
                            Price: String(fPrice)
                        };

                        console.log("Create Product Payload:", oPayload);

                        // Step 3: OData V2 POST operation
                        oModel.create("/Products", oPayload, {

                            success: function (oData) {

                                oDialog.setBusy(false);

                                MessageToast.show(
                                    "Product created successfully"
                                );

                                console.log("Created Product:", oData);

                                oDialog.close();

                                this.onResetCreateProductForm();

                                // Refresh table
                                this.byId("productTable")
                                    .getBinding("items")
                                    .refresh(true);

                            }.bind(this),

                            error: function (oError) {

                                oDialog.setBusy(false);

                                console.error("Create Product Error:", oError);

                                MessageBox.error(
                                    "Unable to create product. Please check the OData response."
                                );

                            }

                        });

                    }.bind(this),

                    error: function (oError) {

                        oDialog.setBusy(false);

                        console.error("ID Fetch Error:", oError);

                        MessageBox.error(
                            "Unable to fetch the next Product ID."
                        );

                    }

                });

            },


            // 9. Cancel Create Product
            onCreateProductCancel: function () {

                this._oCreateProductDialog.close();

            },

            // 10. Reset Create Product Form
            onResetCreateProductForm: function () {

                Fragment.byId(
                    this.getView().getId(),
                    "productName"
                ).setValue("");

                Fragment.byId(
                    this.getView().getId(),
                    "productDescription"
                ).setValue("");

                Fragment.byId(
                    this.getView().getId(),
                    "productReleaseDate"
                ).setDateValue(null);

                Fragment.byId(
                    this.getView().getId(),
                    "productRating"
                ).setValue("");

                Fragment.byId(
                    this.getView().getId(),
                    "productPrice"
                ).setValue("");

            },

            // 11. Open Update Product Dialog
            onUpdate: async function () {

                var oTable = this.byId("productTable");
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0) {
                    sap.m.MessageToast.show("Please select a product");
                    return;
                }

                if (aSelectedItems.length > 1) {
                    sap.m.MessageToast.show("Please select only one product to update");
                    return;
                }

                var oSelectedItem = aSelectedItems[0];
                var oProduct = oSelectedItem.getBindingContext().getObject();

                var oView = this.getView();

                // var oTable = this.byId("productTable");

                // Get selected product
                // var oSelectedItem = oTable.getSelectedItem();

                if (!oSelectedItem) {
                    MessageBox.warning("Please select a product to update");
                    return;
                }

                // Get selected product context
                var oContext = oSelectedItem.getBindingContext();

                // var oProduct = oContext.getObject();

                // Store selected product path
                this._sUpdateProductPath = oContext.getPath();

                // Load fragment only once
                if (!this._oUpdateProductDialog) {

                    this._oUpdateProductDialog = await Fragment.load({

                        id: oView.getId(),

                        name: "nw.productmanagement.fragment.UpdateProduct",

                        controller: this

                    });

                    oView.addDependent(this._oUpdateProductDialog);
                }

                // Fill existing product details
                Fragment.byId(oView.getId(), "updateProductId")
                    .setValue(String(oProduct.ID));

                Fragment.byId(oView.getId(), "updateProductName")
                    .setValue(oProduct.Name);

                Fragment.byId(oView.getId(), "updateProductDescription")
                    .setValue(oProduct.Description);

                Fragment.byId(oView.getId(), "updateProductReleaseDate")
                    .setDateValue(oProduct.ReleaseDate);

                Fragment.byId(oView.getId(), "updateProductRating")
                    .setValue(String(oProduct.Rating));

                Fragment.byId(oView.getId(), "updateProductPrice")
                    .setValue(String(oProduct.Price));

                // Open dialog
                this._oUpdateProductDialog.open();

            },

           
            // 12. Save Updated Product
            onUpdateProductSave: function () {
                var oView = this.getView();

                // Get values from fragment
                var sName = Fragment.byId(
                    oView.getId(),
                    "updateProductName"
                ).getValue().trim();

                var sDescription = Fragment.byId(
                    oView.getId(),
                    "updateProductDescription"
                ).getValue().trim();

                var oReleaseDate = Fragment.byId(
                    oView.getId(),
                    "updateProductReleaseDate"
                ).getDateValue();

                var sRating = Fragment.byId(
                    oView.getId(),
                    "updateProductRating"
                ).getValue();

                var sPrice = Fragment.byId(
                    oView.getId(),
                    "updateProductPrice"
                ).getValue();

                // Validation
                if (
                    !sName ||
                    !sDescription ||
                    !oReleaseDate ||
                    !sRating ||
                    !sPrice
                ) {
                    MessageBox.warning("Please fill all required fields");
                    return;
                }

                var iRating = Number(sRating);
                var fPrice = Number(sPrice);

                if (
                    !Number.isInteger(iRating) ||
                    iRating < 0 ||
                    iRating > 5
                ) {
                    MessageBox.warning("Rating must be between 0 and 5");
                    return;
                }

                if (!Number.isFinite(fPrice) || fPrice < 0) {
                    MessageBox.warning("Please enter a valid price");
                    return;
                }

                // Prepare normal JavaScript payload
                var oPayload = {

                    Name: sName,

                    Description: sDescription,

                    ReleaseDate: oReleaseDate,

                    Rating: iRating,

                    Price: String(fPrice)

                };

                console.log("Update Product Payload:", oPayload);

                var oModel = this.getView().getModel();

                var oDialog = this._oUpdateProductDialog;

                oDialog.setBusy(true);

                // OData V2 UPDATE operation
                oModel.update(
                    this._sUpdateProductPath,
                    oPayload,
                    {

                        merge: true,

                        success: function (oData) {

                            oDialog.setBusy(false);

                            MessageToast.show(
                                "Product updated successfully"
                            );

                            console.log("Updated Product:", oData);

                            oDialog.close();

                            // Refresh product table
                            this.byId("productTable")
                                .getBinding("items")
                                .refresh(true);

                            this.byId("productTable")
                                .removeSelections(true);

                        }.bind(this),

                        error: function (oError) {

                            oDialog.setBusy(false);

                            console.error("Update Product Error:", oError);

                            MessageBox.error(
                                "Unable to update product. Please check the OData response."
                            );

                        }

                    }
                );

            },

            // 13. Cancel Update Product
            onUpdateProductCancel: function () {

                this._oUpdateProductDialog.close();

            },


            
            // 14. Delete Product
            onDelete: function () {
                var oTable = this.byId("productTable");
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0) {
                    sap.m.MessageToast.show("Please select product(s) to delete");
                    return;
                }

                var oModel = this.getView().getModel();

                sap.m.MessageBox.confirm(
                    "Are you sure you want to delete " + aSelectedItems.length + " product(s)?",
                    {
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {

                                aSelectedItems.forEach(function (oItem) {
                                    var sPath = oItem.getBindingContext().getPath();

                                    oModel.remove(sPath, {
                                        success: function () {
                                            console.log("Product deleted:", sPath);
                                        },
                                        error: function () {
                                            sap.m.MessageToast.show("Error deleting product");
                                        }
                                    });
                                });

                                oTable.removeSelections();
                            }
                        }
                    }
                );
            }


        }
    );

});
