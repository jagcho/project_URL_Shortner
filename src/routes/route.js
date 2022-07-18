const express = require('express');
const router = express.Router();
const {createShortUrl, urlRedirect} = require('../controllers/urlController.js');


router.post('/url/shorten', createShortUrl);
router.get('/:urlCode', urlRedirect);


module.exports = router;