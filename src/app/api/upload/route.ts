import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename with sanitized original name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${Date.now()}-${sanitizedFileName}`
    const filePath = path.join(uploadDir, uniqueFilename)
    
    // Save the file
    await fs.writeFile(filePath, buffer)

    // Return the public URL
    const imageUrl = `/uploads/${uniqueFilename}`
    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    )
  }
} 