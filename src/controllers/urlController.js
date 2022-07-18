const mongoose = require('mongoose');  
const validator = require('validator');
const validUrl = require('valid-url')
const shortid = require('shortid');
const axios = require('axios')
const urlModel = require('../models/urlModel');



const createShortUrl = async function(req, res){
    try {
        let {longUrl } = req.body;
        longUrl = longUrl.trim().toLowerCase();

        if(Object.keys(req.body).length === 0) return res.status(400).send({status:false, message:"no data received, empty body can't be processed"});
        if(!longUrl) return res.status(400).send({status:false, message:"please enter the URL value in longUrl key"});
        if(!validUrl.isWebUri(longUrl)) return res.status(400).send({status:false, message:"enter a valid URL"});   //need more URL validation

        const urlExists = await urlModel.findOne({longUrl:longUrl});
        if(urlExists) return res.status(200).send({status:true, data: urlExists})       //for same response each time

        const data = {longUrl:longUrl};
        data.urlCode = shortid.generate().toLowerCase();
        data.shortUrl = "localhost:3000/"+ data.urlCode;
    
        const savedData = await urlModel.create(data);
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
    
        const doc = await urlModel.findOne({urlCode:urlCode});            
        if(!doc) return res.status(404).send({status:false, message:"url not found in our db"});    

        return res.status(302).redirect(doc.longUrl)

    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message}) 
    }

} 



module.exports = {createShortUrl, urlRedirect}


// const regEx = /^\s*http[s]?:[\/][\/][a-z]+\.[\.\-\w!@#$%^&*]*com\s*$/
// console.log(regEx.test("https://google.com"))




