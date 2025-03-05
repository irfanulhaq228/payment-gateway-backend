const Ledger = require('../Models/LedgerModel');
const Merchant = require('../Models/MerchantModel');
const AdminStaff = require('../Models/AdminStaffModel');
const LedgerLog = require('../Models/LedgerLogModel');
const BankLog = require('../Models/BankLogModel');
const Withdraw = require('../Models/WithdrawModel');
const Bank = require('../Models/BankModel');
const jwt = require('jsonwebtoken');
const tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const { notifySubscribers } = require('../Middleware/webhookService');


// Function to extract amount and transaction ID from text
const extractDataFromText = (text) => {
    // Regex for specific currencies: INR (₹), USD ($), PKR, EUR (€), etc.
    const amountRegex = /\b(?:₹|INR|PKR|\$|USD|EUR|€)\s?\d{1,3}(,\d{3})*(\.\d{1,2})?\b/g;

    // Regex for transaction IDs, assuming they have a specific format like "TX12345"
    const transactionIdRegex = /\bTX[A-Z0-9]+\b/g;

    const amountMatch = text.match(amountRegex); // Matches currency amounts
    const transactionIdMatch = text.match(transactionIdRegex); // Matches transaction IDs

    return {
        amount: amountMatch ? amountMatch[0].replace(/,/g, '') : undefined, // Remove commas for clean output
        transactionId: transactionIdMatch ? transactionIdMatch[0] : undefined,
    };
};




// 1. Create 
const imageUploadData = async (req, res) => {
    try {


        try {

            const image = req.file;

            if (!image) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Perform OCR on the uploaded image
            const { data: { text } } = await tesseract.recognize(
                path.resolve(image.path),
                "eng"
            );

            // console.log(text);


            // Extract data from the OCR result
            const extractedData = extractDataFromText(text);

            // Cleanup uploaded file
            fs.unlinkSync(image.path);


            return res.status(200).json({ status: 'ok', data: extractedData });


        } catch (error) {
            console.error("Error processing image:", error);
            return res.status(500).json({ error: "Failed to process the image" });
        }

    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// 1. Create 
const createData = async (req, res) => {
    try {

        if (!req.body.website) {
            return res.status(400).json({ status: 'fail', data, message: 'Please provide website!' });
        }

        if (!req.body.bankId) {
            return res.status(400).json({ status: 'fail', data, message: 'Please select bank account!' });
        }

        if (!req.body.total) {
            return res.status(400).json({ status: 'fail', data, message: 'Please give total amount of your ledger!' });
        }

        const deplicateUTR = await Ledger.findOne({ utr: req.body.utr, status: { $in: ["Pending", "Approved"] } });

        if (deplicateUTR) {
            return res.status(401).json({ status: 'fail', message: 'Please upload unique utr transaction!' });
        }
        else {


            const websiteData = await Merchant.findOne({ website: req.body.website });
            const bankData = await Bank.findOne({ _id: req.body.bankId });
            const ledgerData = await Ledger.find({ bankId: bankData?._id });

            if (bankData?.noOfTrans === (ledgerData.length + 1)) {


                const banks = await Bank.find({
                    accountType: bankData?.accountType,
                    $expr: {
                        $lt: ["$noOfTrans", ledgerData.length + 1]
                    }
                });

                if (banks?.length === 0) {
                    return res.status(400).json({ status: 'fail', message: 'All bank accounts reach the maximum limit of transaction. Please contact to the support!' });
                }

                const updateBank = await Bank.findOneAndUpdate(
                    { _id: banks[0]._id },
                    { block: false },
                    { new: true }
                );

                await BankLog.create({ bankId: banks[0]?._id, status: 'Active', reason: 'Bank is Active.' })

                if (updateBank) {
                    await Bank.findOneAndUpdate({ _id: bankData?._id }, { block: true }, { new: true });
                    await BankLog.create({ bankId: bankData?._id, status: 'InActive', reason: 'Bank is Inactive.' })
                    return res.status(400).json({ status: 'fail', message: 'This card has reached its maximum transaction limit, try again with new one' });
                }

            }






            const tenPercentAmount = parseFloat(bankData?.accountLimit) * (10 / 100);
            if (tenPercentAmount < parseFloat(bankData?.remainingLimit)) {

                if (bankData?.remainingLimit < req.body.total) {

                    const banks = await Bank.find({
                        accountType: bankData?.accountType,
                        $expr: {
                            $gt: ["$remainingLimit", req.body.total]
                        }
                    });

                    if (banks?.length === 0) {
                        return res.status(400).json({ status: 'fail', message: 'All bank accounts reach the maximum limit of deposit. Please contact to the support!' });
                    }

                    const updateBank = await Bank.findOneAndUpdate(
                        { _id: banks[0]._id },
                        { block: false },
                        { new: true }
                    );

                    await BankLog.create({ bankId: banks[0]?._id, status: 'Active', reason: 'Bank is Active.' })



                    if (updateBank) {
                        await Bank.findOneAndUpdate({ _id: bankData?._id }, { block: true }, { new: true });
                        await BankLog.create({ bankId: bankData?._id, status: 'InActive', reason: 'Bank is Inactive' })
                        return res.status(400).json({ status: 'fail', message: 'This card has reached its maximum limit, try again with new one' });
                    }
                }

                const adminTotal = (req.body.total * websiteData?.commision) / 100

                const merchantTotal = req.body.total - adminTotal

                const image = req.file;

                const data = await Ledger.create({
                    ...req.body, image: image ? image?.path : "", merchantId: websiteData?._id, adminId: websiteData?.adminId, adminTotal, merchantTotal
                });

                console.log('created');


                await Bank.findByIdAndUpdate(req.body.bankId,
                    { remainingLimit: bankData?.remainingLimit - parseFloat(req.body.total) },
                    { new: true });

                return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
            }
            else {

                const data = await Bank.findOneAndUpdate({ _id: bankData?._id },
                    { block: true },
                    { new: true });

                await BankLog.create({ bankId: bankData?._id, status: 'InActive', reason: 'Bank is Inactive' })

                const banks = await Bank.find({
                    accountType: bankData?.accountType,
                    $expr: {
                        $gt: ["$accountLimit", { $add: ["$remainingLimit", parseFloat(req.body.total)] }]
                    }
                });


                if (banks?.length === 0) {
                    return res.status(400).json({ status: 'fail', data, message: 'All bank accounts reach the maximum limit of deposit. Please contact to the support!' });
                }

                await Bank.findOneAndUpdate({ _id: banks[0]?._id },
                    { block: false },
                    { new: true });

                await BankLog.create({ bankId: banks[0]?._id, status: 'Active', reason: 'Bank is Active.' })


                return res.status(400).json({ status: 'fail', data, message: 'Bank account reach the maximum limit of deposit. Please refresh your browser to get another bank for transaction!' });
            }
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllAdminData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        let search = req.query.search || "";
        let page = req.query.page || "1";
        const limit = req.query.limit || "10";

        let query = { adminId };

        if (search) {
            query.$or = [
                { utr: { $regex: search, $options: "i" } },
                { _id: { $regex: search, $options: "i" } }
            ];
        }

        if (req.query.status) query.status = req.query.status;
        if (req.query.type) query.type = req.query.type;
        if (req.query.utr) query.utr = { $regex: req.query.utr, $options: "i" };
        if (req.query.trnNo) query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        if (req.query.bankId) query.bankId = req.query.bankId;
        if (req.query.merchantId) query.merchantId = req.query.merchantId;

        // If adminStaffId is provided, apply filtering based on associated merchants, banks, and types
        if (req.query.adminStaffId) {
            const dataStaff = await AdminStaff.findById(req.query.adminStaffId);

            if (dataStaff) {
                if (dataStaff.ledgerMerchant?.length > 0) {
                    query.merchantId = { $in: dataStaff.ledgerMerchant };
                }

                if (dataStaff.ledgerBank?.length > 0) {
                    query.bankId = { $in: dataStaff.ledgerBank }; // Fixed incorrect reference
                }

                if (dataStaff.ledgerType?.length > 0) {
                    query.type = { $in: dataStaff.ledgerType };
                }
            }
        }

        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate).setHours(0, 0, 0, 0);
            }

            if (req.query.endDate) {
                query.createdAt.$lte = new Date(req.query.endDate).setHours(23, 59, 59, 999);
            }

            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }


        // Fetch paginated data with applied filters
        const data = await Ledger.find(query)
            .populate(["bankId", "merchantId"])
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Ledger.countDocuments(query);

        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllAdminDataWithoutPag = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        query.adminId = adminId


        if (search) {
            query.utr = { $regex: ".*" + search + ".*", $options: "i" };
            query._id = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.type) {
            query.type = req.query.type;
        }



        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }



        if (req.query.bankId) {
            query.bankId = req.query.bankId;
        }





        if (req.query.merchantId) {
            query.merchantId = req.query.merchantId;
        }



        if (req.query.adminStaffId) {

            const dataStaff = await AdminStaff.findById(req.query.adminStaffId);

            if (dataStaff?.ledgerMerchant && dataStaff.ledgerMerchant.length > 0) {
                query.merchantId = { $in: dataStaff.ledgerMerchant }; // Filter by merchant IDs in the array
            }

            if (dataStaff?.ledgerBank && dataStaff.ledgerBank.length > 0) {
                query.bankId = { $in: dataStaff.ledgerMerchant }; // Filter by merchant IDs in the array
            }

            if (dataStaff?.ledgerType && dataStaff.ledgerType.length > 0) {
                query.type = { $in: dataStaff.ledgerType }; // Filter by merchant IDs in the array
            }

        }




        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            // If startDate is provided
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // Set time to the beginning of the day (00:00:00)
                query.createdAt.$gte = startDate;
            }

            // If endDate is provided
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set time to the end of the day (23:59:59)
                query.createdAt.$lte = endDate;
            }

            // If startDate and endDate are the same, this will ensure it gets the full range within that day
            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }




        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find(query).populate(["bankId", "merchantId"]).sort({ createdAt: -1 })



        return res.status(200).json({
            status: "ok",
            data
        });

        // Find data created by the agent, sorted by `createdAt` in descending order


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 2. Get all s
const getAllMerchantData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        query.merchantId = adminId


        if (search) {
            query.utr = { $regex: ".*" + search + ".*", $options: "i" };
            query._id = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }

        if (req.query.trnStatus) {
            query.trnStatus = { $regex: req.query.trnStatus, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.bankId) {
            query.bankId = req.query.bankId;
        }


        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            // If startDate is provided
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // Set time to the beginning of the day (00:00:00)
                query.createdAt.$gte = startDate;
            }

            // If endDate is provided
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set time to the end of the day (23:59:59)
                query.createdAt.$lte = endDate;
            }

            // If startDate and endDate are the same, this will ensure it gets the full range within that day
            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 }).countDocuments();

        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 2. Get all s
const getAllMerchantDataWithoutFilter = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        query.merchantId = adminId


        if (search) {
            query.utr = { $regex: ".*" + search + ".*", $options: "i" };
            query._id = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }



        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }

        if (req.query.trnStatus) {
            query.trnStatus = { $regex: req.query.trnStatus, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.bankId) {
            query.bankId = req.query.bankId;
        }


        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            // If startDate is provided
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // Set time to the beginning of the day (00:00:00)
                query.createdAt.$gte = startDate;
            }

            // If endDate is provided
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set time to the end of the day (23:59:59)
                query.createdAt.$lte = endDate;
            }

            // If startDate and endDate are the same, this will ensure it gets the full range within that day
            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 })


        return res.status(200).json({
            status: "ok",
            data
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllUserData = async (req, res) => {
    try {
        const origin = req.get('Origin');



        const merchantdata = await Merchant.findOne({ merchantWebsite: origin, block: false, verify: true });



        if (!origin || origin === "") {
            return res.status(400).json({ status: "fail", message: "Unauthorized" });
        }



        let query = {}

        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        if (search) {
            query.$or = [
                { utr: { $regex: ".*" + search + ".*", $options: "i" } },
                { _id: { $regex: ".*" + search + ".*", $options: "i" } },
            ];
        }

        if (req.query.status) {
            query.status = req.query.status;
        }


        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.username) {
            query.username = req.query.username?.toLowerCase();
        }

        query.merchantId = merchantdata?._id;

        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate).setHours(0, 0, 0, 0);
            }
            if (req.query.endDate) {
                query.createdAt.$lte = new Date(req.query.endDate).setHours(23, 59, 59, 999);
            }
        }

        const data = await Ledger.find(query)
            .populate([
                {
                    path: "bankId",
                    select: 'bankName'
                },
            ]).select('image utr amount tax total status username createdAt updatedAt trnNo')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Ledger.countDocuments(query);

        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Ledger.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// 3. Get  by id
const getCardAdminData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        const { status, filter } = req.query;


        let dateFilter = {};
        const now = new Date();

        // Apply time filter
        switch (filter) {
            case 'today':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(now.setHours(23, 59, 59, 999)), // End of today
                    },
                };
                break;
            case '7days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 7)), // 7 days ago
                    },
                };
                break;
            case '30days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 30)), // 30 days ago
                    },
                };
                break;
            case 'all':
            default:
                dateFilter = {}; // No date filter
                break;
        }

        const query = {
            ...dateFilter,
            ...(status && { status }), // Include status if provided
            adminId: adminId
        };

        const data = await Ledger.find(query);


        const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);


        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);


        return res.status(200).json({ status: 'ok', data: totalSum, merchantTotalSum, adminTotalSum, totalTransaction: data.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getMonthlyAdminData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        // Fetch all records for the admin
        const records = await Ledger.find({ adminId });

        // Initialize a full-year structure
        const currentYear = new Date().getFullYear();
        const fullYearData = {};
        for (let month = 1; month <= 12; month++) {
            fullYearData[`${currentYear}-${month}`] = { year: currentYear, month, statuses: {} };
        }

        // Process ledger records
        records.forEach((record) => {
            const createdAt = new Date(record.createdAt);
            const year = createdAt.getFullYear();
            const month = createdAt.getMonth() + 1;
            const status = record.status;
            const total = record.total || 0;
            const key = `${year}-${month}`;

            if (!fullYearData[key]) {
                fullYearData[key] = { year, month, statuses: {} };
            }
            if (!fullYearData[key].statuses[status]) {
                fullYearData[key].statuses[status] = 0;
            }
            fullYearData[key].statuses[status] += total;
        });

        // Convert to array for response
        const formattedReport = Object.values(fullYearData);

        return res.status(200).json({ status: 'ok', data: formattedReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};






// 3. Get  by id

const getMonthlyMerchantData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const merchantId = decoded.adminId;
        if (!merchantId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        // Fetch all records for the merchant
        const records = await Ledger.find({ merchantId });

        // Initialize a full-year structure
        const currentYear = new Date().getFullYear();
        const fullYearData = {};
        for (let month = 1; month <= 12; month++) {
            fullYearData[`${currentYear}-${month}`] = { year: currentYear, month, statuses: {} };
        }

        // Process ledger records
        records.forEach((record) => {
            const createdAt = new Date(record.createdAt);
            const year = createdAt.getFullYear();
            const month = createdAt.getMonth() + 1;
            const status = record.status;
            const total = record.total || 0;
            const key = `${year}-${month}`;

            if (!fullYearData[key]) {
                fullYearData[key] = { year, month, statuses: {} };
            }
            if (!fullYearData[key].statuses[status]) {
                fullYearData[key].statuses[status] = 0;
            }
            fullYearData[key].statuses[status] += total;
        });

        // Convert to array for response
        const formattedReport = Object.values(fullYearData);

        return res.status(200).json({ status: 'ok', data: formattedReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};





const getTransactionSummaryByAdmin = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const { status, startDate, endDate, merchantId, bankId } = req.query;
        let dateFilter = {};

        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate).setHours(0, 0, 0, 0);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate).setHours(23, 59, 59, 999);
            }
        }

        const query = {
            ...dateFilter,
            ...(status && { status }),
            ...(merchantId && { merchantId }),
            ...(bankId && { bankId })
        };

        const data = await Ledger.find(query);
        let groupedData = {};

        // Iterate through each day in the range
        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            groupedData[dateKey] = {
                Date: dateKey,
                Vendor: merchantId || 'All',
                Status: status || 'All',
                Bank: bankId || 'All',
                NoOfTransaction: 0,
                PayIn: 0,
                Charges: 0,
                Amount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        data.forEach(record => {
            const dateKey = new Date(record.createdAt).toISOString().split('T')[0];
            if (groupedData[dateKey]) {
                groupedData[dateKey].NoOfTransaction++;
                groupedData[dateKey].PayIn += record.total || 0;
                groupedData[dateKey].Charges += record.adminTotal || 0;
                groupedData[dateKey].Amount += record.merchantTotal || 0;
            }
        });

        const responseData = Object.values(groupedData).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const totalTransaction = responseData.reduce((sum, item) => sum + item.NoOfTransaction, 0);
        const totalPayIn = responseData.reduce((sum, item) => sum + item.PayIn, 0);
        const totalCharges = responseData.reduce((sum, item) => sum + item.Charges, 0);
        const totalAmount = responseData.reduce((sum, item) => sum + item.Amount, 0);

        console.log(req.query);


        await LedgerLog.create({ ...req.query })

        return res.status(200).json({
            status: 'ok',
            data: responseData,
            totalTransaction,
            totalPayIn,
            totalCharges,
            totalAmount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};








// 3. Get  by id
const getMerchantWithdrawData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token && req.query.merchantId) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }
        if (req.query.merchantId) {
            adminId = req.query.merchantId
        }


        const query = {
            status: 'Approved',
            merchantId: adminId
        };

        const queryPending = {
            status: 'Pending',
            merchantId: adminId
        };

        const queryDecline = {
            status: 'Decline',
            merchantId: adminId
        };

        const data = await Ledger.find(query);
        const dataWithdraw = await Withdraw.find(query);
        const dataWithdrawPending = await Withdraw.find(queryPending);
        const dataWithdrawDecline = await Withdraw.find(queryDecline);


        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const merchantWithdrawSum = dataWithdraw.reduce((sum, record) => sum + (record.amountINR || 0), 0);

        const merchantWithdrawSumPending = dataWithdrawPending.reduce((sum, record) => sum + (record.amountINR || 0), 0);

        const merchantDecllineSumPending = dataWithdrawDecline.reduce((sum, record) => sum + (record.amountINR || 0), 0);


        return res.status(200).json({
            status: 'ok', totalAmount: merchantTotalSum,
            withdrawAmounts: merchantWithdrawSumPending,
            approvedWithdraw: merchantWithdrawSum,
            pendingAmount: merchantTotalSum - merchantWithdrawSum - merchantWithdrawSumPending
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getCardMerchantData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }



        const { status, filter } = req.query;



        let dateFilter = {};
        const now = new Date();

        // Apply time filter
        switch (filter) {
            case 'today':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(now.setHours(23, 59, 59, 999)), // End of today
                    },
                };
                break;
            case '7days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 7)), // 7 days ago
                    },
                };
                break;
            case '30days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 30)), // 30 days ago
                    },
                };
                break;
            case 'all':
            default:
                dateFilter = {}; // No date filter
                break;
        }

        const query = {
            ...dateFilter,
            ...(status && { status }), // Include status if provided
            merchantId: adminId
        };

        const data = await Ledger.find(query);


        const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);

        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);


        return res.status(200).json({ status: 'ok', data: totalSum, merchantTotalSum, adminTotalSum, totalTransaction: data.length });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getCardMerchantDataByAdmin = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        const { status, filter, merchantId } = req.query;




        let dateFilter = {};



        const now = new Date();

        // Apply time filter
        switch (filter) {
            case 'today':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(now.setHours(23, 59, 59, 999)), // End of today
                    },
                };
                break;
            case '7days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 7)), // 7 days ago
                    },
                };
                break;
            case '30days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 30)), // 30 days ago
                    },
                };
                break;
            case 'all':
            default:
                dateFilter = {}; // No date filter
                break;
        }

        const query = {
            ...dateFilter,
            ...(status && { status }), // Include status if provided
            merchantId: merchantId
        };

        const data = await Ledger.find(query);


        const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);



        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);


        return res.status(200).json({ status: 'ok', data: totalSum, merchantTotalSum, adminTotalSum, totalTransaction: data.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getBankMerchantDataByAdmin = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        const { merchantId } = req.query;

        var query = {}

        query.merchantId = merchantId


        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            // If startDate is provided
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // Set time to the beginning of the day (00:00:00)
                query.createdAt.$gte = startDate;
            }

            // If endDate is provided
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set time to the end of the day (23:59:59)
                query.createdAt.$lte = endDate;
            }

            // If startDate and endDate are the same, this will ensure it gets the full range within that day
            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }


        const filteredTransactions = await Ledger.find(query);

        const ledger = {};
        filteredTransactions.forEach(txn => {
            if (!ledger[txn.bankId]) {
                ledger[txn.bankId] = { Approved: 0, Pending: 0, Decline: 0 };
            }
            ledger[txn.bankId][txn.status] += (txn.total);
        });




        return res.status(200).json({ status: 'ok', data: ledger, });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await Ledger.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;
        let activity = "";
        if (req.body.website || req.body.username) {
            if (req.body.website !== getImage?.site && req.body.username !== getImage?.username) {
                activity = "Both Website and UserId are changed"
            } else if (req.body.website !== getImage?.site && req.body.username === getImage?.username) {
                activity = "Website is changed"
            } else if (req.body.website === getImage?.site && req.body.username !== getImage?.username) {
                activity = "UserId is changed"
            }
        }

        const data = await Ledger.findByIdAndUpdate(id,
            { ...req.body, image: image, activity },
            { new: true });


        if (req.body.status) {
            await notifySubscribers('ledger.status.updated', {
                transactionId: data?.trnNo,
                amount: data?.total,
                username: data?.username,
                status: req.body.status
            }, data?.merchantId?.toHexString());
        }

        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 5. Delete 
const deleteData = async (req, res) => {
    try {
        const id = req.params.id;
        await Ledger.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






const compareDataReport = async (req, res) => {
    try {
        const { utr, total } = req.body;
        const data = await Ledger.findOne({ utr, status: "Pending", total });
        if (!data) {
            return res.status(400).json({ status: 'fail', message: 'No such transaction found!' });
        }

        const updateData = await Ledger.findByIdAndUpdate(data?._id,
            { status: 'Verified' },
            { new: true });


        return res.status(200).json({ status: 'ok', data: updateData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};










module.exports = {
    createData,
    imageUploadData,
    getAllAdminData,
    getAllAdminDataWithoutPag,
    getAllMerchantData,
    getAllMerchantDataWithoutFilter,
    getCardMerchantDataByAdmin,
    getTransactionSummaryByAdmin,
    getAllUserData,
    getDataById,
    updateData,
    deleteData,
    getCardAdminData,
    getBankMerchantDataByAdmin,
    getCardMerchantData,
    getMonthlyAdminData,
    getMonthlyMerchantData,
    compareDataReport,
    getMerchantWithdrawData
};
