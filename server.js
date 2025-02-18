const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const db = require("./db/db.js");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const axios = require("axios");
const PDFParser = require("pdf2json");
const Ledger = require('./Models/LedgerModel');
const Admin = require('./Models/AdminModel');


const AdminRouter = require("./Routes/adminRoutes.js");
const LoginHistoryRouter = require("./Routes/LoginHistoryRoutes.js");
const MerchantRouter = require("./Routes/MerchantRoutes.js");
const StaffRouter = require("./Routes/StaffRoutes.js");
const BankRouter = require("./Routes/BankRoutes.js");
const LedgerRouter = require("./Routes/LedgerRoutes.js");
const TicketRouter = require("./Routes/TicketRoutes.js");
const ApprovalRouter = require("./Routes/ApprovalRoutes.js");
const TransactionSlipRoutes = require("./Routes/TransactionSlipRoutes.js");
const websiteRoutes = require("./Routes/WebsiteRoutes.js");
const TicketReplyRoutes = require("./Routes/TicketReplyRoutes.js");
const { upload } = require("./Multer/Multer.js");

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



app.use("/ticketReply", TicketReplyRoutes);
app.use("/website", websiteRoutes);
app.use("/admin", AdminRouter);
app.use("/loginHistory", LoginHistoryRouter);
app.use("/merchant", MerchantRouter);
app.use("/staff", StaffRouter);
app.use("/bank", BankRouter);
app.use("/ledger", LedgerRouter);
app.use("/ticket", TicketRouter);
app.use("/approval", ApprovalRouter);
app.use("/slip", TransactionSlipRoutes);

// const extractPdfData = (pdfPath) => {
//     return new Promise((resolve, reject) => {
//         const pdfParser = new PDFParser();
//         pdfParser.loadPDF(pdfPath);

//         pdfParser.on("pdfParser_dataReady", (pdfData) => {
//             resolve(pdfData);
//         });

//         pdfParser.on("pdfParser_dataError", (err) => {
//             reject(err);
//         });
//     });
// };

// app.post("/read-statement", upload.single("file"), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//     }

//     try {
//         const pdfPath = req.file.path;
//         const structuredData = await extractPdfData(pdfPath);
//         fs.unlinkSync(pdfPath); // Delete file after processing

//         const jsonResponse = await getTransactionsFromGPT(structuredData);

//         if (!jsonResponse) {
//             return res.status(500).json({ error: "Failed to process transactions" });
//         }

//         return res.json(JSON.parse(jsonResponse));
//     } catch (error) {
//         return res.status(500).json({ error: "Error processing PDF", details: error.message });
//     }
// });

// const getTransactionsFromGPT = async (structuredData) => {
//     const prompt = `
//         Convert the following structured PDF data into a JSON array of transactions with:
//         - date (DD-MM-YYYY format)
//         - description
//         - utr (if available, extract it)
//         - credit (if "CR", assign to credit; else 0)
//         - debit (if "DR", assign to debit; else 0)
//         - balance

//         Ensure the response is valid JSON **without markdown formatting** like \`\`\`json.
        
//         Example Output:
//         {
//           "transactions": [
//             { "date": "10-02-2024", "description": "Amazon Purchase", "utr": "123456", "credit": 0, "debit": 50.00, "balance": 950.00 },
//             { "date": "12-02-2024", "description": "Salary Credit", "utr": "789012", "credit": 2000.00, "debit": 0, "balance": 2950.00 }
//           ]
//         }

//         Structured PDF Data:
//         ${JSON.stringify(structuredData)}
//     `;

//     try {
//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions",
//             {
//                 model: "gpt-4-turbo",
//                 messages: [{ role: "user", content: prompt }],
//                 temperature: 0.3
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         let content = response.data.choices[0].message.content.trim();

//         // Remove Markdown Code Block (```json ... ```)
//         if (content.startsWith("```json")) {
//             content = content.replace(/^```json/, "").replace(/```$/, "").trim();
//         }

//         return JSON.parse(content);
//     } catch (error) {
//         console.error("Error calling ChatGPT API:", error.response?.data || error.message);
//         return { error: "Error processing transactions" };
//     }
// };



const declineOldLedgers = async () => {
    try {

        const data = await adminModel.find();


      const fiveMinutesAgo = new Date(Date.now() - data[0]?.timeMinute?data[0]?.timeMinute:5 * 60 * 1000);
  
      const result = await Ledger.updateMany(
        {
          createdAt: { $lte: fiveMinutesAgo },
          updatedAt: { $eq: "$createdAt" }, // Ensures nothing was updated
        },
        { $set: { status: "Decline" } }
      );
  
      console.log(`Updated ${result.modifiedCount} ledgers to 'declined' status.`);
    } catch (error) {
      console.error("Error updating ledgers:", error);
    }
  };



  setTimeout(() => {
    declineOldLedgers()
  }, 3000);



app.listen(process.env.PORT, () => {
    console.log(`Server runs at port ${process.env.PORT}`);
});





