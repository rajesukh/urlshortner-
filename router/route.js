const express = require('express');

const router = express.Router();

const urlcontroller = require("../controller/urlcontroller")



// api>>>>>>>>>
router.post("/url/shorten", urlcontroller.createurl)
router.get("/:urlCode", urlcontroller.geturl)

// global route>>>>>>>>>>
router.all("*", function (req, res) {
    res.status(400).send({
        status: false,
        msg: "please enter valid input"
    })
})
module.exports = router