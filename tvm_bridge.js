const ffi = require('ffi')
var ref = require("ref");
var ArrayType = require("ref-array");
var ByteArray = ArrayType(ref.types.byte);

const api = ffi.Library('./debug/libtonlabs_sdk_emulator', {
    'account_address_size': ['byte', []],
    'public_key_size': ['byte', []],
    'signature_size': ['byte', []],
    'get_balance': ['int64', [ByteArray]],
    'create_wallet': ['string', [ByteArray]],
    'sendTransaction': ['string', [ByteArray, ByteArray, 'uint32', ByteArray]],
    'get_transactions': ['string', [ByteArray, 'uint64']],
    'get_transactions_count': ['uint32', [ByteArray]],
    'get_transaction_from': ['string', [ByteArray, 'uint64']],
    'get_transaction_to': ['string', [ByteArray, 'uint64']],
    'get_transaction_time': ['string', [ByteArray, 'uint64']],
    'get_transaction_amount': ['string', [ByteArray, 'uint64']],
});

const ACCOUNT_ADDRESS_SIZE = api.account_address_size();
const PUBLIC_KEY_SIZE = api.public_key_size();
const SIGNATURE_SIZE = api.signature_size();

var parseHexString = function(value, array_size, targetLongName) {
  var parsed = new Uint8Array(value.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  }));
  if (parsed.length != array_size) {
    throw new Error(
      "Invalid " + targetLongName + " length. " +
      "Expected "+ array_size + " bytes in hex format."
    );
  }
  return Array.from(parsed);
};
var toHexString = function (byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
};

module.exports.createWallet = function (publicKey) {
  var key = parseHexString(publicKey, PUBLIC_KEY_SIZE, "public key"); 
  return api.create_wallet(key)
}

module.exports.sendTransaction = function (from, recipient, value, signature) {
  var from_address = parseHexString(from, ACCOUNT_ADDRESS_SIZE, "from account address");
  var recipient_address = parseHexString(
    recipient, 
    ACCOUNT_ADDRESS_SIZE, 
    "recipient account address"
  );
  var signature_value = parseHexString(signature, SIGNATURE_SIZE, "signature");
  var amount = parseInt("" + value, 10);
  if (isNaN(amount)) {
     throw new Error("Invalid value: not a number");
  }
  if (amount < 0) {
     throw new Error("Value can not be negative");
  }
  return api.sendTransaction(from_address, recipient_address, amount, signature_value);
}

module.exports.getBalance = function (account) {
  var account_address = parseHexString(account, ACCOUNT_ADDRESS_SIZE, "account address");
  return api.get_balance(account_address);
}

var getTransaction = module.exports.getTransaction = function (account, transaction) {
  var address = parseHexString(account, ACCOUNT_ADDRESS_SIZE, "account address");
  var transaction_id = parseInt(""+transaction);
  if (isNaN(transaction_id)) {
    throw new Error("Malformed transaction id");
  }
  var transaction = {
    'id': transaction_id,
    'from': api.get_transaction_from(address, transaction_id),
    'to': api.get_transaction_to(address, transaction_id),
    'time': api.get_transaction_time(address, transaction_id),
    'amount': api.get_transaction_amount(address, transaction_id),
  };
  return transaction;
}
module.exports.getTransactions = function (account, offset, limit, take_newest) {
  var skip_while = parseInt(offset);
  var n = parseInt(limit);
  if (isNaN(skip_while) || isNaN(n)) {
    throw new Error("offset and limit must be specified in the URL query params.");
  }
  if (n < 1) { throw new Error("limit must be greater than zero."); }
  if (skip_while < 0) { throw new Error("offset must be greater or equal to zero."); }
  var account_address = parseHexString(account, ACCOUNT_ADDRESS_SIZE, "account address");
  var max = api.get_transactions_count(account_address);
  var transactions = [];
  var i;
  
  for (i = skip_while; i < (skip_while + n); i++) {
    var index = i;
    if (take_newest) {
        if (i > max) { break; }
        index = max - i - 1;
    }
    var transaction_id = api.get_transactions(account_address, index);
    if (transaction_id != "-") {
        var transaction = getTransaction(account, transaction_id);
        transactions.push(transaction);
    } else {
        break;
    }
  }
  return transactions
}
