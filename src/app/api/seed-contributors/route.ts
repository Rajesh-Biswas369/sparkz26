import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.env.APPDATA || process.env.USERPROFILE || '', '.gemini', 'antigravity-ide', 'brain', 'ed607415-6ba8-4096-a298-8806799708b6', 'scratch', 'contributors.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Contributors JSON file not found at ' + filePath }, { status: 404 });
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const contributors = JSON.parse(fileContents);
    
    if (!db) {
      return NextResponse.json({ error: 'Firebase DB not initialized' }, { status: 500 });
    }

    let count = 0;
    for (const contributor of contributors) {
      const docRef = doc(db, 'contributors', contributor.rollNumber);
      await setDoc(docRef, contributor);
      count++;
    }

    return NextResponse.json({ success: true, count, message: `Successfully seeded ${count} contributors.` });
  } catch (error: any) {
    console.error('Error seeding contributors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
