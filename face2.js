const fs = require('fs')
const path = require('path')
const axios = require('axios')
const client = require('https')
const http = require('http')
const { v4: uuidv4 } = require('uuid')

const express = require("express");
const fileUpload = require("express-fileupload");
const faceApiService = require("./faceapiService.js");

const hostname = '127.0.0.1'
const port = 2002

// get querystring parameters
var params=function(req){
  let q=req.url.split('?'),result={}
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1]
           } catch (e) {
             result[item.split('=')[0]]=''
           }
      })
  }
  return result
}

var url_params
const server = http.createServer((req, res) => {
  req.params=params(req)
  url_params = req.params
  //console.log(req.params.img)

  if (req.params.img) {
    console.log("Image requested: " + req.params.img)
    downloadImage(req.params.img, uuidv4(), res)
  } else {
    var fail = {}
    res.end(JSON.stringify(fail))
  }
})


server.listen(port, hostname, () => {
  // create temp folder if it doesn't exist
  var dir = './tmp'
  if (!fs.existsSync(dir)){
    console.log("Created tmp directory")
    fs.mkdirSync(dir)
  }

  console.log(`Server running at http://${hostname}:${port}/`)
})

async function downloadImage(url, filepath, res) {
var fail = {}

axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

    filepath = "./tmp/" + filepath
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', () => {
        console.log(url)

        // log error and process
        var fail = {}
        res.end(JSON.stringify(fail))
      })
      .on('finish', () => {
        getFaceData(filepath, res)
      })
    })
  .catch(function(err) {
    var fail = {}
    res.end(JSON.stringify(fail))
    console.log("Error: image not found")
  })
}

async function getFaceData(file, res) {
  if (file) {

    const data = fs.readFileSync(file)
    const result = await faceApiService.detect(data, "output.tmp")

    var out = {}
    var numfaces = 0
    if (result) { numfaces = result.length }
    out.faces = numfaces
    res.end(JSON.stringify(out))

    // delete file
    fs.unlink(file, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
  }
}
