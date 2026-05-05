const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('./AuthKey_NB2AX5NQWF.p8', 'utf8');
const teamId = 'Q32FM88Q2G';
const clientId = 'com.hugosld.pepite';
const keyId = 'NB2AX5NQWF';

const secret = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
});

console.log(secret);
