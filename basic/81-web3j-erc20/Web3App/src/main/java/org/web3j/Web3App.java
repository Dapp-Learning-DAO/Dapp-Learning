package org.web3j;

import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

import org.web3j.generated.contracts.ERC20Token;

public class Web3App {

    // ERC20 token deployment parameters
    private static final String NAME = "byd";
    private static final String SYMBOL = "byd";
    private static final BigInteger INITIAL_SUPPLY = new BigInteger("1000000000");
    private static final String nodeUrl = System.getenv().getOrDefault("WEB3J_NODE_URL", "<node_url>");
    private static final String pk1 = System.getenv().getOrDefault("PK_ACCT1", "<private_key>");


    public static void main(String[] args) throws Exception {
        System.out.println("nodeUrl is: " + nodeUrl);
        System.out.println("private key is: [" + pk1 +"]");
        Credentials credentials = Credentials.create(pk1);
        Web3j web3j = Web3j.build(new HttpService(nodeUrl));
        System.out.println("Deploying ERC20 contract ...");
        ERC20Token erc20Token = ERC20Token.deploy(web3j, credentials, new DefaultGasProvider(), NAME, SYMBOL, INITIAL_SUPPLY).send();
        System.out.println("Contract address: " + erc20Token.getContractAddress());
    }
}
