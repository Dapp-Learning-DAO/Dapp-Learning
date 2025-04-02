# Bitcoin Taproot Example

A demonstration project showcasing Bitcoin Taproot technology implementation, including address creation, transaction handling, and Schnorr signatures.

## Features

- Taproot address generation
- Schnorr signature implementation
- Transaction creation and signing
- OP_RETURN output support
- Debug information output

## Tech Stack

- bitcoinjs-lib: Bitcoin transaction handling library
- ecpair: Key pair management
- @bitcoinerlab/secp256k1: Elliptic curve cryptography

## Installation

```bash
npm install bitcoinjs-lib ecpair @bitcoinerlab/secp256k1
```

## Usage

1. Create a Taproot address:
```javascript
const taprootData = createTaprootAddress();
console.log('Taproot Address:', taprootData.address);
```

2. Create a transaction:
```javascript
const tx = await createTaprootTransaction(taprootData, recipientAddress, amount);
```

## Core Components

### SchnorrSigner Class
Handles Schnorr signatures required for Taproot transactions:
- Key pair management
- x-only public key conversion
- Schnorr signature generation

### Utility Functions
- `toXOnly`: Converts full public key to x-only format
- `createTaprootAddress`: Generates Taproot address
- `addOpReturnOutput`: Adds OP_RETURN output
- `createTaprootTransaction`: Creates and signs transactions

## Important Notes

- Currently configured for testnet
- Uses fixed transaction fee (1000 satoshis)
- Example UTXO is placeholder (replace with real UTXO in production)

## Debug Features

The project includes comprehensive debug output:
- Address information
- Public key details
- Transaction details
- Signature information

## Example Output

When running the program, you'll see:
- Taproot address
- Public key (hex format)
- Output script
- Network information
- Transaction details
- Witness data

## Development Environment

- Node.js
- npm/yarn
- Bitcoin Testnet (for testing)

## Security Considerations

- This is a demonstration project, not recommended for mainnet use
- Ensure proper private key handling in production
- Implement appropriate error handling for production use

## API Reference

### createTaprootAddress()
Returns an object containing:
- signer: SchnorrSigner instance
- address: Taproot address
- output: Output script

### createTaprootTransaction(taprootData, recipient, satoshis, message)
Parameters:
- taprootData: Object containing signer and output information
- recipient: Recipient's address
- satoshis: Amount to send
- message: Optional OP_RETURN message (default provided)

Returns: Signed transaction in hex format

## References

- [Bitcoin Taproot Documentation](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)
- [bitcoinjs-lib Documentation](https://github.com/bitcoinjs/bitcoinjs-lib)

## Contributing

Feel free to submit issues and enhancement requests.

## License

MIT License
```

This README.md provides:
1. Project overview and key features
2. Installation and usage instructions
3. Detailed component descriptions
4. Development considerations
5. Debug information
6. Security notes
7. API documentation
8. Relevant references

You can customize this content based on your specific needs.
