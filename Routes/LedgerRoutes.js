
const {  createData, getDataById, updateData, deleteData,  imageUploadData, getAllAdminData, getAllMerchantData }=require('../Controllers/LedgerController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router=require('express').Router()

router.get('/getAllAdmin',authenticate,getAllAdminData)
router.get('/getAllMerchant',authenticate,getAllMerchantData)
router.post('/create',upload.single('image'),createData)
router.post('/getImageData',upload.single('image'),imageUploadData)
router.get('/get/:id',getDataById)
router.put('/update/:id',upload.single('image'),updateData)
router.delete('/delete/:id',authenticate,deleteData) 


module.exports=router

