const router = require('express').Router();

// controllers
const terms = require('../controllers/terms');

router.route('/')
    .get(terms.getTerms)
    .post()
    .put()
    .delete()

module.exports = router;