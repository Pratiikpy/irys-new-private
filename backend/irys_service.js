#!/usr/bin/env node

const { Uploader } = require("@irys/upload");
const { Ethereum } = require("@irys/upload-ethereum");
require('dotenv').config();

class IrysService {
    constructor() {
        this.irys = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            const privateKey = process.env.IRYS_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('IRYS_PRIVATE_KEY not found in environment');
            }

            console.log('🔄 Initializing Irys with devnet...');
            
            // Initialize Irys with devnet (free uploads)
            this.irys = await Uploader(Ethereum)
                .withWallet(privateKey)
                .withRpc("https://rpc.ankr.com/eth_sepolia")
                .devnet();

            // Wait for initialization to complete
            await this.irys.ready();
            
            console.log('✅ Irys initialized successfully');
            this.initialized = true;
            return { success: true, message: 'Irys service initialized' };
        } catch (error) {
            console.error('❌ Failed to initialize Irys:', error.message);
            return { success: false, error: error.message };
        }
    }

    async upload(data, tags = []) {
        try {
            if (!this.initialized) {
                const initResult = await this.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            // Prepare tags
            const defaultTags = [
                { name: "App", value: "ZK-Confession" },
                { name: "Content-Type", value: "application/json" },
                { name: "Timestamp", value: Date.now().toString() },
            ];

            const allTags = [...defaultTags, ...tags];

            console.log('🔄 Uploading data to Irys...');
            
            // Upload to Irys using the upload method
            const receipt = await this.irys.upload(JSON.stringify(data), { tags: allTags });

            console.log(`✅ Upload successful: ${receipt.id}`);

            return {
                success: true,
                tx_id: receipt.id,
                gateway_url: `https://gateway.irys.xyz/${receipt.id}`,
                explorer_url: `https://devnet.irys.xyz/tx/${receipt.id}`,
                timestamp: receipt.timestamp,
                verified: true
            };
        } catch (error) {
            console.error('❌ Upload failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getBalance() {
        try {
            if (!this.initialized) {
                const initResult = await this.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            const balance = await this.irys.getBalance();
            return {
                success: true,
                balance: balance.toString()
            };
        } catch (error) {
            console.error('❌ Error getting balance:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAddress() {
        try {
            if (!this.initialized) {
                const initResult = await this.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.error);
                }
            }

            console.log('🔍 Getting address from Irys instance...');
            console.log('Irys object:', this.irys ? 'exists' : 'null');
            
            if (!this.irys) {
                throw new Error('Irys instance is null after initialization');
            }

            const address = this.irys.address;
            console.log('✅ Address retrieved:', address);
            
            return {
                success: true,
                address: address
            };
        } catch (error) {
            console.error('❌ Error getting address:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Main execution
async function main() {
    const service = new IrysService();
    
    process.stdin.setEncoding('utf8');
    
    let inputData = '';
    process.stdin.on('data', (chunk) => {
        inputData += chunk;
    });

    process.stdin.on('end', async () => {
        try {
            if (!inputData.trim()) {
                console.log(JSON.stringify({
                    success: false,
                    error: 'No input data received'
                }));
                return;
            }

            const request = JSON.parse(inputData);
            let response;

            switch (request.action) {
                case 'upload':
                    response = await service.upload(request.data, request.tags || []);
                    break;
                case 'balance':
                    response = await service.getBalance();
                    break;
                case 'address':
                    response = await service.getAddress();
                    break;
                default:
                    response = { success: false, error: 'Unknown action' };
            }

            console.log(JSON.stringify(response));
        } catch (error) {
            console.log(JSON.stringify({
                success: false,
                error: error.message || 'Unknown error occurred'
            }));
        }
    });
}

if (require.main === module) {
    main();
}

module.exports = IrysService;