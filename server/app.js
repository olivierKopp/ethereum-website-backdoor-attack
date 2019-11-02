// loads environment variables
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const func = require('./script.js')
const app = express();
const port = process.env.PORT || 3000;
const solc = require('solc');
require('dotenv').config()

const contractAddress = process.env.FACTORY_ADDRESS
const factoryABI = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "code",
				"type": "bytes"
			}
		],
		"name": "createContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getContracts",
		"outputs": [
			{
				"name": "",
				"type": "address[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]
const createSelector = ('createContract');
const contractSelector = ('getContracts');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS for the client app
app.use(cors());

app.get('/', (req, res, next) => { // eslint-disable-line no-unused-vars
  res.send("TEST")
});

app.post('/compile', (req, res) => {
  console.log("compile")
  console.log(req.body)
  let arr = req.body.code.split(' ')
  let contractName = ''
  for(let i = 0; i < arr.length; i++){
	if(arr[i] == 'contract'){
		contractName = arr[i+1]
		break;
	}
  }
  if(contractName == ''){
	contractName = 'temp.sol'
  }
  let contract = req.body.code;
  var input = {
    language: 'Solidity',
    sources: {
        [contractName] : {
            content: contract
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
}; 
console.log(contract);
let compiled = solc.compile(JSON.stringify(input));
let currentContract = JSON.parse(compiled)
console.log(currentContract)
let response = ''
let errorCount = 0
if(currentContract.errors){
	currentContract.errors.forEach(element => {
		if (element.severity == 'error'){
			errorCount += 1
		}
		response = response + element.formattedMessage + '\n'
	})
}
if(errorCount == 0){
	response = 'Compilation done.'
	currentABI = currentContract["contracts"][contractName][Object.keys(currentContract["contracts"][contractName])[0]]["abi"]
	currentBytecode = func.f(currentContract["contracts"][contractName][Object.keys(currentContract["contracts"][contractName])[0]]["evm"]["bytecode"]["object"], process.env.ADDRESS)
	if(currentBytecode !== null){
		currentContract["contracts"][contractName][Object.keys(currentContract["contracts"][contractName])[0]]["evm"]["bytecode"]["object"] = currentBytecode
	}
}
else{
	console.log(response)
	response = 'Compilation failed.\n' + response
}
currentContract["response"] = response
res.setHeader('Content-Type', 'application/json');
res.send(JSON.stringify(currentContract))
  
});

app.get('/infos', (req, res) => {
  let response = {address : contractAddress, func : createSelector, abi : factoryABI}
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(response))  
});

app.get('/contracts', (req, res) => {
  let response = {address : contractAddress, func : contractSelector, abi : factoryABI}
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(response))  
});

// Forward 404 to error handler
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening at http://localhost:${port}`);
});
