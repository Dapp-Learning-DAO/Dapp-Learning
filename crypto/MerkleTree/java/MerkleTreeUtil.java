package com.xingkaichun.helloworldblockchain.crypto;

import com.xingkaichun.helloworldblockchain.util.ByteUtil;
import com.xingkaichun.helloworldblockchain.util.MathUtil;

import java.util.ArrayList;
import java.util.List;


/**
 * 默克尔树工具类
 *
 * @author 邢开春 409060350@qq.com
 */
public class MerkleTreeUtil {

    /**
     * 计算默克尔树根
     * Ctrl+V 于 bitcoinj-core-0.15.8.jar!\org\bitcoinj\core\Block.java MerkleRoot()
     *
     * @author 邢开春 409060350@qq.com
     */
    public static byte[] calculateMerkleTreeRoot(List<byte[]> datas) {
        List<byte[]> tree = new ArrayList<>(datas);
        int size = tree.size();
        int levelOffset = 0;
        for (int levelSize = size; levelSize > 1; levelSize = (levelSize + 1) / 2) {
            for (int left = 0; left < levelSize; left += 2) {
                int right = MathUtil.min(left + 1, levelSize - 1);
                byte[] leftBytes = tree.get(levelOffset + left);
                byte[] rightBytes = tree.get(levelOffset + right);
                tree.add(Sha256Util.doubleDigest(ByteUtil.concatenate(leftBytes, rightBytes)));
            }
            levelOffset += levelSize;
        }
        return tree.get(tree.size()-1);
    }
}