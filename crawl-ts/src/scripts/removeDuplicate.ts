import * as crypto from 'crypto';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface SubUrl {
  url: string;
  text: string;
  title?: string;
  visited: boolean;
  success: boolean;
  visitedAt?: Date;
  isRecruit?: boolean;
  _id?: ObjectId;
  [key: string]: any;
}

interface Domain {
  _id: ObjectId;
  domain: string;
  suburl_list: SubUrl[];
  [key: string]: any;
}

interface TextHash {
  domainId: ObjectId;
  subUrlIndex: number;
  url: string;
  hash: string;
  textLength: number;
  visitedAt?: Date;
}

interface DuplicateGroup {
  hash: string;
  count: number;
  items: TextHash[];
}

// Create a readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function removeDuplicateContent() {
  // MongoDB connection settings
  const uri = process.env.MONGODB_ADMIN_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'crwal_db';
  const collectionName = 'domains';
  const dryRun = process.argv.includes('--dry-run');
  const targetDomain = process.argv.find(arg => arg.startsWith('--domain='))?.split('=')[1] || '';

  console.log('=== MongoDB Duplicate Content Removal Tool ===');
  if (dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made to the database');
  }
  if (targetDomain) {
    console.log(`Targeting only domain: ${targetDomain}`);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db: Db = client.db(dbName);
    const collection: Collection<Domain> = db.collection(collectionName);

    // Build match criteria for the domain query
    const matchCriteria: any = {
      'suburl_list.visited': true,
      'suburl_list.success': true,
      'suburl_list.text': { $exists: true, $ne: '' }
    };

    if (targetDomain) {
      matchCriteria.domain = { $regex: new RegExp(targetDomain, 'i') };
    }

    // Find all domains with suburl_list that contain text
    console.log('Querying for domains with content...');
    const domains = await collection.find(matchCriteria).toArray();

    if (domains.length === 0) {
      console.log('No domains with content found matching criteria');
      return;
    }

    console.log(`Found ${domains.length} domains with content`);

    // Generate SHA hash for each text content across all domains
    console.log('Analyzing content and generating SHA-256 hashes...');
    const contentHashes: TextHash[] = [];

    for (const domain of domains) {
      for (let i = 0; i < domain.suburl_list.length; i++) {
        const subUrl = domain.suburl_list[i];

        // Skip items without text or that weren't successfully visited
        if (!subUrl.visited || !subUrl.success || !subUrl.text) {
          continue;
        }

        // Normalize text by trimming whitespace and converting to lowercase
        const normalizedText = subUrl.text.trim().toLowerCase();
        const hash = crypto.createHash('sha256').update(normalizedText).digest('hex');

        contentHashes.push({
          domainId: domain._id,
          subUrlIndex: i,
          url: subUrl.url,
          hash,
          textLength: normalizedText.length,
          visitedAt: subUrl.visitedAt
        });
      }
    }

    // Group by hash to find duplicates
    const hashGroups: Map<string, TextHash[]> = new Map();

    for (const item of contentHashes) {
      if (!hashGroups.has(item.hash)) {
        hashGroups.set(item.hash, []);
      }
      hashGroups.get(item.hash)?.push(item);
    }

    // Find duplicates (hash groups with more than 1 item)
    const duplicates: DuplicateGroup[] = [];
    const uniqueCount = hashGroups.size;
    let totalDuplicates = 0;

    for (const [hash, items] of hashGroups.entries()) {
      if (items.length > 1) {
        duplicates.push({
          hash,
          count: items.length,
          items: items
        });
        totalDuplicates += items.length - 1; // Count how many are duplicates (total - 1)
      }
    }

    // Sort duplicates by count (descending)
    duplicates.sort((a, b) => b.count - a.count);

    // Generate analysis report
    const totalDocuments = contentHashes.length;
    const duplicateGroups = duplicates.length;
    const duplicatePercentage = (totalDuplicates / totalDocuments) * 100;

    console.log('\n=== CONTENT DUPLICATION ANALYSIS ===');
    console.log(`Total Content Items: ${totalDocuments}`);
    console.log(`Unique Content Hashes: ${uniqueCount}`);
    console.log(`Duplicate Groups: ${duplicateGroups}`);
    console.log(`Total Duplicates: ${totalDuplicates}`);
    console.log(`Duplication Rate: ${duplicatePercentage.toFixed(2)}%`);

    if (duplicateGroups === 0) {
      console.log('No duplicates found. Nothing to remove.');
      return;
    }

    // Save detailed report to file before removal
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `duplicate-content-report-${timestamp}.json`);

    const report = {
      summary: {
        totalDocuments,
        uniqueContent: uniqueCount,
        duplicateGroups,
        totalDuplicates,
        duplicatePercentage: parseFloat(duplicatePercentage.toFixed(2))
      },
      duplicateGroups: duplicates.map(group => ({
        hash: group.hash,
        count: group.count,
        items: group.items.map(item => ({
          domainId: item.domainId.toString(),
          url: item.url,
          textLength: item.textLength,
          visitedAt: item.visitedAt
        }))
      }))
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    // Ask for confirmation before proceeding with removal
    if (!dryRun) {
      const confirmed = await promptConfirmation(`\nDo you want to proceed with removing ${totalDuplicates} duplicate content items?`);
      if (!confirmed) {
        console.log('Operation cancelled by user.');
        return;
      }
    }

    // Process each duplicate group
    console.log('\nProcessing duplicate groups...');
    let removedCount = 0;

    for (const group of duplicates) {
      // Sort items by visitedAt (newest first) to keep the most recent version
      // If visitedAt is not available, sort by textLength (longest first)
      const sortedItems = [...group.items].sort((a, b) => {
        if (a.visitedAt && b.visitedAt) {
          return b.visitedAt.getTime() - a.visitedAt.getTime();
        }
        return b.textLength - a.textLength;
      });

      // Keep the first item (most recent or longest text), remove the rest
      const keepItem = sortedItems[0];
      const removeItems = sortedItems.slice(1);

      console.log(`\nProcessing duplicate group with hash: ${group.hash.substring(0, 8)}...`);
      console.log(`Keeping: ${keepItem.url} (${keepItem.textLength} chars)`);

      // Process each item to remove
      for (const item of removeItems) {
        console.log(`Removing duplicate: ${item.url}`);

        if (!dryRun) {
          try {
            // Update the document to:
            // 1. Set text to empty string
            // 2. Set isRecruit to false
            await collection.updateOne(
              { _id: item.domainId },
              {
                $set: {
                  [`suburl_list.${item.subUrlIndex}.text`]: '',
                  [`suburl_list.${item.subUrlIndex}.isRecruit`]: false
                }
              }
            );

            // Option 2 (alternate): Remove the entire suburl entry
            // Use this if you want to completely remove the duplicates
            // Uncomment the code below and comment out the code above if you prefer this approach
            /*
            await collection.updateOne(
              { _id: item.domainId },
              { $pull: { suburl_list: { url: item.url } } }
            );
            */

            removedCount++;
          } catch (error) {
            console.error(`Error removing duplicate at ${item.url}:`, error);
          }
        }
      }
    }

    if (dryRun) {
      console.log(`\nDRY RUN COMPLETE. Would have removed ${totalDuplicates} duplicate items.`);
      console.log(`Would have set isRecruit to false for ${totalDuplicates} duplicate items.`);
    } else {
      console.log(`\nDuplicate removal complete.`);
      console.log(`- Removed text from ${removedCount} duplicate items.`);
      console.log(`- Set isRecruit to false for ${removedCount} duplicate items.`);
    }

  } catch (error) {
    console.error('Error processing duplicate content:', error);
  } finally {
    rl.close();
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the analysis and removal
removeDuplicateContent().catch(console.error);