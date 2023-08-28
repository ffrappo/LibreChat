const express = require('express');
const { addProfileHitsCredit } = require('../../utils');

const router = express.Router();

router.post('/profileHits', async (req) => {
  const { userId } = req.body;
  addProfileHitsCredit(userId);
});

module.exports = router;