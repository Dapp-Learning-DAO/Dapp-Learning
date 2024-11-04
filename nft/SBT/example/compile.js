import solc from 'solc';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('SBT.sol');
const source = fs.readFileSync(filePath, 'utf8');

// 定义导入回调函数
function findImports(importPath) {
    try {
        const resolvedPath = path.resolve('node_modules', importPath);
        const content = fs.readFileSync(resolvedPath, 'utf8');
        return { contents: content };
    } catch (e) {
        return { error: `File not found: ${importPath}` };
    }
}

// solc 编译输入格式
const input = {
    language: 'Solidity',
    sources: {
        'SBT.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode.object'],
            },
        },
    },
};

// 编译合约
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

console.log(output);

if (output.errors) {
    output.errors.forEach(err => console.error(err.formattedMessage));
} else {
    // 提取 ABI 和 Bytecode
    const abi = output.contracts['SBT.sol'].SoulboundToken.abi;
    const bytecode = output.contracts['SBT.sol'].SoulboundToken.evm.bytecode.object;

    // 保存为 JSON 文件
    fs.writeFileSync('SBTCompiled.json', JSON.stringify({ abi, bytecode }, null, 2));
    console.log('Compilation successful. ABI and Bytecode saved to SBTCompiled.json');
}
