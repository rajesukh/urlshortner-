const redis = require("redis");
const { promisify } = require("util");

const urlModel = require("../model/urlmodel")
const urlvalidation = require("url-validation")
const shortid = require("shortid")

const isValidRequest = function (request) {
  return (Object.keys(request).length > 0)
}
//value validation
const isValidValue = function (value) {
  if (typeof value === 'undefined' || value === null) return false
  if (typeof value === 'string' && value.trim().length === 0) return false
  if (typeof value === 'number' && value.toString().trim().length === 0) return false
  return true
}
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//Connect to redis
const redisClient = redis.createClient(
  13846,
  "redis-13846.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Q8KAIqByiQFLzNZcca6ZqBQojlsJOPKR", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Api Create Url >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const createurl = async function (req, res) {
  try {
    let url = req.body

    // first we check req.body empty or not.
    if (!isValidRequest(url)) return res.status(400).send({ status: false, message: "please enter data in body" })

    // we check here if any put empty string or extra space.
    if (!isValidValue(url.longUrl)) return res.status(400).send({ status: false, message: "please enter valid input" })

    //  we check here url is in valid format or not.
    if (!urlvalidation(url.longUrl)) return res.status(400).send({ status: false, message: "please enter valid url" })

    // Ensure that user input only longUrl.
    let val = (Object.keys(url))
    if (!(val.length == 1 && val[0] == "longUrl"))
      return res.status(400).send({ status: false, message: "Input only longUrl" })

    // First check in cache for the document if present then return from here.
    let cacheurl = await GET_ASYNC(`${url.longUrl}`)
    if (cacheurl) {
      let abc = JSON.parse(cacheurl)
      return res.status(200).send({ status: true, data: abc })
    }

    // Then look into database.  
    else if (!cacheurl) {
      let sameurl = await urlModel.findOne({ longUrl: url.longUrl }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 })

      // If not found then create the document in database and set in cache.
      if (sameurl == null) {
        let urlCode = shortid.generate().toLowerCase()
        let baseurl = "http://localhost:3000/"
        let shortUrl = baseurl + urlCode
        let longUrl = url.longUrl.trim()

        let urldata = { longUrl, shortUrl, urlCode }
        await urlModel.create(urldata)
        await SET_ASYNC(`${longUrl}`, JSON.stringify(urldata))
        return res.status(201).send({ status: true, data: urldata })
      }

      // If found in database then return the data and set in cache. 
      await SET_ASYNC(`${url.longUrl}`, JSON.stringify(sameurl))
      return res.status(200).send({ status: true, data: sameurl })
    }

  } catch (err) { return res.status(500).send({ status: false, msg: err.message }) }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Api Get Url >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const geturl = async (req, res) => {
  try {
    let codeurl = req.params.urlCode

    // Check input is vaild urlcode or not. 
    if ((shortid.isValid(codeurl) == false) || (codeurl.length <= 7) || (codeurl.length >= 14)) {
      return res.status(400).send({ status: false, message: "please enter valid urlCode" })
    }

    // Then look into the cache for the specific data.  
    let cacheurl = await GET_ASYNC(`${codeurl}`)
    let data = JSON.parse(cacheurl)

    // If found the data then return and redirect with the longUrl. 
    if (cacheurl) {
      return res.status(302).redirect(data.longUrl)


    }

    // Else look into database for the data and set the data in cache for next search. 
    else {
      let findurlcode = await urlModel.findOne({ urlCode: codeurl }).select({ urlCode: 0, _id: 0 });

      if (findurlcode != null) {
        await SET_ASYNC(`${codeurl}`, JSON.stringify(findurlcode))
        return res.status(302).redirect(findurlcode.longUrl);
      }
      // If didn't find the data in database.
      else {
        return res.status(404).send({ status: false, message: "unable to find url" })
      }
    }

  } catch (err) { return res.status(500).send({ status: false, msg: err.message }) }
}


module.exports = { createurl, geturl }