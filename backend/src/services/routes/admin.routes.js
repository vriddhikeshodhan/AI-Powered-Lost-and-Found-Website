// backend/src/routes/admin.routes.js

const express          = require('express');
const router           = express.Router();
const { verifyToken }  = require('../../middleware/auth.middleware'); 
const { isAdmin }      = require('../../middleware/admin.middleware');
const { runExpiryJob } = require('../../jobs/expiry.job');
const {
    getStats,
    getUsers,
    getItems,
    deactivateUser,
    reactivateUser,
    forceResolveItem,
    deleteItem
} = require('../../controllers/admin.controller');

router.use(verifyToken, isAdmin);

router.get('/stats', getStats);


router.get('/users',                       getUsers);
router.patch('/users/:userId/deactivate',  deactivateUser);
router.patch('/users/:userId/reactivate',  reactivateUser);

router.get('/items',                       getItems);
router.patch('/items/:itemId/resolve',     forceResolveItem);
router.delete('/items/:itemId',            deleteItem);

router.post('/run-expiry', async (req, res) => {
    const result = await runExpiryJob();
    return res.json({ success: true, ...result });
});

module.exports = router;