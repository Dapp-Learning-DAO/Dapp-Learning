//
// Created by XINGKAICHUN on 2021/9/14.
//

#ifndef HELLOWORLD_BLOCKCHAIN_CPP_MERKLETREEUTIL_H
#define HELLOWORLD_BLOCKCHAIN_CPP_MERKLETREEUTIL_H
#include <string>
#include <vector>
using namespace std;


namespace MerkleTreeUtil {

    vector<unsigned char> calculateMerkleTreeRoot(vector<vector<unsigned char>> datas);
};


#endif //HELLOWORLD_BLOCKCHAIN_CPP_MERKLETREEUTIL_H
