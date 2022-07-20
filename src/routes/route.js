const express = require('express');
const router = express.Router();
const {createShortUrl, urlRedirect, flushw} = require('../controllers/urlController.js');


router.post('/url/shorten', createShortUrl);
router.get('/:urlCode', urlRedirect);
router.put('/clearCache', flushw);


module.exports = router;