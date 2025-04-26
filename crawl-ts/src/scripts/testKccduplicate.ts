import * as crypto from 'crypto';
import { MongoClient, Db, Collection } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

interface IRawContent {
  url: string;
  text: string;
  title?: string;
  domain: string;
  visitedAt?: Date;
  [key: string]: any;
}

interface TextHash {
  url: string;
  hash: string;
  textLength: number;
  title?: string;
  visitedAt?: Date;
}

interface DuplicateGroup {
  hash: string;
  count: number;
  urls: string[];
  textLength: number;
}

async function analyzeDuplicateContent() {
  // MongoDB connection settings
  const uri = process.env.MONGODB_ADMIN_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'crwal_db';
  const collectionName = 'domains'; // Change this if your collection name is different

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db: Db = client.db(dbName);
    const collection: Collection = db.collection(collectionName);

    // Aggregate to find all suburl_list items with domain containing 'kcc'
    console.log('Querying for KCC domain content...');
    const pipeline = [
      {
        $match: {
          domain: { $regex: /kcc/i } // Case insensitive matching for 'kcc'
        }
      },
      { $unwind: '$suburl_list' },
      {
        $match: {
          'suburl_list.visited': true,
          'suburl_list.success': true,
          'suburl_list.text': { $exists: true, $ne: '' }
        }
      },
      {
        $project: {
          _id: 0,
          domain: 1,
          url: '$suburl_list.url',
          text: '$suburl_list.text',
          title: '$suburl_list.title',
          visitedAt: '$suburl_list.visitedAt'
        }
      }
    ];

    const rawContents = await collection.aggregate(pipeline).toArray() as IRawContent[];
    console.log(`Found ${rawContents.length} documents with KCC domain`);

    if (rawContents.length === 0) {
      console.log('No content found for KCC domain');
      return;
    }

    // Generate SHA hash for each text content
    console.log('Generating SHA-256 hashes for text content...');
    const contentHashes: TextHash[] = rawContents.map(content => {
      // Normalize text by trimming whitespace and converting to lowercase
      const normalizedText = content.text.trim().toLowerCase();
      const hash = crypto.createHash('sha256').update(normalizedText).digest('hex');

      return {
        url: content.url,
        hash,
        textLength: normalizedText.length,
        title: content.title,
        visitedAt: content.visitedAt
      };
    });

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
          urls: items.map(item => item.url),
          textLength: items[0].textLength
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
    console.log(`Total Documents: ${totalDocuments}`);
    console.log(`Unique Content Hashes: ${uniqueCount}`);
    console.log(`Duplicate Groups: ${duplicateGroups}`);
    console.log(`Total Duplicates: ${totalDuplicates}`);
    console.log(`Duplication Rate: ${duplicatePercentage.toFixed(2)}%`);

    if (duplicates.length > 0) {
      console.log('\nTop 10 Duplicated Content Groups:');
      duplicates.slice(0, 10).forEach((group, index) => {
        console.log(`\n#${index + 1}: ${group.count} duplicates (Content Length: ${group.textLength} characters)`);
        console.log(`Hash: ${group.hash}`);
        console.log('URLs:');
        group.urls.slice(0, 5).forEach(url => console.log(`  - ${url}`));
        if (group.urls.length > 5) {
          console.log(`  ... and ${group.urls.length - 5} more`);
        }
      });
    }

    // Save detailed report to file
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `kcc-content-duplication-${timestamp}.json`);

    const report = {
      summary: {
        totalDocuments,
        uniqueContent: uniqueCount,
        duplicateGroups,
        totalDuplicates,
        duplicatePercentage: parseFloat(duplicatePercentage.toFixed(2))
      },
      duplicateGroups: duplicates
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    // Generate CSV for easier analysis
    const csvPath = path.join(reportDir, `kcc-content-duplication-${timestamp}.csv`);
    let csvContent = 'Hash,Count,TextLength,URLs\n';

    for (const group of duplicates) {
      csvContent += `${group.hash},${group.count},${group.textLength},"${group.urls.join(', ')}"\n`;
    }

    fs.writeFileSync(csvPath, csvContent);
    console.log(`CSV report saved to: ${csvPath}`);

  } catch (error) {
    console.error('Error analyzing duplicate content:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the analysis
analyzeDuplicateContent().catch(console.error);