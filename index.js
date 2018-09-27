const fs = require('fs')
const http = require('http')
const https = require('https')
const privateKey  = fs.readFileSync('87h158wdg/87ahdawd2.key', 'utf8')
const certificate = fs.readFileSync('87h158wdg/87hda8wdh.crt', 'utf8')
const credentials = {key: privateKey, cert: certificate}
const express = require('express')
const cors = require('cors')
const app = express()
const request_handler = require('./request_handler')

const http_port = 8080
const https_port = 8443
const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app)

app.use(cors())
request_handler.build(app, cors)

app.use((err, req, res, next) => {
    res.status(500).send("Internal error")
    console.log('Exception '+err.message)
})

app.use(function(req, res, next) {
  res.status(404).send("Not found")
  console.log('Exception Not found '+req.url)
})

httpServer.listen(http_port, (err) => listen(http_port, err))
httpsServer.listen(https_port, (err) => listen(https_port, err))


function listen(port, err) {
  if (err) {
      return console.log('Exception '+err)
  }
  console.log("Server is listening on port "+port)
}
