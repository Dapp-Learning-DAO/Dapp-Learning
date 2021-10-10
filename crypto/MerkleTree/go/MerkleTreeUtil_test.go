package MerkleTreeUtil

/*
 @author king 409060350@qq.com
*/

import (
	"helloworld-blockchain-go/util/ByteUtil"
	"testing"
)

func TestCalculateMerkleTreeRoot(t *testing.T) {
	var sli [][]byte
	sli = append(sli, ByteUtil.HexStringToBytes("4c30b63cfcdc2d35e3329421b9805ef0c6565d35381ca857762ea0b3a5a128bb"))
	sli = append(sli, ByteUtil.HexStringToBytes("ca5065ff9617cbcba45eb23726df6498a9b9cafed4f54cbab9d227b0035ddefb"))
	sli = append(sli, ByteUtil.HexStringToBytes("bb15ac1d57d0182aaee61c74743a9c4f785895e563909bafec45c9a2b0ff3181"))
	sli = append(sli, ByteUtil.HexStringToBytes("d77706be8b1dcc91112eada86d424e2d0a8907c3488b6e44fda5a74a25cbc7d6"))
	sli = append(sli, ByteUtil.HexStringToBytes("0b81385533396ad97003a65a0d22241b04f339a637c381d59a4c5e7f40e529ce"))

	sli = append(sli, ByteUtil.HexStringToBytes("1525d8ea89a990c5042e4754df5c37550028c0a1c11bb538bd28bee17786a345"))
	sli = append(sli, ByteUtil.HexStringToBytes("c9ab658448c10b6921b7a4ce3021eb22ed6bb6a7fde1e5bcc4b1db6615c6abc5"))
	sli = append(sli, ByteUtil.HexStringToBytes("ca042127bfaf9f44ebce29cb29c6df9d05b47f35b2edff4f0064b578ab741fa7"))
	sli = append(sli, ByteUtil.HexStringToBytes("7054ca37121e5fd4bd31ebeaef1f7fe752c07773f26afd8ae045332a5004a2fd"))
	sli = append(sli, ByteUtil.HexStringToBytes("58f1c1d8d7916bdc9e95a04590ed2ae91d25eb77c1e1da6b14975065e61ecdd3"))

	sli = append(sli, ByteUtil.HexStringToBytes("b4a47603e71b61bc3326efd90111bf02d2f549b067f4c4a8fa183b57a0f800cb"))
	sli = append(sli, ByteUtil.HexStringToBytes("cb48458e98523326bed810d8beb6ec236d626bbf999f401511da2bdeb27bd005"))

	merkleTreeRoot := ByteUtil.BytesToHexString(CalculateMerkleTreeRoot(sli))
	if "6abbb3eb3d733a9fe18967fd7d4c117e4ccbbac5bec4d910d900b3ae0793e77f" == merkleTreeRoot {
		t.Log("test pass")
	} else {
		t.Error("test failed")
	}
}
