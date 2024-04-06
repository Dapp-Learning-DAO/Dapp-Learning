package org.web3j.generated.contracts;

import java.lang.Exception;
import java.lang.String;
import java.math.BigInteger;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.web3j.EVMTest;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

@EVMTest
class ERC20TokenTest {
  private static ERC20Token eRC20Token;

  @Test
  public void transferFrom() throws Exception {
    TransactionReceipt transactionReceiptVar = eRC20Token.transferFrom("REPLACE_ME", "REPLACE_ME", BigInteger.ONE).send();
    Assertions.assertTrue(transactionReceiptVar.isStatusOK());
  }

  @Test
  public void name() throws Exception {
    String stringVar = eRC20Token.name().send();
    Assertions.assertEquals("REPLACE_ME", stringVar);
  }

  @Test
  public void transfer() throws Exception {
    TransactionReceipt transactionReceiptVar = eRC20Token.transfer("REPLACE_ME", BigInteger.ONE).send();
    Assertions.assertTrue(transactionReceiptVar.isStatusOK());
  }

  @Test
  public void symbol() throws Exception {
    String stringVar = eRC20Token.symbol().send();
    Assertions.assertEquals("REPLACE_ME", stringVar);
  }

  @Test
  public void totalSupply() throws Exception {
    BigInteger bigIntegerVar = eRC20Token.totalSupply().send();
    Assertions.assertEquals(BigInteger.ONE, bigIntegerVar);
  }

  @Test
  public void getDeploymentBinary() throws Exception {
    String stringVar = eRC20Token.getDeploymentBinary().send();
    Assertions.assertEquals("REPLACE_ME", stringVar);
  }

  @BeforeAll
  static void deploy(Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) throws Exception {
    eRC20Token = ERC20Token.deploy(web3j, transactionManager, contractGasProvider, "REPLACE_ME", "REPLACE_ME", BigInteger.ONE).send();
  }

  @Test
  public void balanceOf() throws Exception {
    BigInteger bigIntegerVar = eRC20Token.balanceOf("REPLACE_ME").send();
    Assertions.assertEquals(BigInteger.ONE, bigIntegerVar);
  }

  @Test
  public void decimals() throws Exception {
    BigInteger bigIntegerVar = eRC20Token.decimals().send();
    Assertions.assertEquals(BigInteger.ONE, bigIntegerVar);
  }

  @Test
  public void allowance() throws Exception {
    BigInteger bigIntegerVar = eRC20Token.allowance("REPLACE_ME", "REPLACE_ME").send();
    Assertions.assertEquals(BigInteger.ONE, bigIntegerVar);
  }

  @Test
  public void approve() throws Exception {
    TransactionReceipt transactionReceiptVar = eRC20Token.approve("REPLACE_ME", BigInteger.ONE).send();
    Assertions.assertTrue(transactionReceiptVar.isStatusOK());
  }
}
