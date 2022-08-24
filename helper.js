const { existsSync, readFileSync } = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const { compileContract: compileContractImpl, bsv } = require('scryptlib');

const inputIndex = 0
const inputSatoshis = 100000
const dummyTxId = randomBytes(32).toString('hex');
const reversedDummyTxId = Buffer.from(dummyTxId, 'hex').reverse().toString('hex');
const axios = require('axios')
const API_PREFIX = 'https://api.whatsonchain.com/v1/bsv/test'

function compileContract(fileName, options) {
    const filePath = path.join(__dirname, 'contracts', fileName)
    const out = path.join(__dirname, 'out')

    const result = compileContractImpl(filePath, options ? options : {
        out: out
    });
    if (result.errors.length > 0) {
        console.log(`Compile contract ${filePath} failed: `, result.errors)
        throw result.errors;
    }

    return result;
}

function loadDesc(fileName) {
    let filePath = '';
    if (!fileName.endsWith(".json")) {
        filePath = path.join(__dirname, `out/${fileName}_desc.json`);
        if (!existsSync(filePath)) {
            filePath = path.join(__dirname, `out/${fileName}_debug_desc.json`);
        }
    } else {
        filePath = path.join(__dirname, `out/${fileName}`);
    }

    if (!existsSync(filePath)) {
        throw new Error(`Description file ${filePath} not exist!\nIf You already run 'npm run watch', maybe fix the compile error first!`)
    }
    return JSON.parse(readFileSync(filePath).toString());
}

function newTx() {
    const utxo = {
        txId: dummyTxId,
        outputIndex: 0,
        script: '',   // placeholder
        satoshis: inputSatoshis
    };
    return new bsv.Transaction().from(utxo);
}



async function sendTx(tx) {
    const hex = tx.toString();

    // if (!tx.checkFeeRate(50)) {
    //     throw new Error(`checkFeeRate fail, transaction fee is too low`)
    // }

    try {

        const size = Math.max(1, hex.length / 2 / 1024); //KB
        const time = Math.max(10000, 1000 * size);

        const {
            data: txid
        } = await axios({
            method: 'post',
            url: `${API_PREFIX}/tx/raw`,
            data:  {
                txhex: hex
            },
            timeout: time,
            maxBodyLength: Infinity
        });

        return txid;
        
    } catch (error) {

        throw error
    }

}

async function fetchUtxos(address) {
    // step 1: fetch utxos
    let {
        data: utxos
    } = await axios.get(`${API_PREFIX}/address/${address}/unspent`)

    return utxos.map((utxo) => ({
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        satoshis: utxo.value,
        script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
    }))
}

async function deployContract(contract, amount) {
    const { privateKey } = require('./privateKey');
    const address = privateKey.toAddress()
    const tx = new bsv.Transaction()

    tx.from(await fetchUtxos(address))
        .addOutput(new bsv.Transaction.Output({
            script: contract.lockingScript,
            satoshis: amount,
        }))
        .change(address)
        .sign(privateKey)

    await sendTx(tx)
    return tx
}

//create an input spending from prevTx's output, with empty script
function createInputFromPrevTx(tx, outputIndex) {
    const outputIdx = outputIndex || 0
    return new bsv.Transaction.Input({
      prevTxId: tx.id,
      outputIndex: outputIdx,
      script: new bsv.Script(), // placeholder
      output: tx.outputs[outputIdx]
    })
  }

  
module.exports = {
    compileContract,
    loadDesc,
    newTx,
    inputSatoshis,
    deployContract,
    fetchUtxos,
    sendTx,
    createInputFromPrevTx
}

