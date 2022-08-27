
import axios, { AxiosError } from 'axios';
import { NetWork } from './wallet';




export class Gorillapool {
    static API_PREFIX = ``;
    static TX_URL_PREFIX = ``;
    static setNetwork(network: NetWork) {

        Gorillapool.API_PREFIX = `https://api.whatsonchain.com/v1/bsv/${network === NetWork.Testnet ? 'test' : 'main'}`;
        Gorillapool.TX_URL_PREFIX = `${network === NetWork.Testnet ? 'https://classic-test.whatsonchain.com/tx' : 'https://classic.whatsonchain.com/tx'}`;
    }

    
    static async sendRawTransaction(rawTx: string) {


        // 1 second per KB
        const size = Math.max(1, rawTx.length / 2 / 1024); //KB
        const time = Math.max(100000, 1000 * size);

        try {
            const {
                data: txid
            } = await axios({
                method: 'post',
                url: 'https://testnet.merchantapi.gorillapool.io/mapi/tx',
                data: Buffer.from(rawTx, 'hex'),
                headers: {
                    'Accept': 'text/plain',
                    'Content-Type': 'application/octet-stream'
                },
                timeout: time,
                maxBodyLength: Infinity
            });
    
            return txid;
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
        return axios.get(`${Gorillapool.API_PREFIX}/address/${address}/unspent`, {
            timeout: 30000
        });
    }

    static getTxUri(txid: string): string {
        return `${Gorillapool.TX_URL_PREFIX}/${txid}`;
    }
}
