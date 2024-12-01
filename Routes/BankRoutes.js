
const { getAllData, createData, getDataById, updateData, deleteData,  activeData }=require('../Controllers/BankController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router=require('express').Router()

router.get('/getAll',authenticate,getAllData)
router.post('/create',upload.single('image'),authenticate,createData)
router.get('/get/:id',getDataById)
router.post('/active',authenticate,activeData)
router.put('/update/:id',upload.single('image'),updateData)
router.delete('/delete/:id',authenticate,deleteData)


module.exports=router

