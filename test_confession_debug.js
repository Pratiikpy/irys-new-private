const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function testConfessionFlow() {
    console.log('🔍 Testing confession flow...\n');

    try {
        // 1. Check if backend is running
        console.log('1. Checking backend health...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        if (!healthResponse.ok) {
            throw new Error('Backend is not running');
        }
        console.log('✅ Backend is running\n');

        // 2. Check debug endpoint to see current database state
        console.log('2. Checking current database state...');
        const debugResponse = await fetch(`${API_BASE}/debug/confessions`);
        if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('📊 Database state:', debugData);
        } else {
            console.log('❌ Could not get debug data');
        }
        console.log('');

        // 3. Try to post a test confession
        console.log('3. Posting test confession...');
        const testConfession = {
            content: `Test confession at ${new Date().toISOString()}`,
            is_public: true,
            author: 'anonymous',
            tags: ['test', 'debug']
        };

        const postResponse = await fetch(`${API_BASE}/confessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testConfession)
        });

        if (postResponse.ok) {
            const postResult = await postResponse.json();
            console.log('✅ Confession posted successfully:', postResult);
            
            // 4. Wait a moment and try to fetch confessions
            console.log('\n4. Waiting 2 seconds and fetching confessions...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const fetchResponse = await fetch(`${API_BASE}/confessions/public`);
            if (fetchResponse.ok) {
                const fetchResult = await fetchResponse.json();
                console.log('📝 Fetched confessions:', fetchResult);
                
                // Check if our test confession is in the results
                const found = fetchResult.confessions.find(c => 
                    c.content === testConfession.content
                );
                
                if (found) {
                    console.log('✅ Test confession found in results!');
                } else {
                    console.log('❌ Test confession NOT found in results');
                    console.log('Available confessions:', fetchResult.confessions.map(c => ({
                        id: c.id,
                        content: c.content.substring(0, 50) + '...',
                        is_public: c.is_public,
                        moderation: c.moderation
                    })));
                }
            } else {
                console.log('❌ Failed to fetch confessions:', await fetchResponse.text());
            }
        } else {
            const errorText = await postResponse.text();
            console.log('❌ Failed to post confession:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testConfessionFlow(); 