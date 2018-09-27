const bodyParser = require('body-parser')
const tvm_bridge = require('./tvm_bridge');

const urlencodedParser = bodyParser.urlencoded({ extended: true })

module.exports.build = function (app, cors) {
  app.post('/createWallet', urlencodedParser, createWallet)
  app.post('/sendTransaction', urlencodedParser, sendTransaction)
  app.get('/getBalance', getBalance)
  app.get('/getTransactions', getTransactions)
  app.get('/getTransaction', getTransaction)
}

function createWallet(req, res) {
  if (!req.body.publicKey) {
    throw new Error("Invalid POST params /createWallet, may be invalid parametr "+
      "or data type not urlencoded")
  } else {
    var publicKey = req.body.publicKey
    assertParamsOnEmpty("createWallet", [publicKey])
    var result = { "address" : tvm_bridge.createWallet(publicKey) }
    res.send(JSON.stringify(result))
  }
}

function sendTransaction(req, res) {
  if (!req.body.from || !req.body.recipient || !req.body.value || !req.body.signature) {
    throw new Error("Invalid POST params /sendTransaction, may be invalid parametr "+
      "or data type not urlencoded")
  } else {
    var from = req.body.from
    var recipient = req.body.recipient
    var value = req.body.value
    var signature = req.body.signature
    assertParamsOnEmpty("sendTransaction", [from, recipient, value, signature])
    var result = { "transactionId" : tvm_bridge.sendTransaction(from, recipient, parseInt(value), signature) }
    res.send(JSON.stringify(result))
  }
}

function getBalance(req, res) {
  if (!req.query.account) {
    throw new Error("Invalid GET params "+req.url)
  } else {
    var account = req.query.account;
    assertParamsOnEmpty("getBalance", [account])
    var result = { "balance" : tvm_bridge.getBalance(account) }
    res.send(JSON.stringify(result))
  }
}

function getTransactions(req, res) {
  if (!req.query.account) {
    throw new Error("Invalid GET params "+req.url)
  } else {
    var account = req.query.account;
    var offset = req.query.offset;
    var limit = req.query.limit;
    var direction = req.query.order;
    if (direction == "" || direction == undefined) {
        throw new Error("Expected transactions order parameter: &order=from-newest or &order=from-oldest");
    }
    assertParamsOnEmpty("getTransactions", [account])
    var take_newest = direction.toLowerCase() == "from-newest"
    var result = { "transactions" : tvm_bridge.getTransactions(account, offset,  limit, take_newest) }
    res.send(JSON.stringify(result))
  }
}

function getTransaction(req, res) {
  if (!req.query.transaction) {
    throw new Error("Invalid GET params "+req.url)
  } else {
    var account = req.query.account;
    var transaction = req.query.transaction;
    assertParamsOnEmpty("getTransaction", [transaction, account])
    var result = { "transaction" : tvm_bridge.getTransaction(account, transaction) }
    res.send(JSON.stringify(result))
  }
}

function assertParamsOnEmpty(method, params) {
  params.forEach(function(item, index, array) {
    if (item == "" || item == undefined) {
      throw new Error("Invalid params in "+method+" params: "+params)
    }
  });
}
