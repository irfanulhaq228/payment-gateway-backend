const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const db = require("./db/db.js");

const AdminRouter = require("./Routes/adminRoutes.js");
const LoginHistoryRouter = require("./Routes/LoginHistoryRoutes.js");
const MerchantRouter = require("./Routes/MerchantRoutes.js");

// const UserRouter = require("./Routes/userRoutes.js");
// const GameRouter = require("./Routes/gameRoutes.js");
// const WebsiteRouter = require("./Routes/colorRoutes.js");
// const BankRouter = require("./Routes/BankRoutes.js");
// const DepositRouter = require("./Routes/DepositRoutes.js");
// const WithdrawRouter = require("./Routes/WithdrawRoutes.js");
// const BetRouter = require("./Routes/BetRoutes.js");
// const LedgerRouter = require("./Routes/LedgerRoutes.js");

dotenv.config();
const app = express();
const router = express.Router();
router.use(bodyParser.json());
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Authorization, Content-Type',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

db;

app.get("/", (req, res) => {
    res.json({ message: "Payment Gateway Backend is running correctly!!!" });
});

app.use("/admin", AdminRouter);
app.use("/loginHistory", LoginHistoryRouter);
app.use("/merchant", MerchantRouter);

// app.use("/user", UserRouter);
// app.use("/game", GameRouter);
// app.use("/website", WebsiteRouter);
// app.use("/bank", BankRouter);
// app.use("/deposit", DepositRouter);
// app.use("/withdraw", WithdrawRouter);
// app.use("/bet", BetRouter);
// app.use("/ledger", LedgerRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server runs at port ${process.env.PORT}`);
});