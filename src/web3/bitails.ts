
import axios, { AxiosError } from 'axios';
import { Network } from './wallet';




export class Bitails {
    static API_PREFIX = `https://test-api.bitails.net`;
    static TX_URL_PREFIX = `https://classic-test.whatsonchain.com/tx`;
    static setNetwork(network: Network) {

        Bitails.API_PREFIX = `https://${network === Network.Testnet ? 'test-' : ''}api.bitails.net/`;
        Bitails.TX_URL_PREFIX = `${network === Network.Testnet ? 'https://classic-test.whatsonchain.com/tx' : 'https://classic.whatsonchain.com/tx'}`;
    }

    
    static async sendRawTransaction(txhex: string) {


        // 1 second per KB
        const size = Math.max(1, txhex.length / 2 / 1024); //KB
        const time = Math.max(100000, 1000 * size);
        console.log(txhex)
        try {
            const {
                data
            } = await axios({
                method: 'post',
                url: `https://test-api.bitails.net/tx/broadcast`,
                data: { raw:  txhex},
                headers: {'Content-Type': 'application/json' },
                timeout: time,
                maxBodyLength: Infinity
            });
            console.log(data)
            const payload = data
            if(payload != '') {
                return payload;
            } else if(payload === '') {
                console.error('sendTx error:', txhex)
                throw new Error(payload)
            }
        
            throw new Error('sendTx error')
        } catch (e) {

            let message = 'Unknown Error'

            if(axios.isAxiosError(e)) {
                const ae = e as AxiosError;
                message = JSON.stringify(ae.response?.data || {});
            } else if(e instanceof Error) {
                message = e.message;
            }

            throw new Error('sendRawTransaction error: ' + message)
        }
    }

    static async listUnspent(address: string): Promise<any> {
        /*
           txId: utxo.tx_hash,
          outputIndex: utxo.tx_pos,
          satoshis: utxo.value,
        */
        return axios.get(`${Bitails.API_PREFIX}/address/${address}/unspent`, {
            timeout: 30000
        }).then((resp: any)=>{
            
            let utxos = resp.data.unspent
            
            return { data: utxos.map((utxo: any)=>{
                        return {
                            tx_hash: utxo.txid,
                            tx_pos: utxo.vout,
                            value: utxo.satoshis
                        }
                    }) }
        })
        
    }

    static getTxUri(txid: string): string {
        return `${Bitails.TX_URL_PREFIX}/${txid}`;
    }
}
