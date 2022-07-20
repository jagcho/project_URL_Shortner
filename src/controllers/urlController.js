const mongoose = require('mongoose');  
const validator = require('validator');
const validUrl = require('valid-url')
const shortid = require('shortid');
const axios = require('axios');
const redis = require('redis');
const {promisify} = require('util')
const urlModel = require('../models/urlModel');

function isUrl(x){
    const regEx = /^\s*http[s]?:\/\/([w]{3}\.)?[a-zA-Z0-9]+\.[a-z]{2,3}(\.[a-z]{2})?(\/[\w\-!:@#$%^&*()+=?\.]*)*\s*$/;
    return regEx.test(x)
}

//-------------------------------------------------------------redis configuration------------------------------------------------------------------//
//Connect to redis: //1. connect to the server 
try {
    const redisClient = redis.createClient(
        12093,
        "redis-12093.c301.ap-south-1-1.ec2.cloud.redislabs.com",
        { no_ready_check: true }
      );
      redisClient.auth("tnHsJoayAhmHj2Q2vidEpfOXAD3IWkW", function (err) {
        if (err) return  console.log(err);
      });
      redisClient.on("connect", async function () {
        console.log("Connected to Redis..");
      });
    
    //2. use the commands :
      const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
      const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
} catch (error) {
    console.log(error)
}
  

  

const createShortUrl = async function(req, res){
    try {
        let {longUrl } = req.body;
        longUrl = longUrl.trim(); 

        if(Object.keys(req.body).length === 0) return res.status(400).send({status:false, message:"no data received, empty body can't be processed"});
        if(!longUrl) return res.status(400).send({status:false, message:"please enter the URL value in longUrl key"});
        if(!isUrl(longUrl)) return res.status(400).send({status:false, message:"enter a valid URL"}); //validating with regEx

        const cachedData = await GET_ASYNC(`${longUrl}`);
        if(cachedData) return res.status(200).send({status:true, data: JSON.parse(cachedData)})
        else{
            const urlDoc = await urlModel.findOne({longUrl:longUrl}).select({_id:0, __v:0}); //for same response each time
            if(urlDoc) {
                await SET_ASYNC(`${longUrl}`, JSON.stringify(urlDoc))
                return res.status(200).send({status:true, data: urlDoc})} 
        } 

        const data = {longUrl:longUrl};
        data.urlCode = shortid.generate().toLowerCase();
        data.shortUrl = "localhost:3000/"+ data.urlCode;
    
        const savedData = await urlModel.create(data);
        delete savedData._doc._id; delete savedData._doc.__v;
        await SET_ASYNC(`${longUrl}`, JSON.stringify(savedData));
        return res.status(201).send({status:true, data:savedData})

    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message})
    }
}


const urlRedirect = async function(req, res){
    try {
        const urlCode = req.params.urlCode;
        if(!urlCode) return res.status(400).send({status:false, message:"enter urlCode at the end of url"});

        if(!shortid.isValid(urlCode)) return res.status(400).send({status:false, message:"invalid format of the urlCode, i.e. it must be of length[7,14] & comprised of only[a-zA-Z0-9_-] "});
        
        
        const doc = await urlModel.findOne({urlCode:urlCode});            
        if(!doc) return res.status(404).send({status:false, message:"url not found in our db"});    

        return res.status(302).redirect(doc.longUrl)

    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message}) 
    }

} 

const flushw = (req, res) => {
    redisClient.flushall("ASYNC", (err, data) => {
      if (err)
        console.log(err)
      else if (data)
        console.log("Memory flushed: ", data)
    })
    res.status(200).send({ msg: "redis memery cleared" })
}

module.exports = {createShortUrl, urlRedirect, flushw}



// let access = false; //verifying with axios call
// await axios.get(longUrl)
//             .then((response)=>{ if(response.status===200 || response.status===201) access = true;})
//             .catch((error)=> console.log(error));
// if(access === false) return res.status(400).send({status:false, message:`${longUrl} is not working currently`}) //allclear except for amazon type url.


// "redis": "^4.2.0",
//"^3.1.2", will work