const Ledger = require('../Models/LedgerModel');
const Merchant = require('../Models/MerchantModel');
const jwt = require('jsonwebtoken');
const tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");


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

        const websiteData = await Merchant.findOne({ website: req.body.website });

        console.log(websiteData?.adminId);


        const image = req.file;
 
        const data = await Ledger.create({
            ...req.body, image: image ? image?.path : "", merchantId: websiteData?._id, adminId: websiteData?.adminId
        });


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
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

            console.log(data);
            


        const count = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 }).countDocuments();;


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


        const count = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 }).countDocuments();;


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


        return res.status(200).json({ status: 'ok', data:totalSum,  });
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
    
        // Convert adminId to ObjectId
        const merchantFilter = { adminId: adminId };
    
    
        const records = await Ledger.find(merchantFilter);
    
        // Debug: Log the fetched records
        console.log('Fetched Records:', records);
    
        if (!records.length) {
          return res.status(404).json({ status: 'fail', message: 'No records found for this admin!' });
        }
    
        // Group data by month, year, and status
        const groupedData = {};
    
        records.forEach((record) => {
          const createdAt = new Date(record.createdAt);
          const year = createdAt.getFullYear();
          const month = createdAt.getMonth() + 1; // getMonth() is zero-based
          const status = record.status;
          const total = record.total || 0;
    
          const key = `${year}-${month}`;
    
          if (!groupedData[key]) {
            groupedData[key] = { year, month, statuses: {} };
          }
    
          if (!groupedData[key].statuses[status]) {
            groupedData[key].statuses[status] = 0;
          }
    
          // Sum up the totals for each status
          groupedData[key].statuses[status] += total;
        });
    
        // Convert grouped data to an array for the response
        const formattedReport = Object.values(groupedData);
    
        // Debug: Log the formatted report
        console.log('Formatted Report:', formattedReport);
    
    
        return res.status(200).json({ status: 'ok', data: formattedReport });
      } catch (err) {
        console.error(err); // Log the error for debugging
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
    const adminId = decoded.adminId;

    if (!adminId) {
      return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
    }

    // Convert adminId to ObjectId
    const merchantFilter = { merchantId: adminId };


    const records = await Ledger.find(merchantFilter);

    // Debug: Log the fetched records
    console.log('Fetched Records:', records);

    if (!records.length) {
      return res.status(404).json({ status: 'fail', message: 'No records found for this merchant!' });
    }

    // Group data by month, year, and status
    const groupedData = {};

    records.forEach((record) => {
      const createdAt = new Date(record.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // getMonth() is zero-based
      const status = record.status;
      const total = record.total || 0;

      const key = `${year}-${month}`;

      if (!groupedData[key]) {
        groupedData[key] = { year, month, statuses: {} };
      }

      if (!groupedData[key].statuses[status]) {
        groupedData[key].statuses[status] = 0;
      }

      // Sum up the totals for each status
      groupedData[key].statuses[status] += total;
    });

    // Convert grouped data to an array for the response
    const formattedReport = Object.values(groupedData);

    // Debug: Log the formatted report
    console.log('Formatted Report:', formattedReport);


    return res.status(200).json({ status: 'ok', data: formattedReport });
  } catch (err) {
    console.error(err); // Log the error for debugging
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


        return res.status(200).json({ status: 'ok', data:totalSum,  });
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


        const data = await Ledger.findByIdAndUpdate(id,
            { ...req.body, image: image },
            { new: true });
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
        const {utr, total} = req.body;

        

        const data = await Ledger.findOne({utr});

        if(!data){
            return res.status(400).json({ status: 'fail', message: 'No such transaction found!' });
        }

        if(total!==data?.total){
            return res.status(400).json({ status: 'fail', message: 'Your amount is not match with your transaction!' });
        }

        const updateData = await Ledger.findByIdAndUpdate(data?._id,
            { status:'Verified' },
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
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
    getCardAdminData,
    getCardMerchantData,
    getMonthlyAdminData,
    getMonthlyMerchantData,
    compareDataReport,
};
