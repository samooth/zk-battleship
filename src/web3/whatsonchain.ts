import axios from 'axios';

export enum NetWork {
    Testnet = 'testnet',
    Regtest = 'regtest',
    Mainnet = 'mainnet',
    STN = 'STN'
}
export class Whatsonchain {
    static API_PREFIX = ``;
    static TX_URL_PREFIX = ``;
    static setNetwork(network: NetWork) {

        Whatsonchain.API_PREFIX = `https://api.whatsonchain.com/v1/bsv/${network === NetWork.Testnet ? 'test' : 'main'}`;
        Whatsonchain.TX_URL_PREFIX = `${network === NetWork.Testnet ? 'https://test.whatsonchain.com/tx' : 'https://whatsonchain.com/tx'}`;
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
                url: 'https://api.taal.com/api/v1/broadcast',
                data: Buffer.from(rawTx, 'hex'),
                headers: {
                    'Authorization': '',
                    'Content-Type': 'application/octet-stream'
                },
                timeout: time,
                maxBodyLength: Infinity
            });
    
            return txid;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } 

            throw new Error('sendRawTransaction error: ' + error.message)
        }
    }

    static async listUnspent(address: string): Promise<any> {
        return axios.get(`${Whatsonchain.API_PREFIX}/address/${address}/unspent`, {
            timeout: 10000
        });
    }

    static getTxUri(txid: string): string {
        return `${Whatsonchain.TX_URL_PREFIX}/${txid}`;
    }
}
