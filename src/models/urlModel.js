const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({

    urlCode : {type:String, required:true, unique:true, trim:true, lowercase:true}, //urlCode?
    longUrl : {type:String, required:true},
    shortUrl: {type:String, required:true, unique:true}

}); //timestamps?

module.exports = mongoose.model('Url', urlSchema);