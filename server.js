const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const db = require("./db/db.js");


const AdminRouter = require("./Routes/adminRoutes.js");
const LoginHistoryRouter = require("./Routes/LoginHistoryRoutes.js");
const MerchantRouter = require("./Routes/MerchantRoutes.js");
const BankRouter = require("./Routes/BankRoutes.js");
const LedgerRouter = require("./Routes/LedgerRoutes.js");
const TicketRouter = require("./Routes/TicketRoutes.js");



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
app.use("/bank", BankRouter);
app.use("/ledger", LedgerRouter);
app.use("/ticket", TicketRouter);



app.listen(process.env.PORT, () => {
    console.log(`Server runs at port ${process.env.PORT}`);
});