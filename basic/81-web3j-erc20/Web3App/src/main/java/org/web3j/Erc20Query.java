package org.web3j;

import org.web3j.crypto.Credentials;
import org.web3j.generated.contracts.ERC20Token;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

public class Erc20Query {

    private static final String nodeUrl = System.getenv().getOrDefault("WEB3J_NODE_URL", "<node_url>");
    private static final String pk1 = System.getenv().getOrDefault("PK_ACCT1", "<private_key>");

    private static final String erc20Addr = System.getenv().getOrDefault("ERC20_ADDR", "0x70cbbb4f4f51a392a68aaffc3aae4fda6eb89081");


    public static void main(String[] args) throws Exception {
        Web3j web3j = Web3j.build(new HttpService(nodeUrl));
        Credentials credentials = Credentials.create(pk1);
        ERC20Token eRC20Token= ERC20Token.load(erc20Addr, web3j, credentials, new DefaultGasProvider());
        if (eRC20Token.isValid()) {
            String name = eRC20Token.name().send();
            System.out.println("token name is " + name);
            String symbol = eRC20Token.symbol().send();
            System.out.println("token symbol is " + symbol);
            BigInteger totalSupply = eRC20Token.totalSupply().send();
            System.out.println("total supply is " + totalSupply);
        }
        web3j.shutdown();
    }
}
