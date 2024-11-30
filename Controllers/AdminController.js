const jwt = require("jsonwebtoken");
const adminModel = require("../Models/AdminModel");
var getIP = require('ipware')().get_ip;
const { lookup } = require('geoip-lite');
const loginHistoryModel = require("../Models/LoginHistoryModel");
const moment = require("moment");

const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingAdmin = await adminModel.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({ message: "Email already exists" });
        }


        const admin = await adminModel.create({ email, password });
        const id = admin?._id;
        const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({ message: "Admin created successfully", token });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Incorrect Email or Password" });
        }
        if (admin?.password !== password) {
            return res.status(400).json({ message: "Incorrect Email or Password" })
        }


        var ipInfo = getIP(req);
        console.log(ipInfo);
        const look = lookup(ipInfo?.clientIp);


        const city = `${look?.city}, ${look?.region} ${look?.country}`

        // Create new user with hashed password
        await loginHistoryModel.create({
            ip: ipInfo?.clientIp,
            city,
            adminId: admin?._id,
            loginDate: moment().format("DD MMM YYYY, hh:mm A")
        });



        const adminId = admin?._id;
        const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({ message: "Admin Logged In", token: token, data: admin });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};







// 3. Get by id
const getDataById = async (req, res) => {
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

        const data = await adminModel.findById(adminId);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





const getAllAdmins = async (req, res) => {
    try {
        const admin = await adminModel.find();
        if (admin.length === 0) {
            return res.status(400).json({ message: "Admin Data is Empty" })
        }

        return res.status(200).json({ message: "Data Sent Successfully", data: admin });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};






const updateData = async (req, res) => {
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


        const data = await adminModel.findByIdAndUpdate(adminId,
            { ...req.body, },
            { new: true });
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createAdmin,
    loginAdmin,
    getAllAdmins,
    getDataById,
    updateData
};