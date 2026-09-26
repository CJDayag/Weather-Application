from PIL import Image
import os

# Define target size (width x height)
target_size = (1080, 1528)

# Input and output directories
input_dir = 'input_images'
output_dir = 'resized_images'

# Make sure output directory exists
os.makedirs(output_dir, exist_ok=True)

# Loop through each PNG image in the input directory
for filename in os.listdir(input_dir):
    if filename.lower().endswith('.png'):
        image_path = os.path.join(input_dir, filename)
        image = Image.open(image_path)

        # Resize image while maintaining aspect ratio, padding if needed
        resized = image.resize(target_size, Image.LANCZOS)
        resized.save(os.path.join(output_dir, filename))

        print(f"Resized {filename} to {target_size}")
