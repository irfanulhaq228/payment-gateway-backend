const jwt = require("jsonwebtoken");
const bankModel = require("../Models/BankModel.js");

const createBank = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }
        const id = jwt.verify(token, process.env.SECRET_KEY);
        const userId = id?.id || null;
        const adminId = id?.adminId || req.body.admin || null;
        const bankData = { ...req.body, userId: userId, adminId: adminId };
        const bank = new bankModel(bankData);
        await bank.save();
        return res.status(200).json({ message: "Bank added successfully", data: bank });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllBanks = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded?.id || null;
        const adminId = decoded?.adminId || null;
        const banks = await bankModel.find({
            userId: userId,
            adminId: adminId
        });
        if (banks.length === 0) {
            return res.status(400).json({ message: "Bank Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: banks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getBanks = async (req, res) => {
    try {
        const banks = await bankModel.find();
        if (banks.length === 0) {
            return res.status(400).json({ message: "Bank Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: banks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAdminsBank = async (req, res) => {
    try {
        const banks = await bankModel.find({ userId: null });
        if (banks.length === 0) {
            return res.status(400).json({ message: "Bank Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: banks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAdminsActiveBank = async (req, res) => {
    try {
        const banks = await bankModel.find({ userId: null, status: true });
        if (banks.length === 0) {
            return res.status(400).json({ message: "Bank Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: banks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllActiveBanks = async (req, res) => {
    try {
        const { id } = req.params;
        const banks = await bankModel.find({ status: true, adminId: id });
        if (banks.length === 0) {
            return res.status(400).json({ message: "Bank Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: banks });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const deleteBank = async (req, res) => {
    try {
        const { id } = req.params;
        const bank = await bankModel.findByIdAndDelete(id);
        if (bank) {
            return res.status(200).json({ message: "Bank Deleted Successfully" });
        }
        return res.status(400).json({ message: "Wrong Bank Id" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const updateBank = async (req, res) => {
    try {
        const { id } = req.params;
        await bankModel.findByIdAndUpdate(id, req.body);
        return res.status(200).json({ message: "Bank Updated" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

module.exports = {
    createBank,
    getAllBanks,
    getAllActiveBanks,
    deleteBank,
    updateBank,
    getBanks,
    getAdminsBank,
    getAdminsActiveBank
};