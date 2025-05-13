import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function uploadImage(file: File): Promise<string> {
  const supabase = createClientComponentClient();
  
  // Generate a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `question_set_images/${fileName}`;

  // Upload the file
  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const supabase = createClientComponentClient();
  
  // Extract the file path from the URL
  const filePath = url.split('/').pop();
  if (!filePath) return;

  // Delete the file
  const { error } = await supabase.storage
    .from('images')
    .remove([`question_set_images/${filePath}`]);

  if (error) {
    throw error;
  }
} 