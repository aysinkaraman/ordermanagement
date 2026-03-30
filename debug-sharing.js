#!/usr/bin/env node

/**
 * Debug script to test board sharing
 * Usage: node debug-sharing.js <BOARD_ID> <TOKEN> <EMAIL_TO_SHARE>
 */

const fetch = require('node-fetch');

const args = process.argv.slice(2);
const boardId = args[0];
const token = args[1];
const emailToShare = args[2];

if (!boardId || !token || !emailToShare) {
  console.error('Usage: node debug-sharing.js <BOARD_ID> <TOKEN> <EMAIL_TO_SHARE>');
  console.error('Example: node debug-sharing.js cljx... xyz... user@example.com');
  process.exit(1);
}

const baseUrl = 'http://localhost:3000';

async function testBoarding() {
  try {
    console.log('\n📋 Testing Board Sharing...\n');
    console.log(`Board ID: ${boardId}`);
    console.log(`Sharing with: ${emailToShare}\n`);

    // Test 1: Get current members
    console.log('1️⃣  Fetching current board members...');
    const getMembersRes = await fetch(`${baseUrl}/api/boards/${boardId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const members = await getMembersRes.json();
    console.log(`✅ Current members: ${members.length}`);
    members.forEach(m => {
      console.log(`   - ${m.user?.name} (${m.user?.email}) [${m.role}]`);
    });

    // Test 2: Add new member
    console.log(`\n2️⃣  Attempting to share board with ${emailToShare}...`);
    const shareRes = await fetch(`${baseUrl}/api/boards/${boardId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: emailToShare,
        role: 'member'
      })
    });
    const shareData = await shareRes.json();
    
    if (!shareRes.ok) {
      console.error(`❌ Error: ${shareData.error}`);
      console.error(`Status: ${shareRes.status}`);
      return;
    }

    if (shareData.needsInvite) {
      console.log(`✅ Invitation created!`);
      console.log(`   Invite Link: ${shareData.inviteLink}`);
    } else {
      console.log(`✅ Member added successfully!`);
    }

    // Test 3: Verify member was added
    console.log(`\n3️⃣  Verifying member was added...`);
    const verifyRes = await fetch(`${baseUrl}/api/boards/${boardId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const updatedMembers = await verifyRes.json();
    console.log(`✅ Members after adding: ${updatedMembers.length}`);
    updatedMembers.forEach(m => {
      console.log(`   - ${m.user?.name} (${m.user?.email}) [${m.role}]`);
    });

    const newMember = updatedMembers.find(m => m.user?.email === emailToShare);
    if (newMember) {
      console.log(`\n✅ SUCCESS: ${emailToShare} is now a board member!`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBoarding();
