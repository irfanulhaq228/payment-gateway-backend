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

        if(!req.body.website){
            return res.status(400).json({ status: 'fail', data, message: 'Please provide website!' });
        }

        const websiteData = await Merchant.findOne({website: req.body.website});

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
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find({ adminId: adminId }).populate(["bankId"]).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
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

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find({ merchantId: adminId }).populate(["bankId"]).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
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







module.exports = {
    createData,
    imageUploadData,
    getAllAdminData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
};
