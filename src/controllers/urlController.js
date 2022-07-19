const mongoose = require('mongoose');  
const validator = require('validator');
const validUrl = require('valid-url')
const shortid = require('shortid');
const axios = require('axios')
const urlModel = require('../models/urlModel');

function isUrl(x){
    const regEx = /^\s*http[s]?:\/\/([w]{3}\.)?[a-zA-Z0-9]+\.[a-z]{2,3}(\.[a-z]{2})?(\/[\w\-!:@#$%^&*()+=?\.]*)*\s*$/;
    return regEx.test(x)
}

const createShortUrl = async function(req, res){
    try {
        let {longUrl } = req.body;
        longUrl = longUrl.trim(); 

        if(Object.keys(req.body).length === 0) return res.status(400).send({status:false, message:"no data received, empty body can't be processed"});
        if(!longUrl) return res.status(400).send({status:false, message:"please enter the URL value in longUrl key"});
        if(!isUrl(longUrl)) return res.status(400).send({status:false, message:"enter a valid URL"});   

        const load = await axios(longUrl)
        const arrCode = [200, 201, 302];                                                                              

        if(!arrCode.includes(load.status)) return res.status(400).send({status:false, message:`${longUrl} is not working currently`}) 

        const urlExists = await urlModel.findOne({longUrl:longUrl}).select({_id:0, __v:0});
        if(urlExists) return res.status(200).send({status:true, data: urlExists})       //for same response each time

        const data = {longUrl:longUrl};
        data.urlCode = shortid.generate().toLowerCase();
        data.shortUrl = "localhost:3000/"+ data.urlCode;
    
        const savedData = await urlModel.create(data);
        delete savedData._doc._id; delete savedData._doc.__v; console.log(savedData)

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



module.exports = {createShortUrl, urlRedirect}






