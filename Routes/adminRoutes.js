const express = require("express");
const { createAdmin, getAllAdmins, loginAdmin, updateData } = require("../Controllers/AdminController");

const AdminRouter = express.Router();

AdminRouter.post("/", createAdmin);
AdminRouter.get("/", getAllAdmins);
AdminRouter.post("/login", loginAdmin);
AdminRouter.post("/update/:id", updateData);

module.exports = AdminRouter;