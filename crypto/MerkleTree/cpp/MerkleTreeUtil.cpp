//
// Created by XINGKAICHUN on 2021/9/14.
//

#include "MerkleTreeUtil.h"
#include "Sha256Util.h"
#include "../util/ByteUtil.h"
#include "../util/MathUtil.h"


namespace MerkleTreeUtil{

    vector<unsigned char> calculateMerkleTreeRoot(vector<vector<unsigned char>> datas){
        vector<vector<unsigned char>> tree(datas);
        int size = tree.size();
        int levelOffset = 0;
        for (int levelSize = size; levelSize > 1; levelSize = (levelSize + 1) / 2) {
            for (int left = 0; left < levelSize; left += 2) {
                int right = MathUtil::min(left + 1, levelSize - 1);
                vector<unsigned char> leftBytes = tree[levelOffset + left];
                vector<unsigned char> rightBytes = tree[levelOffset + right];
                tree.push_back(Sha256Util::doubleDigest(ByteUtil::concatenate(leftBytes, rightBytes)));
            }
            levelOffset += levelSize;
        }
        return tree[tree.size()-1];
    }
}
