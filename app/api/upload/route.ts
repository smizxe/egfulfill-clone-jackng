import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file = data.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary using a stream (or simple buffer upload)
        const result = await new Promise<any>((resolve, reject) => {
            console.log('Starting Cloudinary upload...');
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'egfulfill-products',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Stream Error:', error);
                        reject(error);
                    } else {
                        console.log('Upload successful:', result?.secure_url);
                        resolve(result);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error: any) {
        console.error('Upload Route Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
