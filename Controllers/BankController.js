const Bank = require('../Models/BankModel');
const Merchant = require('../Models/MerchantModel');
const jwt = require('jsonwebtoken');


// 1. Create 
const createData = async (req, res) => {
    try {


        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;

        const merchantData = await Bank.find({ merchantId: adminId }).sort({ createdAt: -1 });

        const totalAmount = merchantData?.reduce((sum, item) => sum + Number(item.accountLimit), 0);

        const totalAccountLimit = Number(totalAmount) + Number(req.body.accountLimit)

        const merchantLimit = await Merchant.findOne({ _id: adminId })



        const accountLimit = merchantLimit?.accountLimit




        if (!merchantLimit?.verify) {
            return res.status(400).json({ status: 'fail', message: 'Please verify your account!' });
        }

        if (totalAccountLimit > accountLimit) {
            return res.status(403).json({ status: 'fail', message: 'Merchant has reached maximum limit of amount' });
        }


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        const accountNo = await Bank.findOne({ accountNo: req.body.accountNo });

        if (accountNo) {
            return res.status(409).json({ status: 'fail', message: 'Account Number already exists' });
        }

        const iban = await Bank.findOne({ iban: req.body.iban });

        if (iban) {
            return res.status(409).json({ status: 'fail', message: 'IBAN already exists' });
        }



        const image = req.file;

        const data = await Bank.create({
            ...req.body, image: image ? image?.path : "", merchantId: adminId, remainingLimit: req.body.accountLimit
        });



        await Merchant.findByIdAndUpdate(adminId,
            { accounts: merchantData.length + 1 },
            { new: true });

        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllData = async (req, res) => {
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
        const data = await Bank.find({ merchantId: adminId, accountType: req?.query?.accountType }).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 2. Get all s
const getUserData = async (req, res) => {
    try {

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Bank.find({
            block: false,
            accountType: req?.query?.accountType,
        })
            .populate({
                path: 'merchantId',
                match: { website: req?.query?.website },
                select: 'website', // Optional: only retrieve the website field
            })
            .sort({ createdAt: -1 })
            .exec();

        // Filter out any documents where merchantId is null
        const filteredData = data.filter((item) => item.merchantId !== null);


        return res.status(200).json({ status: 'ok', data: filteredData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Bank.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await Bank.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;
        const data = await Bank.findByIdAndUpdate(id,
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
        await Bank.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const activeData = async (req, res) => {
    try {

        const id = req.query.id;
        const accountType = req.query.accountType;

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        if (!accountType) {
            return res.status(400).json({ status: 'fail', message: 'Please provide account type!' });
        }



        const data = await Bank.findOneAndUpdate({ _id: id, accountType },
            { block: false },
            { new: true });




        await Bank.updateMany(
            { merchantId: adminId, accountType, _id: { $ne: id } },
            { $set: { block: true } }
        );


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





module.exports = {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData,
    activeData,
    getUserData
};
