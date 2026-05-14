
const { sm2 } = require('./node_modules/sm-crypto');

// Demo data from reference website
const plaintext = 'abcdefghijklmnopqrstuvwxyzABCDEF';
const publicKey = '047b0b66402e7da4d90720a17d268e8ab7cc0e206a3d46dc90f89c0339682cf0a6eeeff4f8401e6e77c5cbedcd64965887d2d8c04c84d60ab7a50ddd7c6a3a21e8';

// We need a private key to test decrypt - let's generate a keypair first
const keypair = sm2.generateKeyPairHex();
console.log('=== Generated Keypair ===');
console.log('Public Key:', keypair.publicKey);
console.log('Private Key:', keypair.privateKey);

// Encrypt with mode 1 (C1C3C2) - our default
const encrypted1 = sm2.doEncrypt(plaintext, publicKey, 1);
console.log('\n=== Encrypt with C1C3C2 (mode=1) ===');
console.log('Result:', encrypted1);
console.log('Length:', encrypted1.length);

// Encrypt with mode 0 (C1C2C3)
const encrypted0 = sm2.doEncrypt(plaintext, publicKey, 0);
console.log('\n=== Encrypt with C1C2C3 (mode=0) ===');
console.log('Result:', encrypted0);
console.log('Length:', encrypted0.length);

// Test with our own keypair
const enc2 = sm2.doEncrypt(plaintext, keypair.publicKey, 1);
const dec2 = sm2.doDecrypt(enc2, keypair.privateKey, 1);
console.log('\n=== Self test (C1C3C2) ===');
console.log('Encrypted:', enc2);
console.log('Decrypted:', dec2);
console.log('Match:', dec2 === plaintext);

// Check c1 format
console.log('\n=== C1 Analysis ===');
console.log('C1 (first 128 chars):', enc2.substring(0, 128));
console.log('C1 starts with 04?', enc2.substring(0, 2) === '04' ? 'Yes (has prefix)' : 'No (no prefix)');

// Encrypt same data twice to show randomness
const enc3 = sm2.doEncrypt(plaintext, publicKey, 1);
console.log('\n=== Randomness check ===');
console.log('Same input, different output?', encrypted1 !== enc3);
