# Application Resources

This directory contains resources used by the CowSalt Pro application.

## Application Icon

The application uses icons in various formats for different platforms:

- `icon.ico` - Windows application icon
- `icon.icns` - macOS application icon
- `icon.png` - General-purpose PNG icon (256x256)

### Creating Icons from SVG Template

The `icon_template.svg` provided is a template for the application icon. To create platform-specific icons:

#### For Windows (.ico)

1. Convert SVG to PNG (multiple sizes) using Inkscape or other SVG editor.
2. Use an ICO converter tool (e.g., https://icoconvert.com/) to create a multi-size ICO file with the following sizes:
   - 16x16
   - 32x32
   - 48x48
   - 64x64
   - 128x128
   - 256x256

#### For macOS (.icns)

1. Convert SVG to PNG (multiple sizes) using Inkscape or other SVG editor.
2. Use the `iconutil` command-line tool on macOS:
   ```bash
   # Create .iconset directory
   mkdir icon.iconset
   
   # Generate different sized PNGs
   sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   
   # Convert iconset to icns file
   iconutil -c icns icon.iconset
   ```

#### For Linux

Use the PNG format in various sizes (16x16, 32x32, 64x64, 128x128, 256x256).

## Other Resources

Add other application resources (images, sounds, etc.) to this directory as needed:

- Splash screen images
- Background images
- Logo variants
- UI assets

## Resource Usage Guidelines

1. Keep resources organized in subdirectories if there are many files
2. Use descriptive filenames
3. Optimize image files for size
4. Include license information for third-party resources 