const express = require("express")
const router = require("./router/route")
const mongoose = require("mongoose")
const app = express();
const bodyParser = require('body-parser');


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://dkumardb:abngf_1996@cluster0.g7ksvc2.mongodb.net/project-4Group69?retryWrites=true&w=majority", {
    useNewUrlParser: true,
})

    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use("/", router)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});