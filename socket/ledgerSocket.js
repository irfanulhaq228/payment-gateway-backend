const Ledger = require("../Models/LedgerModel");

function ledger(io) {
    const ledgerNsp = io.of("/payment");

    ledgerNsp.on("connection", (socket) => {
        console.log("A user connected to /payment namespace");

        // Function to fetch ledgers based on role
        const sendUpdatedLedgers = async (merchantId, adminId) => {
            try {

                if (merchantId) {
                    const ledgerMerchant = await Ledger.find({ merchantId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 });


                    ledgerNsp.emit("getMerchantLedger", ledgerMerchant);
                }


                if (adminId) {
                    const ledgerAdmin = await Ledger.find({ adminId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 });


                    ledgerNsp.emit("getAdminLedger", ledgerAdmin);
                }
            } catch (err) {
                console.error("Error fetching ledgers:", err);
            }
        };

        // ✅ Fetch Ledgers When User Connects
        socket.on("getLedgers", ({ merchantId, adminId }) => {
            sendUpdatedLedgers(merchantId, adminId);
        });

        // ✅ Add New Ledger (Merchant Only)
        socket.on("addLedger", async ({ id }) => {
            try {

                // ledger find by id
                const newledgers = await Ledger.findById(id)

                let page = 1;
        const limit = 50;


                const merchantId =newledgers?.merchantId
                const adminId =newledgers?.adminId

                if (merchantId) {
                    const ledgerMerchant = await Ledger.find({ merchantId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .exec();


                    ledgerNsp.emit("getMerchantLedger", ledgerMerchant);
                }



                if (adminId) {
                    const ledgerAdmin = await Ledger.find({ adminId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 })
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .exec();


                    ledgerNsp.emit("getAdminLedger", ledgerAdmin);
                }


            } catch (err) {
                console.error("Error adding ledger:", err);
                socket.emit("error", { message: "Failed to add ledger" });
            }
        });

        // ✅ Update Ledger Status (Admin & Merchant)
        socket.on("updateLedgerStatus", async ({ id  }) => {
            try {
                let ledgerr = await Ledger.findById(id);
                if (!ledgerr) {
                    return socket.emit("error", { message: "Ledger not found" });
                }
                const merchantId =ledgerr?.merchantId
                const adminId =ledgerr?.adminId

                
                let page = 1;
                const limit = 50;

                if (merchantId) {
                    const ledgerMerchant = await Ledger.find({ merchantId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .exec();


                    ledgerNsp.emit("getMerchantLedger", ledgerMerchant);
                }



                if (adminId) {
                    const ledgerAdmin = await Ledger.find({ adminId }).populate([
                        "bankId", "merchantId"
                    ]).sort({ createdAt: -1 })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .exec();


                    ledgerNsp.emit("getAdminLedger", ledgerAdmin);
                }

            } catch (err) {
                console.error("Error updating ledger:", err);
                socket.emit("error", { message: "Failed to update status" });
            }
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected from /payment namespace");
        });
    });
}

module.exports = ledger;
