package com.xingkaichun.helloworldblockchain.crypto;

import com.xingkaichun.helloworldblockchain.util.ByteUtil;
import org.bitcoinj.core.Utils;
import org.bouncycastle.util.encoders.Hex;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertArrayEquals;

public class MerkleTreeUtilTest {

    //数据来源 https://bsv.btc.com/00000000000080b66c911bd5ba14a74260057311eaeb1982802f7010f1a9f090
    /**
     * bitcoin 采用小端模式，本项目采用java默认的大端模式。
     */
    private static final String hex1 = "bb28a1a5b3a02e7657a81c38355d56c6f05e80b9219432e3352ddcfc3cb6304c";
    private static final String hex2 = "fbde5d03b027d2b9ba4cf5d4fecab9a99864df2637b25ea4cbcb1796ff6550ca";
    private static final String hex3 = "8131ffb0a2c945ecaf9b9063e59558784f9c3a74741ce6ae2a18d0571dac15bb";
    private static final String hex4 = "d6c7cb254aa7a5fd446e8b48c307890a2d4e426da8ad2e1191cc1d8bbe0677d7";
    private static final String hex5 = "ce29e5407f5e4c9ad581c337a639f3041b24220d5aa60370d96a39335538810b";
    private static final String hex6 = "45a38677e1be28bd38b51bc1a1c0280055375cdf54472e04c590a989ead82515";
    private static final String hex7 = "c5abc61566dbb1c4bce5e1fda7b66bed22eb2130cea4b721690bc1488465abc9";
    private static final String hex8 = "a71f74ab78b564004fffedb2357fb4059ddfc629cb29ceeb449fafbf272104ca";
    private static final String hex9 = "fda204502a3345e08afd6af27377c052e77f1fefeaeb31bdd45f1e1237ca5470";
    private static final String hex10 = "d3cd1ee6655097146bdae1c177eb251de92aed9045a0959edc6b91d7d8c1f158";
    private static final String hex11 = "cb00f8a0573b18faa8c4f467b049f5d202bf1101d9ef2633bc611be70376a4b4";
    private static final String hex12 = "05d07bb2de2bda1115409f99bf6b626d23ecb6bed810d8be263352988e4548cb";

    private static final List<byte[]> hashs = new ArrayList<>(Arrays.asList(Utils.reverseBytes(Hex.decode(hex1)),Utils.reverseBytes(Hex.decode(hex2)),Utils.reverseBytes(Hex.decode(hex3)),Utils.reverseBytes(Hex.decode(hex4)),Utils.reverseBytes(Hex.decode(hex5))
            ,Utils.reverseBytes(Hex.decode(hex6)),Utils.reverseBytes(Hex.decode(hex7)),Utils.reverseBytes(Hex.decode(hex8)),Utils.reverseBytes(Hex.decode(hex9)),Utils.reverseBytes(Hex.decode(hex10))
            ,Utils.reverseBytes(Hex.decode(hex11)),Utils.reverseBytes(Hex.decode(hex12))));

    private static final String merkleTreeRoot = "7fe79307aeb300d910d9c4bec5bacb4c7e114c7dfd6789e19f3a733debb3bb6a";


    
    @Test
    public void calculateMerkleRootByHashTest()
    {
        byte[] merkleRoot = MerkleTreeUtil.calculateMerkleTreeRoot(hashs);
        assertArrayEquals(Utils.reverseBytes(ByteUtil.hexStringToBytes(merkleTreeRoot)),merkleRoot);
    }
}
