const jwt = require("jsonwebtoken");
const betsModel = require("../Models/BetsModel");
const userModel = require("../Models/UserModel");

const createBets = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded?.id || null;

        const bets = req.body.bets;
        if (!Array.isArray(bets) || bets.length === 0) {
            return res.status(400).json({ message: 'No bets provided' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        if (user?.disabled) {
            return res.status(400).json({ message: 'User disabled by Admin' });
        }

        const totalBetAmount = bets.reduce((acc, bet) => acc + bet.amount, 0);

        if (user.wallet < totalBetAmount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        user.wallet -= totalBetAmount;
        await user.save();

        const betsData = bets.map(bet => ({
            ...bet,
            user: userId
        }));

        await betsModel.insertMany(betsData);

        return res.status(200).json({ message: "Bets placed successfully", wallet: user.wallet });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const getAllBets = async (req, res) => {
    try {
        const bets = await betsModel.find();
        if (bets.length === 0) {
            return res.status(400).json({ message: "No Bet Found" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: bets });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllBetsByAdmin = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const adminId = decoded?.id || decoded?.adminId;

        const bets = await betsModel.find({ admin: adminId });
        if (bets.length === 0) {
            return res.status(400).json({ message: "No Bet Found" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: bets });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllBetsByUser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded?.id;

        const bets = await betsModel.find({ user: userId });
        if (bets.length === 0) {
            return res.status(400).json({ message: "No Bet Found" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: bets });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllOpenBetsByUser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded?.id;

        const bets = await betsModel.find({ user: userId, status: "pending" });
        if (bets.length === 0) {
            return res.status(400).json({ message: "No Bet Found" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: bets });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

module.exports = {
    createBets,
    getAllBets,
    getAllBetsByAdmin,
    getAllBetsByUser,
    getAllOpenBetsByUser
};