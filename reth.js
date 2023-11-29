



const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://eth.meowrpc.com');
const account = '0x2e4570a077Ee5e2a8D7224555Da1A4df301811c3';
const privateKey = 'b45a74bec603f2e5bc3901110df4e9b21c863673607c4a1e0f63ec38f315c406';
const wallet = new ethers.Wallet(privateKey, provider);
const currentChallenge = ethers.utils.formatBytes32String('rETH'); 
const maxMintTimes=40;  //最大mint次数
let nonce;
let gasTop=35014126189;   //gas上限，超过暂停等待


const find_solution = async () => {
    const currentChallenge = ethers.utils.formatBytes32String('rETH');
    const start_time = Date.now();
    const findAsync = () => {
        return new Promise((resolve, reject) => {
            const random_value = ethers.utils.randomBytes(32);
            const potential_solution = ethers.utils.hexlify(random_value);

            const hashed_solution = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [potential_solution, currentChallenge])
            );

            // console.log(hashed_solution);

            if (hashed_solution.startsWith('0x7777')) {
                const end_time = Date.now();
                console.log(`use time: ${(end_time - start_time) / 1000} s`);
                resolve(potential_solution);
            } else {
                setTimeout(() => findAsync().then(resolve, reject), 0);
            }
        });
    };

    return findAsync();
};

async function mine_rETH(nums) {
    try{
        const solution = await find_solution();
        const jsonData = {
            "p": "rerc-20",
            "op": "mint",
            "tick": "rETH",
            "id": solution,
            'amt': "10000"
        }

        const dataHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('data:application/json,' + JSON.stringify(jsonData)));

        let gasPrice = await provider.getGasPrice();

        while(gasPrice.toNumber()>=gasTop)
        {
            // console.log("当前gas为：",gasPrice.toNumber(),"请稍后再试")
            gasPrice = await provider.getGasPrice();
        }

        const tx = {
            from: account,
            to: account, // Self-transfer
            nonce: nonce,
            gasPrice: gasPrice,
            data: dataHex,
            chainId: 1, 
        };

        // 估算 gasLimit
        const estimateGas = await provider.estimateGas(tx);
        tx.gasLimit = estimateGas;

        const signedTx = await wallet.signTransaction(tx);
        const receipt = await provider.sendTransaction(signedTx);
        nonce++;
        console.log(`第${nums}次mint成功，hash为：${receipt["hash"]}`);        
    }catch(error)
    {
        console.log(`第${nums}次mint失败，${error.message}`)
    }

}
const main=async ()=>{
    try{
        nonce = await provider.getTransactionCount(account);
    }catch(error)
    {
        console.log("init error")
    }

    for(var i=1;i<=maxMintTimes;i++) await mine_rETH(i);
}
main()















