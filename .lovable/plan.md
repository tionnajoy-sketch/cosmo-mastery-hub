

## Problem Analysis

The image upload to TJ Blocks is failing because phone camera photos (like the uploaded real estate vocabulary sheets) are typically 3-8MB. When base64-encoded, they grow ~33% larger. This exceeds the Supabase Edge Function's request body size limit (~6MB), causing the request to fail silently or with an error.

Additionally, the system only handles one image file at a time, but the user uploaded two pages.

## Plan

### 1. Client-Side Image Compression (UploadPage.tsx)

Before converting to base64, resize and compress the image on the client side using an HTML Canvas:
- Scale images down to max 1600px on the longest side (sufficient for OCR/text reading)
- Compress to JPEG at 0.7 quality
- This typically reduces a 5MB phone photo to ~200-400KB base64
- Apply this compression in the `convertToBlocks` function before sending to the edge function

### 2. Multi-Image Support (UploadPage.tsx)

Allow users to select multiple image files at once:
- When multiple images are selected, process each as a separate "page/chunk"
- Each image gets its own call to the edge function with `chunkIndex` and `totalChunks`
- All resulting blocks are combined into a single module
- Update the file input to accept `multiple` for images

### 3. Edge Function Robustness (process-upload/index.ts)

- Add a size check and log for the incoming `imageDataUrl` length
- Increase the timeout slightly for image processing (images take longer for the AI to analyze)
- Ensure proper error messages are returned when the payload is too large

### Technical Details

**Image compression utility** (new helper in UploadPage or a lib file):
```
compressImage(file: File, maxDimension: 1600, quality: 0.7) → Promise<string>
```
Uses `createImageBitmap` + `canvas.toBlob` to resize and compress, then `FileReader.readAsDataURL` on the resulting blob.

**Multi-file flow**:
- File input gets `multiple` attribute when image types are detected
- Each image becomes its own content chunk with its own `imageDataUrl`
- The edge function processes each independently, returning blocks per image
- All blocks merge into one module

### Files to Modify

1. **src/pages/UploadPage.tsx** — Add image compression, multi-image support, update file input
2. **supabase/functions/process-upload/index.ts** — Add payload size logging, better error handling for large payloads

