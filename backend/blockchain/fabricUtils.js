
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');

const ccpPath = process.env.FABRIC_CCP
  ? path.resolve(process.env.FABRIC_CCP)
  : path.resolve(__dirname, '..', 'connection.json'); // Your network config
const walletPath = process.env.FABRIC_WALLET
  ? path.resolve(process.env.FABRIC_WALLET)
  : path.join(__dirname, '..', 'wallet');

// Connection cache to reuse connections
let cachedNetwork = null;
let lastConnectionTime = 0;
const CONNECTION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function connectToNetwork() {
  try {
    // Check if we have a cached connection that's still valid
    const now = Date.now();
    if (cachedNetwork && (now - lastConnectionTime) < CONNECTION_CACHE_DURATION) {
      console.log('🔄 Using cached blockchain connection');
      return cachedNetwork;
    }

    console.log('🔄 Creating new blockchain connection...');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
      throw new Error('Admin identity not found in wallet');
    }

    const gateway = new Gateway();
    const identityLabel = process.env.FABRIC_IDENTITY || 'admin';
    const discoveryEnabled = (process.env.FABRIC_DISCOVERY_ENABLED || 'true').toLowerCase() === 'true';
    const asLocalhost = (process.env.FABRIC_AS_LOCALHOST || 'false').toLowerCase() === 'true';

    await gateway.connect(ccp, {
      wallet,
      identity: identityLabel,
      discovery: { enabled: discoveryEnabled, asLocalhost }
    });

    const channelName = process.env.FABRIC_CHANNEL || 'mychannel';
    const network = await gateway.getNetwork(channelName);
    
    // Cache the connection
    cachedNetwork = network;
    lastConnectionTime = now;
    
    console.log('✅ Blockchain connection established and cached');
    return network;
  } catch (error) {
    console.error('⚠️ Error connecting to Fabric network:', error);
    // Clear cache on error
    cachedNetwork = null;
    lastConnectionTime = 0;
    throw error;
  }
}

// Function to clear connection cache (useful for testing or when network changes)
function clearConnectionCache() {
  cachedNetwork = null;
  lastConnectionTime = 0;
  console.log('🗑️ Blockchain connection cache cleared');
}

module.exports = {
  connectToNetwork,
  clearConnectionCache
};
