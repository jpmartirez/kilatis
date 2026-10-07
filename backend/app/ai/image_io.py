"""
Opening uploaded images.

Phones often save photos sideways and store the correct direction in an EXIF tag.
Branch 1 must look at the picture the right way up, so we apply that tag here.
"""
import pillow_heif
from PIL import Image, ImageFile, ImageOps

pillow_heif.register_heif_opener()   # lets Pillow open HEIC / HEIF photos from iPhones
ImageFile.LOAD_TRUNCATED_IMAGES = True  # still open files that are slightly cut off
Image.MAX_IMAGE_PIXELS = None           # allow very large photos


def open_upright_rgb(path: str) -> Image.Image:
    """Open an image as RGB and turn it the right way up using its EXIF orientation."""
    return ImageOps.exif_transpose(Image.open(path).convert("RGB"))
