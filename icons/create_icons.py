#!/usr/bin/env python3
"""
Simple script to create basic PNG icons for the extension.
Run with: python3 create_icons.py
"""

import struct
import os

def create_simple_png(width, height, color):
    """Create a simple solid color PNG"""
    
    def write_png_chunk(f, chunk_type, data):
        f.write(struct.pack('>I', len(data)))
        f.write(chunk_type)
        f.write(data)
        crc = 0xffffffff
        for byte in chunk_type + data:
            if isinstance(byte, int):
                byte = bytes([byte])
            elif isinstance(byte, str):
                byte = byte.encode()
            for b in byte:
                crc ^= b
                for _ in range(8):
                    if crc & 1:
                        crc = (crc >> 1) ^ 0xedb88320
                    else:
                        crc >>= 1
        f.write(struct.pack('>I', crc ^ 0xffffffff))
    
    # Create simple colored square
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # Create gradient from purple to blue
            ratio = x / width
            r = int(102 + (118 - 102) * ratio)  # 667eea to 764ba2
            g = int(126 + (75 - 126) * ratio)
            b = int(234 + (162 - 234) * ratio)
            
            # Add white border
            if x < 2 or x >= width-2 or y < 2 or y >= height-2:
                row.extend([255, 255, 255])  # White border
            else:
                row.extend([r, g, b])  # Gradient fill
        pixels.extend(row)
    
    filename = f'icon{width}.png'
    with open(filename, 'wb') as f:
        # PNG signature
        f.write(bytes([137, 80, 78, 71, 13, 10, 26, 10]))
        
        # IHDR chunk
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # RGB
        write_png_chunk(f, b'IHDR', ihdr)
        
        # IDAT chunk (simplified - no compression)
        idat_data = b''
        for y in range(height):
            idat_data += b'\\x00'  # No filter
            for x in range(width):
                idx = (y * width + x) * 3
                idat_data += bytes(pixels[idx:idx+3])
        
        import zlib
        compressed = zlib.compress(idat_data)
        write_png_chunk(f, b'IDAT', compressed)
        
        # IEND chunk
        write_png_chunk(f, b'IEND', b'')
    
    return filename

# Create icons
sizes = [16, 48, 128]
for size in sizes:
    filename = create_simple_png(size, size, (102, 126, 234))
    print(f"Created {filename}")