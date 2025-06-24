// Setup script to create Supabase Storage bucket for uploaded PDFs
import { supabase } from '../supabase';

export async function setupStorageBucket() {
  try {
    console.log('Checking if papers bucket exists...');
    
    // Try to access the bucket first
    const { error: listError } = await supabase.storage
      .from('papers')
      .list('', { limit: 1 });

    if (listError) {
      if (listError.message?.includes('not found') || listError.message?.includes('does not exist')) {
        console.log('Papers bucket does not exist. Please create it manually in Supabase Dashboard.');
        console.log('Instructions:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to Storage');
        console.log('3. Create a new bucket named "papers"');
        console.log('4. Set it as Public');
        console.log('5. Allow PDF uploads');
        return false;
      } else {
        console.warn('Storage access issue:', listError.message);
        return false;
      }
    }

    console.log('Papers bucket exists and is accessible!');
    return true;
  } catch (error) {
    console.warn('Error checking storage bucket:', error);
    return false;
  }
}

// Function to test if storage is working properly
export async function testStorageAccess() {
  try {
    // Try to list files in the bucket
    const { error } = await supabase.storage
      .from('papers')
      .list('uploads', {
        limit: 1
      });

    if (error) {
      console.error('Storage access test failed:', error);
      return false;
    }

    console.log('Storage access test passed!');
    return true;
  } catch (error) {
    console.error('Storage access test error:', error);
    return false;
  }
}
