const Withdraw = require('../Models/WithdrawModel');
const jwt = require('jsonwebtoken');






// 1. Create 
const createData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;
        console.log("adminId ====> ", adminId);

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }
        else {
            adminId = req.body.merchantId
        }



        const image = req.file;

        const data = await Withdraw.create({
            ...req.body, merchantId: adminId, image: image ? image?.path : "",
        });


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
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

        if (req.query.type === 'merchant') {
            query.merchantId = adminId
        }



        if (search) {
            query.status = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }




        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Withdraw.find(query).sort({ createdAt: -1 })
            .populate(["exchangeId", "merchantId", "withdrawBankId"])
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await Withdraw.find(query).sort({ createdAt: -1 }).countDocuments();;


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
        const data = await Withdraw.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await Withdraw.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;


        const data = await Withdraw.findByIdAndUpdate(id,
            { ...req.body, image },
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
        await Withdraw.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
};
