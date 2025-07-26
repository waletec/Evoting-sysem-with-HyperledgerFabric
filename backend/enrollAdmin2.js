// enrollAdmin2.js
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function main() {
  try {
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false });

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin2');
    if (identity) {
      console.log('✅ admin2 identity already exists in the wallet');
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: 'admin2',
      enrollmentSecret: 'admin2pw'
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('admin2', x509Identity);
    console.log('✅ Successfully enrolled admin2 and imported into the wallet');

  } catch (error) {
    console.error(`❌ Failed to enroll admin2: ${error}`);
    process.exit(1);
  }
}

main();
