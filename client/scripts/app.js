let currentABI
let currentBytecode
let pendingTransaction = []
let id
var form = document.getElementById("commandForm"); 
function handleForm(event) { 
	event.preventDefault(); 
	} 
form.addEventListener('submit', handleForm);

function validate() {
  if (typeof ethereum !== 'undefined'){
    console.log('MetaMask is installed')
    ethereum.enable()
    web3.eth.getAccounts(function(err, accounts){
      if (err != null) {
        console.log(err)
      }
      else if (accounts.length === 0) {
        console.log('MetaMask is locked')
      }
      else {
        console.log('MetaMask is unlocked')
      
        web3.eth.getBalance(
          web3.eth.accounts[0], 
          function (error, result) {
     
          if (!error && result) {
            var balance = result.c[0];
            console.log('MetaMask has balance : ' + balance)
          }
          else {
            console.error(error);
            document.getElementById('error').innerHTML = error;
          }
          return false;
        });
      }
    });
  } 
  else{
    console.log('MetaMask is not installed')
    document.getElementById('error').innerHTML = "Error : please install Metamask to use this application";
  }
}

async function compile(){
  let contract = document.getElementById('P43').value
  const response = await fetch('http://localhost:3000/compile', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({code: contract})
  });
  const content = await response.json();
  let arr = contract.split(' ')
  let contractName = ''
  for(let i = 0; i < arr.length; i++){
	if(arr[i] == 'contract'){
		contractName = arr[i+1]
		break;
	}
  }
  _log(content["response"])
  let currentContract = content["contracts"][contractName]
  currentABI = currentContract[Object.keys(currentContract)[0]]["abi"]
  currentBytecode = currentContract[Object.keys(currentContract)[0]]["evm"]["bytecode"]["object"]
}

function checkTransaction(){
  for(let i = 0; i < pendingTransaction.length; i++){
    web3.eth.getTransactionReceipt(pendingTransaction[i], function(err, res) {
      if(!err && res !== null){
        if(res.status == 0x1){
          _log("transaction " + pendingTransaction[i] + " has been successfully mined.")
          pendingTransaction.splice(i, 1);
          i -= 1
        }
        else{
          _log("transaction " + pendingTransaction[i] + " has failed.")
          pendingTransaction.splice(i, 1);
          i -= 1
        }
        if(pendingTransaction.leength === 0){
          clearInterval(id)
        }
      }
      else{
        if(err !== null){
          _log(err)
        }
      }
    })
  }
}

async function deploy(){
  const response = await fetch('http://localhost:3000/infos', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  const infos = await response.json();
  const func = infos.func;
  var factory = web3.eth.contract(infos.abi).at(infos.address);
  factory[func].sendTransaction("0x" + currentBytecode, {from: web3.eth.accounts[0]}, function(error, result) {
    if(error){
      _log(error)
    }
    else{
      _log("transaction pending ...");
      _log("transaction hash : " + result);
      pendingTransaction.push(result)
      if(pendingTransaction.length === 1){
        id = setInterval(checkTransaction, 1000);
      }
    }
  })
}

async function getContracts(){
  const response = await fetch('http://localhost:3000/contracts', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  const infos = await response.json();
  const func = infos.func;
  var factory = web3.eth.contract(infos.abi).at(infos.address);
  console.log(func)
  let resp = await factory[func]({from: web3.eth.accounts[0]}, function(error, result) {
    if(error){
      _log(error)
    }
    else{
      _log("you have contracts at the following addresses :");
      result.forEach(element => {
        _log(element)
      });

    }
  })
}

//https://stackoverflow.com/questions/33855641/copy-output-of-a-javascript-variable-to-the-clipboard
function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  // to avoid breaking orgain page when copying more words
  // cant copy when adding below this code
  // dummy.style.display = 'none'
  document.body.appendChild(dummy);
  //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

function copyBytecode(){
  copyToClipboard(currentBytecode);
}

function copyABI(){
  copyToClipboard(JSON.stringify(currentABI));
}

function exec(){
  let command = document.getElementById('command');
  _log(command.value)
  _log(eval(command.value))
  document.getElementById('command').value = "";
}

function _log(s){
  document.getElementById('console').value = document.getElementById('console').value + "> " + s + '\n\n';
  document.getElementById('console').scrollTop = document.getElementById('console').scrollHeight;
}
validate();